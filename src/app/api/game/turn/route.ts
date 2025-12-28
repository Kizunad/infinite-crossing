import { NextResponse } from 'next/server';
import { runTurn } from '@/lib/game-engine';
import { getSession, saveSession } from '@/lib/session-store';
import { normalizeTurnRequest, TurnRequestSchema } from '@/lib/api/turn-request';
import { sanitizeQuestState } from '@/lib/api/sanitize';
import { TurnContext, GameHistoryItem } from '@/types/game';
import { compressHistory, COMPRESSION_CONFIG } from '@/lib/agents/compressor-agent';
import { generateEnvState, ENVSTATE_CONFIG } from '@/lib/agents/envstate-agent';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

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

    const parsed = TurnRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error_message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { session_id, player_action } = normalizeTurnRequest(parsed.data);
    const session = await getSession(session_id);
    if (!session) {
      return NextResponse.json(
        { error_message: 'Session not found' },
        { status: 404 }
      );
    }

    const nextTurnId = session.world_state.turn_count + 1;
    const context: TurnContext = {
      turn_id: nextTurnId,
      world_template: session.world_template,
      hard_rules: session.hard_rules,
      player_action,
      world_state: session.world_state,
      player_profile: session.player_profile,
      quest_state: session.quest_state,
      recent_history: session.history ? session.history.slice(-20) : [],
      compressed_history: session.compressed_history,
    };

    const result = await runTurn(context);

    // Save history item to session for future compression
    const historyItem: GameHistoryItem = {
      action: player_action.content,
      verdict: result.verdict,
    };

    const updatedSession = {
      ...session,
      world_state: result.next_world_state,
      player_profile: result.next_player_profile,
      quest_state: result.next_quest_state,
      history: [...(session.history || []), historyItem],
    };

    await saveSession(updatedSession);

    // Async history compression trigger (every 10 turns)
    const currentTurn = result.next_world_state.turn_count;
    const lastCompressionTurn = session.last_compression_turn || 0;
    const shouldCompress = currentTurn >= COMPRESSION_CONFIG.TRIGGER_INTERVAL &&
      (currentTurn - lastCompressionTurn) >= COMPRESSION_CONFIG.TRIGGER_INTERVAL;

    if (shouldCompress) {
      // Fire-and-forget async compression
      (async () => {
        try {
          console.log(`[TurnAPI] Triggering background compression at turn ${currentTurn}`);
          const recentSession = await getSession(session_id);
          if (!recentSession || !recentSession.history || recentSession.history.length === 0) return;

          // Calculate split point
          const splitIndex = Math.floor(recentSession.history.length * (1 - COMPRESSION_CONFIG.RECENT_HISTORY_RATIO));
          const historyToCompress = recentSession.history.slice(0, splitIndex);
          const remainingHistory = recentSession.history.slice(splitIndex);

          if (historyToCompress.length > 0) {
            const newCompressedHistory = await compressHistory(
              historyToCompress,
              recentSession.compressed_history || ''
            );

            // Re-fetch to ensure we don't overwrite other updates during async work
            const sessionToSave = await getSession(session_id);
            if (sessionToSave) {
              await saveSession({
                ...sessionToSave,
                compressed_history: newCompressedHistory,
                history: remainingHistory,
                last_compression_turn: currentTurn,
              });
              console.log(`[TurnAPI] Background compression complete for ${historyToCompress.length} turns.`);
            }
          }
        } catch (e) {
          console.error('[TurnAPI] Async compression failed:', e);
        }
      })();
    }

    // EnvState generation trigger (every 10 turns, or if never initialized)
    const lastEnvStateTurn = session.last_envstate_turn;
    const shouldUpdateEnvState = lastEnvStateTurn === undefined ||
      (currentTurn - lastEnvStateTurn) >= ENVSTATE_CONFIG.UPDATE_INTERVAL;

    let envStateData = null;
    if (shouldUpdateEnvState) {
      try {
        console.log(`[TurnAPI] Generating EnvState at turn ${currentTurn}`);
        envStateData = await generateEnvState(
          result.verdict.narrative.content,
          result.next_world_state
        );
        // Update session with last envstate turn and data
        const latestSession = await getSession(session_id);
        if (latestSession) {
          await saveSession({
            ...latestSession,
            last_envstate_turn: currentTurn,
            env_state: envStateData,
          });
        }
        console.log(`[TurnAPI] EnvState generated with ${envStateData.senses.length} senses`);
      } catch (e) {
        console.error('[TurnAPI] EnvState generation failed:', e);
      }
    }

    // Return full state updates (matching prefetch API format)
    return NextResponse.json({
      verdict: result.verdict,
      next_world_state: result.next_world_state,
      next_player_profile: result.next_player_profile,
      next_quest_state: result.next_quest_state ? sanitizeQuestState(result.next_quest_state) : null,
      env_state: envStateData,
    });
  } catch (error) {
    console.error('Turn API Error:', error);
    return NextResponse.json(
      { error_message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
