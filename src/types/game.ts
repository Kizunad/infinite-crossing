export interface PlayerStats {
  hp: number;
  max_hp: number;
  power: number; // Represents generic combat/physical capability
}

export type ItemType = 'weapon' | 'tool' | 'consumable' | 'key' | 'misc';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  type: ItemType;
}

export interface Trait {
  id: string;
  name: string;
  effect: string;
}

export type PlayerStatus = 'alive' | 'dead' | 'ascended';

export interface PlayerProfile {
  id: string;
  name: string;
  current_world_id: string;
  status: PlayerStatus;
  stats: PlayerStats;
  inventory: InventoryItem[];
  traits: Trait[];
}

export interface WorldState {
  world_id: string;
  turn_count: number;
  environment: {
    time: string;
    weather: string;
    location: string;
  };
  flags: Record<string, unknown>;
  active_threats: string[];
}

export type PlayerActionType = 'choice' | 'free_text';

export interface PlayerAction {
  type: PlayerActionType;
  content: string;
}

export interface QuestObjective {
  id: string;
  text: string;
  status: 'active' | 'completed' | 'failed';
}

export interface QuestIntelLog {
  source: string;
  content: string;
  reliability: 'low' | 'med' | 'high' | 'unknown';
}

export interface QuestOutput {
  visible_objectives: QuestObjective[];
  intel_logs: QuestIntelLog[];
  hidden_agenda: string;
}

export type OptionRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type OptionType = 'action' | 'stealth' | 'observation' | 'interact' | 'examine';

export interface JudgeOption {
  id: string;
  text: string;
  risk_level: OptionRiskLevel;
  type: OptionType;
}

export interface DeathReport {
  cause_of_death: string;
  trigger_action: string;
  missed_clues: string[];
  avoidance_suggestion: string;
}

export interface JudgeVerdict {
  turn_id: number;
  is_death: boolean;
  is_victory: boolean; // Player achieved victory condition (triggers settlement)
  dice_roll: number; // The luck factor of this turn (1-100)
  narrative: {
    content: string;
    tone: string;
  };
  state_updates: {
    hp_change: number;
    power_change: number;
  };
  options: JudgeOption[];
  death_report: DeathReport | null;
}

/** 游戏历史记录项 */
export interface GameHistoryItem {
  action: string;
  verdict: JudgeVerdict;
}

export interface TurnContext {
  turn_id: number;
  world_template: string;
  hard_rules: string;
  player_action: PlayerAction;
  world_state: WorldState;
  player_profile: PlayerProfile;
  quest_state: QuestOutput | null;
  known_lore?: string[]; // Array of strings formatted as "Topic: Description"
  recent_history?: GameHistoryItem[];
  compressed_history?: string;
}

// --- EnvState Agent Types ---

export type ThreatLevel = 'safe' | 'notice' | 'warning' | 'danger';

/** ENV_STATE 中的一条可展开的信息项。 */
export interface EnvStateItem {
  id: string;
  /** 信息分类名 (e.g., "风险", "气味", "声音") */
  category: string;
  /** 简短摘要，始终显示 */
  summary: string;
  /** 展开后显示的详细描述 */
  details: string;
  /** 危险等级, 用于 UI 染色 */
  threat_level: ThreatLevel;
}

/** EnvState Agent 的输出 */
export interface EnvStateData {
  /** 核心环境信息 (时间、地点、天气) */
  core: {
    time: string;
    location: string;
    weather: string;
  };
  /** 可展开的感知信息列表 */
  senses: EnvStateItem[];
}