/**
 * History Compressor Agent
 *
 * Compresses game history to reduce token usage for heavy agents.
 * Triggered every 10 turns asynchronously.
 */

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { loadAgentPrompt, buildSystemPrompt } from './prompt-loader';
import { getModelForAgent } from '../model-config';
import type { JudgeVerdict, GameHistoryItem } from '@/types/game';

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.BASE_URL;
const openaiProvider = createOpenAI({ apiKey, baseURL });

const CompressorOutputSchema = z.object({
    compressed_summary: z.string().describe('Compressed history summary'),
});

const COMPRESSOR_FALLBACK = '{ "compressed_summary": "历史记录压缩失败，使用空摘要。" }';

/**
 * Extracts JSON object from text that may be wrapped in markdown code blocks
 */
function extractJsonObject(text: string): string | null {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
    return text.slice(firstBrace, lastBrace + 1);
}

function canParseJson(text: string): boolean {
    try {
        JSON.parse(text);
        return true;
    } catch {
        return false;
    }
}

/**
 * Simple repair function: just extract JSON from markdown-wrapped response
 */
function makeSimpleRepair(fallback: string) {
    return async ({ text }: { text: string; error: Error }) => {
        const extracted = extractJsonObject(text);
        if (extracted && canParseJson(extracted)) {
            return extracted;
        }
        return fallback;
    };
}

/**
 * Minimal history item type for compression (does not require full JudgeVerdict)
 */
export interface CompressableHistoryItem {
    action: string;
    verdict: {
        turn_id: number;
        narrative: { content: string };
        state_updates: { hp_change: number };
    };
}

interface CompressInput {
    history_to_compress: {
        turn_id: number;
        action: string;
        outcome: string;
        hp_change: number;
        items_changed: string[];
    }[];
    existing_summary: string;
}

/**
 * Compresses a portion of game history into a concise summary.
 *
 * @param historyToCompress - The history items to compress (older turns)
 * @param existingSummary - Previously compressed summary to append to
 * @returns The new compressed summary string
 */
export async function compressHistory(
    historyToCompress: CompressableHistoryItem[],
    existingSummary: string = ''
): Promise<string> {
    if (historyToCompress.length === 0) {
        return existingSummary;
    }

    const modelId = getModelForAgent('compressor');
    console.log(`[CompressorAgent] Compressing ${historyToCompress.length} turns with model: ${modelId}`);
    const model = openaiProvider.chat(modelId as Parameters<typeof openaiProvider.chat>[0]);

    const compressorBase = await loadAgentPrompt('compressor');
    const systemPrompt = buildSystemPrompt(compressorBase, []);

    // Transform history items into a simpler format for the LLM
    const inputPayload: CompressInput = {
        history_to_compress: historyToCompress.map((item) => ({
            turn_id: item.verdict.turn_id,
            action: item.action,
            outcome: item.verdict.narrative.content.slice(0, 200), // Truncate long narratives
            hp_change: item.verdict.state_updates.hp_change,
            items_changed: [], // TODO: Extract from inventory_updates if available
        })),
        existing_summary: existingSummary,
    };

    try {
        const result = await generateObject({
            model,
            schema: CompressorOutputSchema,
            schemaName: 'CompressorOutput',
            system: systemPrompt,
            temperature: 0,
            maxOutputTokens: 500,
            messages: [
                {
                    role: 'user',
                    content: JSON.stringify(inputPayload),
                },
            ],
            experimental_repairText: makeSimpleRepair(COMPRESSOR_FALLBACK),
        });

        console.log(`[CompressorAgent] Compression complete. Summary length: ${result.object.compressed_summary.length}`);
        return result.object.compressed_summary;
    } catch (error) {
        console.error('[CompressorAgent] Compression failed:', error);
        // Fallback: return existing summary if compression fails
        return existingSummary;
    }
}

/**
 * Configuration constants for history compression
 */
export const COMPRESSION_CONFIG = {
    /** Number of turns between compression triggers */
    TRIGGER_INTERVAL: 10,
    /** Percentage of history to keep as recent (uncompressed) */
    RECENT_HISTORY_RATIO: 0.6,
};
