import { z } from 'zod';

// Helper for loose parsing
const stringOrArray = z.preprocess((val: any) => {
  if (typeof val === 'string') return [val];
  return val;
}, z.array(z.string()));

// --- Shared Types ---

export const JudgeOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).catch('medium'),
  type: z.enum(['action', 'stealth', 'observation', 'interact', 'examine']).catch('action'),
});

// --- 1. World Agent ---

export const WorldAgentSchema = z.object({
  environment_change: z.string().optional().default(""),
  npc_reactions: z.string().optional().default(""),
  emerging_risks: stringOrArray.optional().default([]),
  sensory_feedback: z.object({
    visual: z.string().describe("【关键】空间与实体。必须描述：1. 周围建筑布局/地形（路在哪，出口在哪，有多大）；2. 视野内的生物或威胁位置。严禁只写光影氛围。"),
    audio: z.string().describe("【关键】动态监测。必须描述声音背后的‘源头’（是机器？是怪物？是人？）及其确切方位/距离。"),
    smell: z.string().describe("化学与生物信号。空气中的毒性、血腥味或特定生物留下的气味线索。"),
    tactile: z.string().describe("物理环境反馈。温度极值、地面材质（是否影响移动）、身体状态反馈。"),
    mental: z.string().describe("直觉/灵感。潜意识注意到的反常细节、被注视感或危险预知。"),
  }).describe("结构化的感官数据，重点在于‘态势感知’（Situational Awareness），而非文学描写。"),
});

// --- 2. Quest Agent ---

export const QuestAgentSchema = z.object({
  visible_objectives: z.array(z.object({
    id: z.string(),
    text: z.string(),
    status: z.enum(['active', 'completed', 'failed']).catch('active')
  })).optional().default([]),
  intel_logs: z.array(z.object({
    source: z.string(),
    content: z.string(),
    reliability: z.enum(['low', 'med', 'high', 'unknown']).catch('unknown')
  })).optional().default([]),
  hidden_agenda: z.string().optional().default(""),
});

// --- 3. Judge Agent ---

export const InventoryUpdateSchema = z.object({
  action: z.enum(['add', 'remove']),
  item: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(['weapon', 'tool', 'consumable', 'key', 'misc']).catch('misc')
  })
});

export const JudgeAgentSchema = z.object({
  turn_id: z.coerce.number(),
  is_death: z.boolean().default(false),
  is_victory: z.boolean().default(false), // Player achieved victory condition
  narrative_directives: z.object({
    outcome_summary: z.string(),
    tone_instruction: z.string()
  }),
  state_updates: z.object({
    hp_change: z.coerce.number().default(0),
    power_change: z.coerce.number().default(0),
  }),
  inventory_updates: z.array(InventoryUpdateSchema).optional().default([]),
  options: z.array(JudgeOptionSchema).default([]),
  death_report: z.preprocess((val: any) => {
    if (!val) return null;
    return {
      cause_of_death: val.cause_of_death || val.cause || "Unknown Cause",
      trigger_action: val.trigger_action || val.reason || "Unknown Action",
      missed_clues: val.missed_clues || [],
      avoidance_suggestion: val.avoidance_suggestion || "No suggestion provided."
    };
  }, z.object({
    cause_of_death: z.string(),
    trigger_action: z.string(),
    missed_clues: z.array(z.string()),
    avoidance_suggestion: z.string()
  })).nullable().optional()
});

// --- 4. Narrator Agent ---

export const NarratorAgentSchema = z.object({
  narrative_text: z.string()
});

// --- 5. Archivist Agent (Atlas System) ---

export const AtlasEntrySchema = z.object({
  topic: z.string().describe("主题，如'镇长', '迷雾', '广播站'"),
  category: z.enum(['location', 'npc', 'rule', 'secret', 'item']).catch('secret'),
  description: z.string().describe("简短的事实描述，不要包含'玩家'字眼，描述客观事实"),
});

export const ArchivistAgentSchema = z.object({
  new_entries: z.array(AtlasEntrySchema).describe("从本局游戏中提炼出的新知识，必须是确凿的事实"),
  run_summary: z.string().describe("本局游戏的简短史诗总结，用第三人称描述特工的命运"),
});
