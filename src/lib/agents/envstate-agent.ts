/**
 * EnvState Agent (环境感知器)
 *
 * Lightweight agent that extracts structured environmental perception
 * from the narrative and world state.
 */

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { loadAgentPrompt, buildSystemPrompt } from './prompt-loader';
import { getModelForAgent } from '../model-config';
import type { EnvStateData, WorldState } from '@/types/game';

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.BASE_URL;
const openaiProvider = createOpenAI({ apiKey, baseURL });

const EnvStateItemSchema = z.object({
    id: z.string(),
    category: z.string().describe('感知分类 (e.g., 听觉, 嗅觉, 视觉)'),
    summary: z.string().describe('简短摘要，不超过10字'),
    details: z.string().describe('展开后显示的详细描述'),
    threat_level: z.enum(['safe', 'notice', 'warning', 'danger']),
});

const EnvStateDataSchema = z.object({
    core: z.object({
        time: z.string(),
        location: z.string(),
        weather: z.string(),
    }),
    senses: z.array(EnvStateItemSchema),
});

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

function makeSimpleRepair(fallback: string) {
    return async ({ text }: { text: string; error: Error }) => {
        const extracted = extractJsonObject(text);
        if (extracted && canParseJson(extracted)) {
            return extracted;
        }
        return fallback;
    };
}

interface EnvStateInput {
    narrative: string;
    world_state: WorldState;
}

/**
 * Generates structured environment state from narrative and world state.
 *
 * @param narrative - The narrative text from the current turn.
 * @param worldState - The current world state object.
 * @returns The structured EnvStateData object.
 */
export async function generateEnvState(
    narrative: string,
    worldState: WorldState
): Promise<EnvStateData> {
    const modelId = getModelForAgent('envstate');
    console.log(`[EnvStateAgent] Generating with model: ${modelId}`);
    const model = openaiProvider.chat(modelId as Parameters<typeof openaiProvider.chat>[0]);

    const envstateBase = await loadAgentPrompt('envstate');
    const systemPrompt = buildSystemPrompt(envstateBase, []);

    const inputPayload: EnvStateInput = {
        narrative,
        world_state: worldState,
    };

    // Default fallback based on current world state
    const fallbackJson = JSON.stringify({
        core: {
            time: worldState.environment.time,
            location: worldState.environment.location,
            weather: worldState.environment.weather,
        },
        senses: [],
    });

    try {
        const result = await generateObject({
            model,
            schema: EnvStateDataSchema,
            schemaName: 'EnvStateData',
            system: systemPrompt,
            temperature: 0,
            maxOutputTokens: 400,
            messages: [
                {
                    role: 'user',
                    content: JSON.stringify(inputPayload),
                },
            ],
            experimental_repairText: makeSimpleRepair(fallbackJson),
        });

        console.log(`[EnvStateAgent] Generated ${result.object.senses.length} sense items.`);
        return result.object;
    } catch (error) {
        console.error('[EnvStateAgent] Generation failed:', error);
        // Fallback to basic world state
        return {
            core: {
                time: worldState.environment.time,
                location: worldState.environment.location,
                weather: worldState.environment.weather,
            },
            senses: [],
        };
    }
}

/**
 * Configuration constants for EnvState updates
 */
export const ENVSTATE_CONFIG = {
    /** Number of turns between EnvState agent updates */
    UPDATE_INTERVAL: 10,
};
