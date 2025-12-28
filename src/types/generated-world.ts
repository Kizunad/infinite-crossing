import type { LootItem } from '@/types/settlement';

export interface GeneratedWorldMeta {
    id: string;                     // "gen_xxx"
    name: string;                   // "废墟星舰"
    tagline: string;                // 一句话概括
    average_power: number;          // 用户指定的难度等级
    created_at: string;
    times_played: number;
    discovery_target: number;
    loot_pool: LootItem[];
    mystery_level: number;         // 1-100, entropy/weirdness
    resource_scarcity: number;     // 1-100, higher means less loot
}

export interface GeneratedWorld extends GeneratedWorldMeta {
    template_content: string;       // 完整的 Markdown 世界模板
}

export interface WorldGenerationOptions {
    theme: string;                  // 用户描述的世界观
    average_power: number;          // 敌人平均战力
    mystery_level: number;          // 神秘度
    resource_scarcity: number;      // 资源稀缺度
}
