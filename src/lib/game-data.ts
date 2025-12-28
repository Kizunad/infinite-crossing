import { readFile } from 'fs/promises';
import path from 'path';
import { WORLD_TEMPLATES } from './world-constants';

const worldTemplateCache = new Map<string, string>();
let hardRulesCache: string | null = null;

export async function loadWorldTemplate(worldTemplateId: string): Promise<{
  world_id: string;
  world_template: string;
  allowSave: boolean;
}> {
  let meta = WORLD_TEMPLATES[worldTemplateId];

  // If not found by key, try finding by world_id property
  if (!meta) {
    meta = Object.values(WORLD_TEMPLATES).find(m => m.world_id === worldTemplateId) as any;
  }

  if (!meta) {
    throw new Error(`Unknown world_template_id: ${worldTemplateId}`);
  }

  const allowSave = meta.allowSave ?? false;

  const cached = worldTemplateCache.get(worldTemplateId);
  if (cached) {
    return { world_id: meta.world_id, world_template: cached, allowSave };
  }

  const templatePath = path.join(process.cwd(), meta.template_path);
  const content = await readFile(templatePath, 'utf-8');
  worldTemplateCache.set(worldTemplateId, content);
  return { world_id: meta.world_id, world_template: content, allowSave };
}

export async function loadHardRules(): Promise<string> {
  if (hardRulesCache) return hardRulesCache;

  const rulesPath = path.join(process.cwd(), 'docs/JUDGE_RULES.md');
  hardRulesCache = await readFile(rulesPath, 'utf-8');
  return hardRulesCache;
}

