// Settlement Types for Loot and Victory Flow
import type { PlayerProfile, WorldState, GameHistoryItem } from './game';

export type LootType = 'item' | 'info' | 'ability';

export interface LootItem {
    id: string;
    name: string;
    description: string;
    type: LootType;
    side_effect: string; // Description of the negative consequence
}

export interface SettlementRequest {
    session_id: string;
    chosen_loot_id: string;
    loot_source: 'loot_pool' | 'inventory'; // Where the item came from
}

export interface SettlementResult {
    success: boolean;
    chosen_loot: LootItem | null;
    error_message?: string;
}

// ============================================
// Settlement Agent Types
// ============================================

/** 物品携带惩罚类型 */
export type PenaltyType = 'max_hp_reduction' | 'power_reduction' | 'trait_curse';

/** 物品跨世界携带惩罚 */
export interface ItemCarryPenalty {
    type: PenaltyType;
    value: number;
    description: string; // 显示给玩家的 lore-friendly 警告
}

/** 携带的物品 (带惩罚信息) */
export interface CarriedItem {
    id: string;
    name: string;
    description: string;
    carry_penalty?: ItemCarryPenalty;
}

/** 游戏开始时的结算请求 */
export interface SettlementInitRequest {
    world_id: string;
    carried_items: CarriedItem[];
    base_player_profile: PlayerProfile;
}

/** 应用的惩罚记录 */
export interface AppliedPenalty {
    item_name: string;
    penalty_description: string;
    stat_change: Record<string, number>;
}

/** 游戏开始时的结算结果 */
export interface SettlementInitResult {
    modified_profile: PlayerProfile;
    applied_penalties: AppliedPenalty[];
    warnings: string[]; // UI 显示的警告信息
}

/** 游戏结束时的结算请求 */
export interface SettlementEndRequest {
    session_id: string;
    outcome: 'death' | 'victory' | 'escape';
    game_history: GameHistoryItem[];
    final_player_profile: PlayerProfile;
    final_world_state: WorldState;
    carried_items: CarriedItem[];
    /** 世界模板内容 (用于 Archivist Agent 提取 Lore) */
    world_template?: string;
    /** 已存在的 Atlas 条目主题 (避免重复提取) */
    existing_topics?: string[];
}

/** Atlas 条目 (用于结算结果) */
export interface SettlementAtlasEntry {
    topic: string;
    category: 'location' | 'npc' | 'rule' | 'secret' | 'item';
    description: string;
}

/** Run Summary (用于结算结果) */
export interface SettlementRunSummary {
    world_id: string;
    summary: string;
    outcome: 'death' | 'escape' | 'mastery';
    turns_survived: number;
}

/** 游戏结束时的结算结果 */
export interface SettlementEndResult {
    new_atlas_entries: SettlementAtlasEntry[];
    run_summary: SettlementRunSummary;
    unlocked_items: LootItem[];
    permanent_stat_changes: Record<string, number>; // 永久性变化 (跨 run)
}
