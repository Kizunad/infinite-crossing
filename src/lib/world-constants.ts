import type { LootItem } from '@/types/settlement';

export type WorldTemplateMeta = {
    world_id: string;
    template_path: string;
    allowSave?: boolean;
    discovery_target?: number; // Target lore count for 100% completion
    loot_pool: LootItem[]; // Available rewards upon victory
};

export const WORLD_TEMPLATES: Record<string, WorldTemplateMeta> = {
    mistwood: {
        world_id: 'world_mistwood_001',
        template_path: 'docs/worlds/WORLD_TEMPLATE_01.md',
        allowSave: true,
        discovery_target: 50,
        loot_pool: [
            {
                id: 'loot_mist_lantern',
                name: '迷雾提灯',
                description: '能照亮超自然黑暗的古老提灯。',
                type: 'item',
                side_effect: '提灯亮起时，你会吸引方圆100米内所有灵体的注意（遭遇战判定骰子点数 -20）。',
            },
            {
                id: 'loot_death_list',
                name: '死者名单',
                description: '一份记录了所有村民真实死亡时间的名单。',
                type: 'info',
                side_effect: '你会被该世界的"守护者"标记，梦中经常听到哀嚎（MaxHP 上限永久 -10）。',
            },
        ],
    },
    cycoflora: {
        world_id: 'world_cycoflora_002',
        template_path: 'docs/worlds/WORLD_TEMPLATE_02.md',
        allowSave: true,
        discovery_target: 40,
        loot_pool: [], // To be defined
    },
};
