import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { loadAgentPrompt, buildSystemPrompt } from '@/lib/agents/prompt-loader';
import { ArchivistAgentSchema } from '@/lib/agents/schemas';
import { getModelForAgent } from '@/lib/model-config';
import { JudgeVerdict } from '@/types/game';

export const runtime = 'nodejs';

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.BASE_URL;

const openaiProvider = createOpenAI({ apiKey, baseURL });

import { loadWorldTemplate } from '@/lib/game-data';

interface AtlasRequest {
  world_template?: string;
  world_id?: string; // New field
  history: { action: string; verdict: JudgeVerdict }[];
  existing_topics: string[];
}

export async function POST(req: Request) {
  try {
    const body: AtlasRequest = await req.json();
    let { world_template, history, existing_topics, world_id } = body;

    // Load template if not provided but ID is available
    if (!world_template && world_id) {
      try {
        const loaded = await loadWorldTemplate(world_id);
        world_template = loaded.world_template;
      } catch (e) {
        console.warn(`Failed to load world template for ${world_id}`, e);
        // Proceed with empty/default or error? Let's assume empty generic world
        world_template = "Generic Dark World";
      }
    }

    if (!world_template) world_template = "Unknown World";

    // Optimize history: only send narrative content to save tokens
    const narrativeHistory = history.map((h, i) =>
      `Turn ${h.verdict.turn_id}: Player "${h.action}" -> Result: ${h.verdict.narrative.content} (Death: ${h.verdict.is_death})`
    ).join('\n');

    const archivistModelId = getModelForAgent('archivist');
    console.log(`[AtlasAPI] Using model: ${archivistModelId}`);
    const archivistModel = openaiProvider.chat(archivistModelId as any);

    const archivistBase = await loadAgentPrompt('archivist');
    const systemPrompt = buildSystemPrompt(archivistBase, []);

    const result = await generateText({
      model: archivistModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            world_template,
            play_history: narrativeHistory,
            existing_topics
          })
        }
      ]
    });

    let cleanedText = result.text.trim();
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Attempt parsing
    const parsed = JSON.parse(cleanedText);
    const validData = ArchivistAgentSchema.parse(parsed);

    return NextResponse.json(validData);
  } catch (error) {
    console.error('Atlas API Error:', error);
    return NextResponse.json({ error: 'Failed to archive' }, { status: 500 });
  }
}
