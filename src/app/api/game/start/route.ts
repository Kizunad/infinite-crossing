import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadHardRules, loadWorldTemplate } from '@/lib/game-data';
import { runTurn } from '@/lib/game-engine';
import { sanitizeQuestState } from '@/lib/api/sanitize';
import { createSession } from '@/lib/session-store';
import { SettlementAgent } from '@/lib/agents/settlement-agent';
import { generateEnvState } from '@/lib/agents/envstate-agent';
import { PlayerProfile, TurnContext, WorldState } from '@/types/game';
import type { CarriedItem } from '@/types/settlement';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const StartRequestSchema = z
  .object({
    worldId: z.string().min(1).optional(),
    world_id: z.string().min(1).optional(),
    world_template_id: z.string().min(1).optional(),
    known_lore: z.array(z.string()).optional(),
    generated_world_template: z.string().optional(), // For dynamically generated worlds
    extra_items: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional().default(''),
      type: z.string().default('misc'),
      carry_penalty: z.object({
        type: z.enum(['max_hp_reduction', 'power_reduction', 'trait_curse']),
        value: z.number(),
        description: z.string()
      }).optional()
    })).optional()
  })
  .strict();

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error_message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = StartRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error_message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const worldTemplateId =
      parsed.data.world_template_id ?? parsed.data.worldId ?? parsed.data.world_id ?? 'mistwood';

    // Check if this is a generated world
    const isGeneratedWorld = worldTemplateId.startsWith('gen_');
    let world_id: string;
    let world_template: string;
    let allowSave: boolean;

    if (isGeneratedWorld && parsed.data.generated_world_template) {
      // Use the passed generated template
      world_id = worldTemplateId;
      world_template = parsed.data.generated_world_template;
      allowSave = true;
    } else {
      // Load from static templates
      const loadedWorld = await loadWorldTemplate(worldTemplateId);
      world_id = loadedWorld.world_id;
      world_template = loadedWorld.world_template;
      allowSave = loadedWorld.allowSave;
    }

    const hardRules = await loadHardRules();

    // Build carried items for Settlement Agent
    const carriedItems: CarriedItem[] = (parsed.data.extra_items || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      carry_penalty: item.carry_penalty,
    }));

    // Base player profile
    const basePlayerProfile: PlayerProfile = {
      id: randomUUID(),
      name: 'Operative',
      current_world_id: world_id,
      status: 'alive',
      stats: { hp: 100, max_hp: 100, power: 10 },
      inventory: carriedItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: 'misc' as const,
      })),
      traits: [],
    };

    // Apply carry penalties via Settlement Agent
    const settlementInit = await SettlementAgent.initialize({
      world_id,
      carried_items: carriedItems,
      base_player_profile: basePlayerProfile,
    });

    const playerProfile = settlementInit.modified_profile;
    const penaltyWarnings = settlementInit.warnings;

    const worldState: WorldState = {
      world_id,
      turn_count: 0,
      environment: {
        time: '18:00',
        weather: '未知',
        location: '未知区域',
      },
      flags: {},
      active_threats: [],
    };

    // Inject dynamic player power into the template
    const dynamicTemplate = world_template.replace(
      '{{PLAYER_POWER}}',
      playerProfile.stats.power.toString()
    );

    const context: TurnContext = {
      turn_id: 1,
      world_template: dynamicTemplate,
      hard_rules: hardRules,
      player_action: { type: 'free_text', content: '开始游戏，观察周围。' },
      world_state: worldState,
      player_profile: playerProfile,
      quest_state: null,
      known_lore: parsed.data.known_lore,
    };

    const result = await runTurn(context);

    // Generate initial EnvState
    let initialEnvState = null;
    try {
      initialEnvState = await generateEnvState(
        result.verdict.narrative.content,
        result.next_world_state
      );
      console.log(`[StartAPI] Initial EnvState generated with ${initialEnvState.senses.length} senses`);
    } catch (e) {
      console.error('[StartAPI] Initial EnvState generation failed:', e);
    }

    const session = await createSession({
      world_template_id: worldTemplateId,
      world_template: dynamicTemplate,
      hard_rules: hardRules,
      world_state: result.next_world_state,
      player_profile: result.next_player_profile,
      quest_state: result.next_quest_state,
      last_envstate_turn: 1,
      env_state: initialEnvState || undefined,
    });

    return NextResponse.json({
      session_id: session.session_id,
      initial_verdict: result.verdict,
      player_profile: session.player_profile,
      world_state: session.world_state,
      quest_state: session.quest_state ? sanitizeQuestState(session.quest_state) : null,
      env_state: initialEnvState,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unknown world_template_id:')) {
      return NextResponse.json(
        { error_message: error.message },
        { status: 400 }
      );
    }

    console.error('Start API Error:', error);
    return NextResponse.json(
      { error_message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
