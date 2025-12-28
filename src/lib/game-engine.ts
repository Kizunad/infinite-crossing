import {
  generateObject,
  generateText,
  JSONParseError,
  type RepairTextFunction,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { buildSystemPrompt, loadAgentPrompt } from './agents/prompt-loader';
import { getModelForAgent } from './model-config';
import {
  JudgeAgentSchema,
  NarratorAgentSchema,
  QuestAgentSchema,
  WorldAgentSchema,
} from './agents/schemas';
import type {
  JudgeOption,
  JudgeVerdict,
  PlayerProfile,
  QuestOutput,
  TurnContext,
  WorldState,
} from '@/types/game';

const MAX_RETRIES = 2;

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.BASE_URL;

const openaiProvider = createOpenAI({
  apiKey,
  baseURL,
});

const JSON_CONTRACT_PREFIX = [
  '你必须只输出一个合法的 JSON 对象，且只能输出这一个对象。',
  '不要输出 Markdown、标题、解释、注释、代码块标记、分隔线或任何多余字符。',
  '输出必须以 `{` 开头并以 `}` 结尾；JSON 前后不得出现任何字符。',
  '除非字段明确要求英文枚举值，否则所有可读文本必须使用简体中文。',
].join('\n');

function extractJsonObject(text: string): string | null {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  return text.slice(firstBrace, lastBrace + 1);
}

function canParseJsonObject(text: string): boolean {
  try {
    const parsed = JSON.parse(text) as unknown;
    return Boolean(parsed) && typeof parsed === 'object' && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

function makeRepairText(
  model: unknown,
  schemaTemplate: string,
  fallbackJson: string
): RepairTextFunction {
  return async ({ text, error }) => {
    const extracted = extractJsonObject(text);
    const candidate = extracted ?? text;

    if (JSONParseError.isInstance(error) && extracted && canParseJsonObject(extracted)) {
      return extracted;
    }

    const baseRepairSystem = [
      '你是一个 JSON 输出修复器。你的任务是把输入文本改写为“严格 JSON 对象”。',
      JSON_CONTRACT_PREFIX,
      '你必须严格遵循给定模板的字段名与层级；不要添加模板之外的字段。',
      '若缺少信息，请填入保守默认值（例如数值变化=0，列表可为空）。',
      '禁止输出示例说明、前言、结语、emoji 或任何非 JSON 字符。',
    ].join('\n');

    const errorHint = `错误信息：${error.message}`;
    const repairPayload = `JSON 模板：\n${schemaTemplate}\n\n${errorHint}\n\n原始文本：\n${candidate}`;

    for (let pass = 0; pass < 2; pass += 1) {
      try {
        const repair = await generateText({
          model: model as any,
          temperature: 0,
          maxOutputTokens: 900,
          system: pass === 0 ? baseRepairSystem : `${baseRepairSystem}\n\n再次强调：只输出 JSON。`,
          messages: [{ role: 'user', content: repairPayload }],
        });

        const repaired = extractJsonObject(repair.text) ?? repair.text;
        if (canParseJsonObject(repaired)) return repaired;
      } catch {
        break;
      }
    }

    return fallbackJson;
  };
}

function makeJsonOnlyUserContent(input: unknown): string {
  return `${JSON_CONTRACT_PREFIX}\n\nINPUT_JSON:\n${JSON.stringify(input)}`;
}

async function withRetries<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('LLM failure');
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function advanceClock(time: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;

  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return time;

  const total = (hours * 60 + mins + minutes) % (24 * 60);
  const nextH = String(Math.floor(total / 60)).padStart(2, '0');
  const nextM = String(total % 60).padStart(2, '0');
  return `${nextH}:${nextM}`;
}

function inferWorldStyle(worldTemplate: string): string {
  const normalized = worldTemplate.toLowerCase();
  if (normalized.includes('mistwood') || worldTemplate.includes('雾隐镇')) {
    return '浓雾、偏远小镇、90年代、压迫感、悬疑恐怖';
  }
  return '沉浸式、第二人称、氛围叙事';
}

function ensureOptions(options: JudgeOption[]): JudgeOption[] {
  if (options.length >= 3) return options.slice(0, 3);

  const fallback: JudgeOption[] = [
    { id: 'opt_observe', text: '观察周围环境', risk_level: 'low', type: 'observation' },
    { id: 'opt_move', text: '谨慎移动以避免暴露', risk_level: 'medium', type: 'stealth' },
    { id: 'opt_act', text: '主动采取行动推进局势', risk_level: 'high', type: 'action' },
  ];

  const merged: JudgeOption[] = [...options];
  for (const opt of fallback) {
    if (merged.length >= 3) break;
    if (merged.some((existing) => existing.id === opt.id)) continue;
    merged.push(opt);
  }

  return merged.slice(0, 3);
}

export type RunTurnResult = {
  verdict: JudgeVerdict;
  next_world_state: WorldState;
  next_player_profile: PlayerProfile;
  next_quest_state: QuestOutput;
};

export async function runTurn(context: TurnContext): Promise<RunTurnResult> {
  if (!apiKey) {
    throw new Error('Missing API Key');
  }

  // Create models for each agent type
  const worldModelId = getModelForAgent('world');
  const questModelId = getModelForAgent('quest');
  const judgeModelId = getModelForAgent('judge');
  const narratorModelId = getModelForAgent('narrator');

  console.log(`[GameEngine] Models - World: ${worldModelId}, Quest: ${questModelId}, Judge: ${judgeModelId}, Narrator: ${narratorModelId}`);

  const worldModel = openaiProvider.chat(worldModelId as any);
  const questModel = openaiProvider.chat(questModelId as any);
  const judgeModel = openaiProvider.chat(judgeModelId as any);
  const narratorModel = openaiProvider.chat(narratorModelId as any);

  const [worldBase, questBase, judgeBase, narratorBase] = await Promise.all([
    loadAgentPrompt('world'),
    loadAgentPrompt('quest'),
    loadAgentPrompt('judge'),
    loadAgentPrompt('narrator'),
  ]);

  const knownLoreContent = context.known_lore && context.known_lore.length > 0
    ? context.known_lore.join('\n')
    : "";

  const worldSystem = buildSystemPrompt(worldBase, [
    { title: 'WORLD_TEMPLATE', content: context.world_template },
    { title: 'KNOWN_LORE', content: knownLoreContent }
  ]);
  const questSystem = buildSystemPrompt(questBase, [{ title: 'WORLD_TEMPLATE', content: context.world_template }]);
  const judgeSystem = buildSystemPrompt(judgeBase, [
    { title: 'WORLD_TEMPLATE', content: context.world_template },
    { title: 'HARD_RULES', content: context.hard_rules },
    { title: 'KNOWN_LORE', content: knownLoreContent }
  ]);
  const narratorSystem = buildSystemPrompt(narratorBase, [
    { title: 'WORLD_STYLE', content: inferWorldStyle(context.world_template) },
    { title: 'KNOWN_LORE', content: knownLoreContent }
  ]);

  const worldSchemaTemplate =
    '{ "environment_change": "...", "npc_reactions": "...", "emerging_risks": ["..."], "sensory_feedback": { "visual": "...", "audio": "...", "smell": "...", "tactile": "...", "mental": "..." } }';
  const questSchemaTemplate =
    '{ "visible_objectives": [ { "id": "obj_1", "text": "...", "status": "active" } ], "intel_logs": [ { "source": "...", "content": "...", "reliability": "unknown" } ], "hidden_agenda": "..." }';
  const judgeSchemaTemplate =
    '{ "turn_id": 1, "is_death": false, "narrative_directives": { "outcome_summary": "...", "tone_instruction": "suspense" }, "state_updates": { "hp_change": 0, "power_change": 0 }, "inventory_updates": [], "options": [ { "id": "opt_1", "text": "...", "risk_level": "medium", "type": "action" } ], "death_report": null }';
  const narratorSchemaTemplate = '{ "narrative_text": "..." }';

  const worldFallbackJson = '{ "environment_change": "", "npc_reactions": "", "emerging_risks": [], "sensory_feedback": { "visual": "模糊不清", "audio": "寂静", "smell": "无", "tactile": "无", "mental": "无" } }';
  const questFallbackJson = '{ "visible_objectives": [], "intel_logs": [], "hidden_agenda": "" }';
  const judgeFallbackJson =
    '{ "turn_id": 1, "is_death": false, "narrative_directives": { "outcome_summary": "系统无法可靠解析本回合裁决输入，已使用保守默认裁决。", "tone_instruction": "悬疑" }, "state_updates": { "hp_change": 0, "power_change": 0 }, "inventory_updates": [], "options": [], "death_report": null }';
  const narratorFallbackJson = '{ "narrative_text": "迷雾沉沉，你只能凭本能维持冷静，谨慎地继续下一步。" }';

  // 1. Generate Dice Roll (1-100)
  const diceRoll = Math.floor(Math.random() * 100) + 1;
  console.log(`[GameEngine] Turn ${context.turn_id} Dice Roll: ${diceRoll}`);

  // Prepare succinct history summary (last 5 turns)
  const historySummary = context.recent_history?.slice(-5).map(h => ({
    turn: h.verdict.turn_id,
    action: h.action,
    outcome: h.verdict.narrative.content
  })) || [];

  // Quest Agent only runs every 4 turns (on turns 1, 5, 9, etc.)
  const shouldRunQuest = context.turn_id % 4 === 1;

  const [worldContext, questContext] = await Promise.all([
    withRetries(async () => {
      const result = await generateObject({
        model: worldModel,
        schema: WorldAgentSchema,
        schemaName: 'WorldAgentResponse',
        system: worldSystem,
        temperature: 0,
        maxOutputTokens: 350,
        messages: [
          {
            role: 'user',
            content: makeJsonOnlyUserContent({
              world_template: context.world_template,
              current_state: context.world_state,
              player_action: context.player_action,
              recent_history: historySummary,
              archived_history: context.compressed_history || "",
            }),
          },
        ],
        experimental_repairText: makeRepairText(worldModel, worldSchemaTemplate, worldFallbackJson),
      });
      return result.object;
    }, MAX_RETRIES),
    shouldRunQuest
      ? withRetries(async () => {
        const result = await generateObject({
          model: questModel,
          schema: QuestAgentSchema,
          schemaName: 'QuestAgentResponse',
          system: questSystem,
          temperature: 0,
          maxOutputTokens: 450,
          messages: [
            {
              role: 'user',
              content: makeJsonOnlyUserContent({
                world_truth: context.world_template,
                player_knowledge: {
                  world_state: context.world_state,
                  player_profile: {
                    stats: context.player_profile.stats,
                    inventory: context.player_profile.inventory,
                    traits: context.player_profile.traits,
                  },
                  quest_state: context.quest_state
                    ? {
                      visible_objectives: context.quest_state.visible_objectives,
                      intel_logs: context.quest_state.intel_logs,
                    }
                    : null,
                  recent_history: historySummary,
                  archived_history: context.compressed_history || "",
                },
              }),
            },
          ],
          experimental_repairText: makeRepairText(questModel, questSchemaTemplate, questFallbackJson),
        });
        return result.object;
      }, MAX_RETRIES)
      : Promise.resolve(context.quest_state ?? {
        visible_objectives: [],
        intel_logs: [],
        hidden_agenda: "",
      }),
  ]);


  const judgeResult = await withRetries(async () => {
    const result = await generateObject({
      model: judgeModel,
      schema: JudgeAgentSchema,
      schemaName: 'JudgeAgentResult',
      system: judgeSystem,
      temperature: 0,
      maxOutputTokens: 600,
      messages: [
        {
          role: 'user',
          content: makeJsonOnlyUserContent({
            turn_id: context.turn_id,
            player_action: context.player_action,
            dice_roll: diceRoll,
            world_context: worldContext,
            quest_context: questContext,
            player_profile: {
              stats: context.player_profile.stats,
              inventory: context.player_profile.inventory,
              traits: context.player_profile.traits,
            },
            hard_rules: context.hard_rules,
            recent_history: historySummary,
            archived_history: context.compressed_history || "",
          }),
        },
      ],
      experimental_repairText: makeRepairText(judgeModel, judgeSchemaTemplate, judgeFallbackJson),
    });
    return result.object;
  }, MAX_RETRIES);

  // Get previous narrative for continuity
  let previousNarrative = "";
  if (context.recent_history && context.recent_history.length > 0) {
    const lastItem = context.recent_history[context.recent_history.length - 1];
    previousNarrative = lastItem.verdict.narrative.content;
  }

  const narratorResult = await withRetries(async () => {
    const result = await generateObject({
      model: narratorModel,
      schema: NarratorAgentSchema,
      schemaName: 'NarratorResult',
      system: narratorSystem,
      temperature: 0.3,
      maxOutputTokens: 700,
      messages: [
        {
          role: 'user',
          content: makeJsonOnlyUserContent({
            judge_outcome: judgeResult.narrative_directives.outcome_summary,
            previous_narrative: previousNarrative,
            dice_roll: diceRoll,
            tone_instruction: judgeResult.narrative_directives.tone_instruction,
            world_style: inferWorldStyle(context.world_template),
            archived_history: context.compressed_history || "",
            recent_history_summary: historySummary,
          }),
        },
      ],
      experimental_repairText: makeRepairText(narratorModel, narratorSchemaTemplate, narratorFallbackJson),
    });
    return result.object;
  }, MAX_RETRIES);

  const options = ensureOptions(judgeResult.options);

  const verdict: JudgeVerdict = {
    turn_id: context.turn_id,
    is_death: judgeResult.is_death,
    is_victory: judgeResult.is_victory ?? false,
    dice_roll: diceRoll,
    narrative: {
      content: narratorResult.narrative_text,
      tone: judgeResult.narrative_directives.tone_instruction,
    },
    state_updates: {
      hp_change: judgeResult.state_updates.hp_change,
      power_change: judgeResult.state_updates.power_change,
    },
    options,
    death_report: judgeResult.death_report ?? null,
  };

  // Process Inventory Updates from Judge
  let nextInventory = [...context.player_profile.inventory];
  if (judgeResult.inventory_updates && Array.isArray(judgeResult.inventory_updates)) {
    for (const update of judgeResult.inventory_updates) {
      if (update.action === 'add') {
        // Prevent duplicates by ID
        if (!nextInventory.some(i => i.id === update.item.id)) {
          nextInventory.push(update.item);
        }
      } else if (update.action === 'remove') {
        nextInventory = nextInventory.filter(i => i.id !== update.item.id);
      }
    }
  }

  const next_player_profile: PlayerProfile = {
    ...context.player_profile,
    status: verdict.is_death ? 'dead' : verdict.is_victory ? 'ascended' : context.player_profile.status,
    stats: {
      hp: Math.max(0, Math.min(context.player_profile.stats.max_hp, context.player_profile.stats.hp + verdict.state_updates.hp_change)),
      max_hp: context.player_profile.stats.max_hp, // Usually static
      power: Math.max(0, context.player_profile.stats.power + (verdict.state_updates.power_change || 0)),
    },
    inventory: nextInventory
  };

  const next_world_state: WorldState = {
    ...context.world_state,
    turn_count: context.turn_id,
    environment: {
      ...context.world_state.environment,
      time: advanceClock(context.world_state.environment.time, 5),
    },
    active_threats: Array.from(
      new Set([...context.world_state.active_threats, ...worldContext.emerging_risks])
    ),
  };

  const next_quest_state: QuestOutput = {
    visible_objectives: questContext.visible_objectives,
    intel_logs: questContext.intel_logs,
    hidden_agenda: questContext.hidden_agenda,
  };

  return {
    verdict,
    next_world_state,
    next_player_profile,
    next_quest_state,
  };
}
