import { NextResponse } from 'next/server';
import { getSession, saveSession } from '@/lib/session-store';
import { compressHistory, COMPRESSION_CONFIG } from '@/lib/agents/compressor-agent';
import { GameHistoryItem } from '@/types/game';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute for compression

const CompressRequestSchema = z.object({
    session_id: z.string(),
    history: z.array(z.object({
        action: z.string(),
        verdict: z.object({
            turn_id: z.number(),
            narrative: z.object({ content: z.string() }),
            state_updates: z.object({ hp_change: z.number() }),
        }).passthrough(),
    })),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CompressRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const { session_id, history } = parsed.data;
        const session = await getSession(session_id);

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const currentTurn = session.world_state.turn_count;

        // Calculate split point: compress oldest 40%, keep recent 60%
        const splitIndex = Math.floor(history.length * (1 - COMPRESSION_CONFIG.RECENT_HISTORY_RATIO));
        const historyToCompress = history.slice(0, splitIndex);

        if (historyToCompress.length === 0) {
            return NextResponse.json({
                compressed_history: session.compressed_history || '',
                message: 'No history to compress'
            });
        }

        console.log(`[CompressAPI] Compressing ${historyToCompress.length} of ${history.length} turns`);

        const newCompressedHistory = await compressHistory(
            historyToCompress,
            session.compressed_history || ''
        );

        // Save compressed history to session
        await saveSession({
            ...session,
            compressed_history: newCompressedHistory,
            last_compression_turn: currentTurn,
        });

        return NextResponse.json({
            compressed_history: newCompressedHistory,
            compressed_turns: historyToCompress.length,
            remaining_turns: history.length - historyToCompress.length,
        });
    } catch (error) {
        console.error('[CompressAPI] Error:', error);
        return NextResponse.json({ error: 'Compression failed' }, { status: 500 });
    }
}
