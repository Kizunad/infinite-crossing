import { NextResponse } from 'next/server';
import { runTurn, RunTurnResult } from '@/lib/game-engine';
import { getSession } from '@/lib/session-store';
import { TurnContext } from '@/types/game';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

interface PrefetchRequest {
    session_id: string;
    options: string[]; // Array of option text strings
}

interface PrefetchResult {
    [optionText: string]: RunTurnResult | { error: string };
}

export async function POST(req: Request) {
    try {
        const body: PrefetchRequest = await req.json();
        const { session_id, options } = body;

        if (!session_id || !options || !Array.isArray(options) || options.length === 0) {
            return NextResponse.json(
                { error_message: 'Missing session_id or options array' },
                { status: 400 }
            );
        }

        const session = await getSession(session_id);
        if (!session) {
            return NextResponse.json(
                { error_message: 'Session not found' },
                { status: 404 }
            );
        }

        // Prepare base context (we simulate the NEXT turn for each option)
        const nextTurnId = session.world_state.turn_count + 1;
        const baseContext: Omit<TurnContext, 'player_action'> = {
            turn_id: nextTurnId,
            world_template: session.world_template,
            hard_rules: session.hard_rules,
            world_state: session.world_state,
            player_profile: session.player_profile,
            quest_state: session.quest_state,
        };

        // Run all options in parallel
        const results = await Promise.all(
            options.map(async (optionText): Promise<[string, RunTurnResult | { error: string }]> => {
                try {
                    const context: TurnContext = {
                        ...baseContext,
                        player_action: { type: 'choice', content: optionText },
                    };
                    const result = await runTurn(context);
                    return [optionText, result];
                } catch (error) {
                    console.error(`Prefetch failed for option "${optionText}":`, error);
                    return [optionText, { error: 'Failed to generate' }];
                }
            })
        );

        // Convert array of tuples to object
        const prefetchResult: PrefetchResult = Object.fromEntries(results);

        // NOTE: We do NOT save the session here - this is speculative.
        // The session is only saved when the user actually picks an option via /api/game/turn.

        return NextResponse.json(prefetchResult);
    } catch (error) {
        console.error('Prefetch API Error:', error);
        return NextResponse.json(
            { error_message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
