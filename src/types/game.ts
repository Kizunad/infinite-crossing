export interface PlayerStats {
    hp: number;
    max_hp: number;
    power: number; // Represents generic combat/physical capability
    // 扩展属性
    agility?: number; // 敏捷
    intellect?: number; // 智力
    charisma?: number; // 魅力
    luck?: number; // 幸运
}

// === 角色自定义系统 ===

export type Gender = "male" | "female" | "other" | "unknown";

export interface CharacterTalent {
    id: string;
    name: string;
    description: string;
    level: number; // 1-5 熟练度
}

export interface CharacterAptitude {
    id: string;
    name: string; // 如 "剑术", "黑客", "交涉"
    value: number; // 1-100 资质值
    category: "combat" | "tech" | "social" | "survival" | "special";
}

export interface CharacterBackground {
    origin: string; // 出身背景
    occupation: string; // 职业/身份
    motivation: string; // 动机/目标
    flaw: string; // 缺陷/弱点
}

export interface CharacterCustomization {
    gender: Gender;
    age?: number;
    appearance?: string; // 外貌描述
    personality?: string; // 性格特点
    talents: CharacterTalent[]; // 天赋列表
    aptitudes: CharacterAptitude[]; // 资质列表
    background: CharacterBackground;
    customNotes?: string; // 玩家自定义备注
}

// === NPC性格系统 ===

export type NPCDisposition =
    | "friendly"
    | "neutral"
    | "hostile"
    | "fearful"
    | "curious";

export interface NPCPersonality {
    id: string;
    name: string;
    title?: string; // 称号/头衔
    appearance: string; // 外貌
    personality: string; // 性格特点
    motivation: string; // 动机
    quirks: string[]; // 怪癖/特点
    speech_style: string; // 说话风格
    secrets?: string; // 隐藏秘密 (AI知道,玩家不知道)
}

export interface NPCRelationship {
    npc_id: string;
    npc_name: string;
    disposition: NPCDisposition;
    trust_level: number; // -100 到 100
    interaction_count: number; // 交互次数
    last_interaction?: string; // 最后交互描述
    notes: string[]; // 关系备注
}

export interface SocialNetwork {
    known_npcs: NPCPersonality[];
    relationships: NPCRelationship[];
}

export type ItemType = "weapon" | "tool" | "consumable" | "key" | "misc";

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

export type PlayerStatus = "alive" | "dead" | "ascended";

export interface PlayerProfile {
    id: string;
    name: string;
    current_world_id: string;
    status: PlayerStatus;
    stats: PlayerStats;
    inventory: InventoryItem[];
    traits: Trait[];
    // 新增角色自定义
    customization?: CharacterCustomization;
    // 新增社交网络
    social?: SocialNetwork;
}

export interface WorldState {
    world_id: string;
    turn_count: number;
    environment: {
        time: string;
        weather: string;
        location: string;
        sub_location?: string; // 具体位置 (如 "酒馆二楼")
        region?: string; // 大区域 (如 "迷雾森林")
    };
    flags: Record<string, unknown>;
    active_threats: string[];
    // 新增: 当前场景NPC
    present_npcs?: string[]; // 当前场景中的NPC ID列表
}

export type PlayerActionType = "choice" | "free_text";

export interface PlayerAction {
    type: PlayerActionType;
    content: string;
}

export interface QuestObjective {
    id: string;
    text: string;
    status: "active" | "completed" | "failed";
}

export interface QuestIntelLog {
    source: string;
    content: string;
    reliability: "low" | "med" | "high" | "unknown";
}

export interface QuestOutput {
    visible_objectives: QuestObjective[];
    intel_logs: QuestIntelLog[];
    hidden_agenda: string;
}

export type OptionRiskLevel = "low" | "medium" | "high" | "critical";
export type OptionType =
    | "action"
    | "stealth"
    | "observation"
    | "interact"
    | "examine";

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

export type ThreatLevel = "safe" | "notice" | "warning" | "danger";

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
