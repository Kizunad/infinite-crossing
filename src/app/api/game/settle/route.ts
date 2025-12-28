import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session-store';
import { WORLD_TEMPLATES } from '@/lib/world-constants';
import { SettlementAgent } from '@/lib/agents/settlement-agent';
import type { LootItem, SettlementResult, SettlementEndRequest } from '@/types/settlement';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Legacy loot selection schema
const LootSettleSchema = z.object({
    session_id: z.string().min(1),
    chosen_loot_id: z.string().min(1),
    loot_source: z.enum(['loot_pool', 'inventory']),
});

// New Settlement Agent schema
const AgentSettleSchema = z.object({
    session_id: z.string().min(1),
    outcome: z.enum(['death', 'victory', 'escape']),
    game_history: z.array(z.object({
        action: z.string(),
        verdict: z.any(),
    })),
    carried_items: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        carry_penalty: z.object({
            type: z.enum(['max_hp_reduction', 'power_reduction', 'trait_curse']),
            value: z.number(),
            description: z.string()
        }).optional()
    })).optional().default([]),
    world_template: z.string().optional(),
    existing_topics: z.array(z.string()).optional().default([]),
});

export async function POST(req: Request) {
    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { success: false, error_message: 'Invalid JSON body', chosen_loot: null } satisfies SettlementResult,
                { status: 400 }
            );
        }

        // Try parsing as AgentSettleSchema first (new flow)
        const agentParsed = AgentSettleSchema.safeParse(body);
        if (agentParsed.success) {
            // New Settlement Agent flow
            const session = await getSession(agentParsed.data.session_id);
            if (!session) {
                return NextResponse.json(
                    { error_message: 'Session not found' },
                    { status: 404 }
                );
            }

            const settlementRequest: SettlementEndRequest = {
                session_id: agentParsed.data.session_id,
                outcome: agentParsed.data.outcome,
                game_history: agentParsed.data.game_history,
                final_player_profile: session.player_profile,
                final_world_state: session.world_state,
                carried_items: agentParsed.data.carried_items,
                world_template: agentParsed.data.world_template,
                existing_topics: agentParsed.data.existing_topics,
            };

            const result = await SettlementAgent.settle(settlementRequest);

            return NextResponse.json({
                success: true,
                settlement_result: {
                    new_atlas_entries: result.new_atlas_entries,
                    run_summary: result.run_summary,
                    unlocked_items: result.unlocked_items,
                    permanent_stat_changes: result.permanent_stat_changes,
                },
                // Legacy compatibility
                chosen_loot: null,
            });
        }

        // Legacy loot selection flow
        const parsed = LootSettleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error_message: 'Invalid request body', chosen_loot: null } satisfies SettlementResult,
                { status: 400 }
            );
        }

        const { session_id, chosen_loot_id, loot_source } = parsed.data;

        const session = await getSession(session_id);
        if (!session) {
            return NextResponse.json(
                { success: false, error_message: 'Session not found', chosen_loot: null } satisfies SettlementResult,
                { status: 404 }
            );
        }

        let chosenLoot: LootItem | null = null;

        if (loot_source === 'loot_pool') {
            const worldKey = Object.keys(WORLD_TEMPLATES).find(
                (key) => WORLD_TEMPLATES[key].world_id === session.world_state.world_id
            );

            if (worldKey) {
                const worldMeta = WORLD_TEMPLATES[worldKey];
                chosenLoot = worldMeta.loot_pool.find((item) => item.id === chosen_loot_id) ?? null;
            }
        } else if (loot_source === 'inventory') {
            const inventoryItem = session.player_profile.inventory.find((item) => item.id === chosen_loot_id);
            if (inventoryItem) {
                chosenLoot = {
                    id: inventoryItem.id,
                    name: inventoryItem.name,
                    description: inventoryItem.description || '从雾隐镇带回的物品。',
                    type: 'item',
                    side_effect: '无已知副作用。',
                };
            }
        }

        if (!chosenLoot) {
            return NextResponse.json(
                { success: false, error_message: 'Loot item not found', chosen_loot: null } satisfies SettlementResult,
                { status: 404 }
            );
        }

        // Also trigger Lore extraction for legacy loot flow
        let new_atlas_entries: any[] = [];
        let run_summary: any = null;
        try {
            const settlementRequest: SettlementEndRequest = {
                session_id,
                outcome: 'victory', // Loot selection implies victory/escape
                game_history: session.history || [],
                final_player_profile: session.player_profile,
                final_world_state: session.world_state,
                carried_items: [],
                world_template: session.world_template,
                existing_topics: [], // Frontend should pass this ideally
            };
            const settlementResult = await SettlementAgent.settle(settlementRequest);
            new_atlas_entries = settlementResult.new_atlas_entries;
            run_summary = settlementResult.run_summary;
        } catch (e) {
            console.warn('[SettleAPI] Lore extraction failed for legacy flow:', e);
        }

        return NextResponse.json({
            success: true,
            chosen_loot: chosenLoot,
            new_atlas_entries,
            run_summary,
        });
    } catch (error) {
        console.error('Settle API Error:', error);
        return NextResponse.json(
            { success: false, error_message: 'Internal Server Error', chosen_loot: null } satisfies SettlementResult,
            { status: 500 }
        );
    }
}
