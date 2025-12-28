import { NextResponse } from 'next/server';
import { getSession, saveSession } from '@/lib/session-store';
import { generateEnvState, ENVSTATE_CONFIG } from '@/lib/agents/envstate-agent';
import { z } from 'zod';

export const runtime = 'nodejs';

/**
 * Lightweight sync endpoint for Fast Sim mode.
 * Saves cached result to session without re-running the game engine.
 */

const SyncRequestSchema = z.object({
    session_id: z.string(),
    next_world_state: z.any(),
    next_player_profile: z.any(),
    next_quest_state: z.any().nullable(),
    verdict: z.any().optional(), // Added verdict for EnvState input
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = SyncRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error_message: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { session_id, next_world_state, next_player_profile, next_quest_state, verdict } = parsed.data;

        const session = await getSession(session_id);
        if (!session) {
            return NextResponse.json(
                { error_message: 'Session not found' },
                { status: 404 }
            );
        }

        // EnvState generation logic (same as turn API)
        let envStateData = null;
        if (verdict) {
            const currentTurn = next_world_state.turn_count;
            const lastEnvStateTurn = session.last_envstate_turn;
            const shouldUpdateEnvState = lastEnvStateTurn === undefined ||
                (currentTurn - lastEnvStateTurn) >= ENVSTATE_CONFIG.UPDATE_INTERVAL;

            if (shouldUpdateEnvState) {
                try {
                    console.log(`[SyncAPI] Generating EnvState at turn ${currentTurn}`);
                    envStateData = await generateEnvState(
                        verdict.narrative.content,
                        next_world_state
                    );
                    console.log(`[SyncAPI] EnvState generated with ${envStateData.senses.length} senses`);
                } catch (e) {
                    console.error('[SyncAPI] EnvState generation failed:', e);
                }
            }
        }

        // Save session with optional new EnvState
        await saveSession({
            ...session,
            world_state: next_world_state,
            player_profile: next_player_profile,
            quest_state: next_quest_state,
            ...(envStateData ? {
                last_envstate_turn: next_world_state.turn_count,
                env_state: envStateData
            } : {})
        });

        return NextResponse.json({ success: true, env_state: envStateData });
    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json(
            { error_message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
