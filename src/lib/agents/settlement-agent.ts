/**
 * Settlement Agent
 * 
 * 负责处理游戏开始和结束时的结算逻辑：
 * 1. Initialize: 计算携带物品的惩罚
 * 2. Settle: 提取 Lore, 计算解锁, 生成 Run Summary
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { loadAgentPrompt, buildSystemPrompt } from './prompt-loader';
import { ArchivistAgentSchema } from './schemas';
import { getModelForAgent } from '../model-config';
import type { PlayerProfile, GameHistoryItem } from '@/types/game';
import type {
    CarriedItem,
    SettlementInitRequest,
    SettlementInitResult,
    SettlementEndRequest,
    SettlementEndResult,
    AppliedPenalty,
    SettlementAtlasEntry,
    SettlementRunSummary,
} from '@/types/settlement';

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.BASE_URL;
const openaiProvider = createOpenAI({ apiKey, baseURL });

/**
 * Settlement Agent 类
 * 统一处理游戏开始和结束时的结算计算
 */
export class SettlementAgent {

    /**
     * 游戏开始时: 计算携带物品的惩罚并应用到 PlayerProfile
     */
    static async initialize(request: SettlementInitRequest): Promise<SettlementInitResult> {
        const { carried_items, base_player_profile } = request;

        // 深拷贝 profile 避免修改原对象
        const modifiedProfile: PlayerProfile = JSON.parse(JSON.stringify(base_player_profile));
        const appliedPenalties: AppliedPenalty[] = [];
        const warnings: string[] = [];

        // 遍历携带的物品，检查并应用惩罚
        for (const item of carried_items) {
            if (!item.carry_penalty) continue;

            const penalty = item.carry_penalty;
            const statChange: Record<string, number> = {};

            switch (penalty.type) {
                case 'max_hp_reduction':
                    modifiedProfile.stats.max_hp = Math.max(1, modifiedProfile.stats.max_hp - penalty.value);
                    modifiedProfile.stats.hp = Math.min(modifiedProfile.stats.hp, modifiedProfile.stats.max_hp);
                    statChange['max_hp'] = -penalty.value;
                    break;

                case 'power_reduction':
                    modifiedProfile.stats.power = Math.max(1, modifiedProfile.stats.power - penalty.value);
                    statChange['power'] = -penalty.value;
                    break;

                case 'trait_curse':
                    // 添加诅咒 trait
                    modifiedProfile.traits.push({
                        id: `curse_${item.id}`,
                        name: `${item.name}的诅咒`,
                        effect: penalty.description,
                    });
                    statChange['trait'] = 1; // 表示添加了 1 个诅咒 trait
                    break;
            }

            appliedPenalties.push({
                item_name: item.name,
                penalty_description: penalty.description,
                stat_change: statChange,
            });

            // 生成警告信息
            warnings.push(`⚠️ ${item.name}: ${penalty.description}`);
        }

        return {
            modified_profile: modifiedProfile,
            applied_penalties: appliedPenalties,
            warnings,
        };
    }

    /**
     * 游戏结束时: 提取 Lore, 计算解锁, 生成 Run Summary
     * 
     * 通过 Archivist Agent 进行 AI 辅助提取 Lore。
     */
    static async settle(request: SettlementEndRequest): Promise<SettlementEndResult> {
        const {
            outcome,
            game_history,
            final_player_profile,
            final_world_state,
            carried_items,
            world_template,
            existing_topics,
        } = request;

        // 1. 计算 turns survived
        const turnsSurvived = game_history.length;

        // 2. Lore 提取 - 调用 Archivist Agent
        let newAtlasEntries: SettlementAtlasEntry[] = [];
        let aiRunSummary: string | null = null;

        try {
            const archivistResult = await SettlementAgent.extractLoreFromHistory(
                game_history,
                final_world_state.world_id,
                world_template || '',
                existing_topics || []
            );
            newAtlasEntries = archivistResult.new_entries;
            aiRunSummary = archivistResult.run_summary;
        } catch (e) {
            console.error('[SettlementAgent] Archivist extraction failed:', e);
            // Fallback: use empty entries, generate simple summary below
        }

        // 3. 生成 Run Summary (优先使用 AI 生成的)
        const runSummary: SettlementRunSummary = {
            world_id: final_world_state.world_id,
            summary: aiRunSummary || SettlementAgent.generateSimpleSummary(outcome, turnsSurvived, final_player_profile),
            outcome: outcome === 'victory' ? 'mastery' : outcome,
            turns_survived: turnsSurvived,
        };

        // 4. 解锁物品 - 当前为空，后续可根据 outcome 解锁
        const unlockedItems: SettlementEndResult['unlocked_items'] = [];

        // 5. 永久性 stat 变化 (目前仅记录携带物品的惩罚效果)
        const permanentStatChanges: Record<string, number> = {};
        for (const item of carried_items) {
            if (item.carry_penalty?.type === 'max_hp_reduction') {
                permanentStatChanges['max_hp'] = (permanentStatChanges['max_hp'] || 0) - item.carry_penalty.value;
            }
        }

        return {
            new_atlas_entries: newAtlasEntries,
            run_summary: runSummary,
            unlocked_items: unlockedItems,
            permanent_stat_changes: permanentStatChanges,
        };
    }

    /**
     * 调用 Archivist Agent 从游戏历史中提取 Lore
     */
    private static async extractLoreFromHistory(
        history: GameHistoryItem[],
        worldId: string,
        worldTemplate: string,
        existingTopics: string[]
    ): Promise<{ new_entries: SettlementAtlasEntry[]; run_summary: string }> {
        if (!apiKey) {
            console.warn('[SettlementAgent] No API key, skipping Archivist call');
            return { new_entries: [], run_summary: '' };
        }

        const archivistModelId = getModelForAgent('archivist');
        console.log(`[SettlementAgent] Using Archivist model: ${archivistModelId}`);
        const archivistModel = openaiProvider.chat(archivistModelId as Parameters<typeof openaiProvider.chat>[0]);

        const archivistBase = await loadAgentPrompt('archivist');
        const systemPrompt = buildSystemPrompt(archivistBase, []);

        // 优化历史: 仅发送叙事内容以节省 tokens
        const narrativeHistory = history.map((h) =>
            `Turn ${h.verdict.turn_id}: Player "${h.action}" -> Result: ${h.verdict.narrative.content} (Death: ${h.verdict.is_death})`
        ).join('\n');

        const result = await generateText({
            model: archivistModel,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: JSON.stringify({
                        world_template: worldTemplate || worldId,
                        play_history: narrativeHistory,
                        existing_topics: existingTopics,
                    }),
                },
            ],
        });

        let cleanedText = result.text.trim();
        // 移除 Markdown 代码块标记
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
        }

        try {
            const parsed = JSON.parse(cleanedText);
            const validData = ArchivistAgentSchema.parse(parsed);

            // 转换为 SettlementAtlasEntry 格式
            const entries: SettlementAtlasEntry[] = validData.new_entries.map((e) => ({
                topic: e.topic,
                category: e.category,
                description: e.description,
            }));

            return {
                new_entries: entries,
                run_summary: validData.run_summary,
            };
        } catch (parseError) {
            console.error('[SettlementAgent] Failed to parse Archivist response:', parseError);
            return { new_entries: [], run_summary: '' };
        }
    }

    /**
     * 生成简化的 Run Summary 文本
     */
    private static generateSimpleSummary(
        outcome: 'death' | 'victory' | 'escape',
        turns: number,
        profile: PlayerProfile
    ): string {
        const name = profile.name || '特工';

        switch (outcome) {
            case 'death':
                return `${name}在第${turns}回合陨落。最终生命值：${profile.stats.hp}/${profile.stats.max_hp}。`;
            case 'victory':
                return `${name}在第${turns}回合成功完成任务，揭开了世界的秘密。`;
            case 'escape':
                return `${name}在第${turns}回合选择撤离，保全了性命。`;
            default:
                return `${name}的任务在第${turns}回合结束。`;
        }
    }
}
