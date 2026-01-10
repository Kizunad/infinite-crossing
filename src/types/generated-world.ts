import type { LootItem } from "@/types/settlement";
import type {
    Gender,
    CharacterAptitude,
    CharacterBackground,
} from "@/types/game";

export interface GeneratedWorldMeta {
    id: string; // "gen_xxx"
    name: string; // "废墟星舰"
    tagline: string; // 一句话概括
    average_power: number; // 用户指定的难度等级
    created_at: string;
    times_played: number;
    discovery_target: number;
    loot_pool: LootItem[];
    mystery_level: number; // 1-100, entropy/weirdness
    resource_scarcity: number; // 1-100, higher means less loot
}

export interface GeneratedWorld extends GeneratedWorldMeta {
    template_content: string; // 完整的 Markdown 世界模板
}

// === 角色自定义输入 ===
export interface CharacterCreationInput {
    name: string; // 角色名
    gender: Gender; // 性别
    age?: number; // 年龄
    appearance?: string; // 外貌描述 (可选)
    personality?: string; // 性格特点 (可选)
    background_origin?: string; // 出身背景
    background_occupation?: string; // 职业/身份
    background_motivation?: string; // 动机/目标
    background_flaw?: string; // 缺陷/弱点
    talents?: string; // 天赋描述 (AI解析)
    skills?: string; // 技能描述 (AI解析)
    custom_notes?: string; // 其他自定义信息
}

export interface WorldGenerationOptions {
    theme: string; // 用户描述的世界观
    average_power: number; // 敌人平均战力
    mystery_level: number; // 神秘度
    resource_scarcity: number; // 资源稀缺度
    // 新增: 角色自定义
    character?: CharacterCreationInput;
}
