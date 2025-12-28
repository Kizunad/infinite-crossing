/**
 * World Generator Agent
 *
 * AI-powered agent that generates new world templates based on user-provided themes.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { loadAgentPrompt } from './prompt-loader';
import { getModelForAgent } from '../model-config';
import type { GeneratedWorld, WorldGenerationOptions } from '@/types/generated-world';

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.BASE_URL;

const openaiProvider = createOpenAI({
    apiKey,
    baseURL,
});

/**
 * Parse the generated world name and tagline from the markdown template.
 */
function parseWorldMeta(template: string): { name: string; tagline: string } {
    // Extract world name from "# 世界模板：[Name]"
    const nameMatch = template.match(/^#\s*世界模板[：:]\s*(.+)$/m);
    const name = nameMatch?.[1]?.trim() || '未命名世界';

    // Extract tagline from "> "quote""
    const taglineMatch = template.match(/^>\s*"(.+)"$/m);
    const tagline = taglineMatch?.[1]?.trim() || '一个神秘的世界';

    return { name, tagline };
}

/**
 * Extract loot pool from the generated template.
 */
function parseLootPool(template: string): GeneratedWorld['loot_pool'] {
    const lootPool: GeneratedWorld['loot_pool'] = [];

    // Simple regex to extract items from loot pool section
    const lootSection = template.match(/## 5\. 战利品池[\s\S]*?(?=---|$)/);
    if (lootSection) {
        const itemMatches = lootSection[0].matchAll(/\*\*【(.+?)】(.+?)\*\*[：:]\s*(.+?)(?:\n|$)/g);
        let index = 0;
        for (const match of itemMatches) {
            const typeLabel = match[1]; // Chinese type label like "物品", "能力", "信息"
            const name = match[2].trim();
            const description = match[3].trim();

            // Map Chinese type labels to LootType
            let type: 'item' | 'info' | 'ability' = 'item';
            if (typeLabel === '能力') type = 'ability';
            else if (typeLabel === '信息') type = 'info';

            // Try to extract side effect
            const sideEffectMatch = template.match(
                new RegExp(`【${typeLabel}】${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?\\*副作用\\*[：:]\\s*(.+?)(?:\\n|$)`)
            );
            const sideEffect = sideEffectMatch?.[1]?.trim() ?? '未知副作用';

            lootPool.push({
                id: `loot_gen_${index++}`,
                name,
                description,
                type,
                side_effect: sideEffect,
            });
        }
    }

    // Provide default loot if parsing failed
    if (lootPool.length === 0) {
        lootPool.push({
            id: 'loot_gen_default',
            name: '神秘碎片',
            description: '来自异世界的神秘物质。',
            type: 'item',
            side_effect: '携带时会偶尔听到低语声。',
        });
    }

    return lootPool;
}


import { readFile, readdir } from 'fs/promises';
import path from 'path';

// ... (existing imports)

/**
 * Reads all world templates from docs/worlds to use as context.
 */
async function loadWorldTemplates(): Promise<string> {
    try {
        const worldsDir = path.join(process.cwd(), 'docs/worlds');
        const files = await readdir(worldsDir);
        const templateFiles = files.filter(f => f.endsWith('.md'));

        const contents = await Promise.all(
            templateFiles.map(async (file) => {
                const content = await readFile(path.join(worldsDir, file), 'utf-8');
                return `--- TEMPLATE: ${file} ---\n${content}\n--- END TEMPLATE ---`;
            })
        );

        return contents.join('\n\n');
    } catch (error) {
        console.warn('[WorldGenerator] Failed to load world templates:', error);
        return '';
    }
}

/**
 * Generates a new world template based on user-provided options.
 */
export async function generateWorld(options: WorldGenerationOptions): Promise<GeneratedWorld> {
    if (!apiKey) {
        throw new Error('Missing API Key');
    }

    const modelId = getModelForAgent('generator'); // Uses LLM_MODEL_GENERATOR
    const model = openaiProvider.chat(modelId as any);

    const baseSystemPrompt = await loadAgentPrompt('world-generator');
    const referenceTemplates = await loadWorldTemplates();

    // Inject templates into the prompt context if available
    const systemPrompt = referenceTemplates
        ? `${baseSystemPrompt}\n\n## REFERENCE ARCHIVES\nHere are existing successful world simulations. Use them as a stylistic baseline, but generate a NEW unique world based on the parameter input.\n\n${referenceTemplates}`
        : baseSystemPrompt;

    console.log('[WorldGenerator] Generating world with theme:', options.theme, 'power:', options.average_power);

    const result = await generateText({
        model,
        temperature: 0.85, // Slightly higher creativity for unique variations
        maxOutputTokens: 5000,
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: JSON.stringify({
                    theme: options.theme,
                    average_power: options.average_power,
                    mystery_level: options.mystery_level,
                    resource_scarcity: options.resource_scarcity
                }),
            },
        ],
    });

    const templateContent = result.text;

    // Replace power placeholders
    const processedTemplate = templateContent
        .replace(/\{\{AVERAGE_POWER\}\}/g, options.average_power.toString());

    // Parse metadata from template
    const { name, tagline } = parseWorldMeta(processedTemplate);
    const lootPool = parseLootPool(processedTemplate);

    const generatedWorld: GeneratedWorld = {
        id: `gen_${crypto.randomUUID().slice(0, 8)}`,
        name,
        tagline,
        average_power: options.average_power,
        mystery_level: options.mystery_level,
        resource_scarcity: options.resource_scarcity,
        created_at: new Date().toISOString(),
        times_played: 0,
        discovery_target: 30, // Default target for generated worlds
        loot_pool: lootPool,
        template_content: processedTemplate,
    };

    console.log('[WorldGenerator] Generated world:', generatedWorld.name);

    return generatedWorld;
}
