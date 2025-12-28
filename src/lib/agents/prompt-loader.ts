import { readFile } from 'fs/promises';
import path from 'path';

export type AgentPromptName = 'world' | 'quest' | 'judge' | 'narrator' | 'gamemaster' | 'archivist' | 'compressor' | 'world-generator' | 'envstate';

export type PromptSection = {
  title: string;
  content: string;
};

const promptCache = new Map<AgentPromptName, string>();

export async function loadAgentPrompt(agentName: AgentPromptName): Promise<string> {
  const canUseCache = process.env.NODE_ENV === 'production';
  if (canUseCache) {
    const cached = promptCache.get(agentName);
    if (cached) return cached;
  }

  const promptPath = path.join(
    process.cwd(),
    'src/lib/agents/prompts',
    `${agentName}.md`
  );
  const content = await readFile(promptPath, 'utf-8');
  if (canUseCache) promptCache.set(agentName, content);
  return content;
}

export function buildSystemPrompt(basePrompt: string, sections: PromptSection[]): string {
  const trimmedBase = basePrompt.trimEnd();
  if (sections.length === 0) return trimmedBase;

  const appendix = sections
    .map(({ title, content }) => `### ${title}\n${content.trim()}`)
    .join('\n\n');

  // Put dynamic context *before* the base prompt so that the base prompt's
  // "OUTPUT JSON FORMAT" section remains the final instruction (higher compliance).
  return `${appendix}\n\n${trimmedBase}`.trimEnd();
}
