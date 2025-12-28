import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import type { GeneratedWorld } from '@/types/generated-world';

interface GeneratedWorldStore {
    worlds: GeneratedWorld[];
    isLoading: boolean;
    addWorld: (world: GeneratedWorld, creatorName?: string) => Promise<void>;
    removeWorld: (id: string) => Promise<void>;
    getWorld: (id: string) => GeneratedWorld | undefined;
    incrementPlayCount: (id: string) => Promise<void>;
    fetchWorlds: () => Promise<void>;
}

export const useGeneratedWorldStore = create<GeneratedWorldStore>()(
    persist(
        (set, get) => ({
            worlds: [],
            isLoading: false,

            fetchWorlds: async () => {
                set({ isLoading: true });
                try {
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from('generated_worlds')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (error) {
                        console.error('[GeneratedWorldStore] Fetch error:', error);
                        return;
                    }

                    if (data) {
                        // Map database fields to GeneratedWorld type
                        const worlds: GeneratedWorld[] = data.map((row: any) => ({
                            id: row.id,
                            name: row.name,
                            tagline: row.tagline || '',
                            average_power: row.average_power || 10,
                            created_at: row.created_at,
                            times_played: row.times_played || 0,
                            discovery_target: row.discovery_target || 100,
                            loot_pool: row.loot_pool || [],
                            mystery_level: row.mystery_level || 50,
                            resource_scarcity: row.resource_scarcity || 50,
                            template_content: row.template_content,
                        }));
                        set({ worlds });
                    }
                } catch (e) {
                    console.error('[GeneratedWorldStore] Fetch failed:', e);
                } finally {
                    set({ isLoading: false });
                }
            },

            addWorld: async (world, creatorName) => {
                // Optimistically add to local state
                set((state) => ({
                    worlds: [world, ...state.worlds],
                }));

                // Sync to Supabase
                try {
                    const supabase = createClient();
                    const { error } = await supabase.from('generated_worlds').insert({
                        id: world.id,
                        name: world.name,
                        theme: world.tagline || world.name,
                        template_content: world.template_content,
                        times_played: world.times_played || 0,
                        creator_name: creatorName,
                        // Store additional metadata as JSON in template or separate columns
                        average_power: world.average_power,
                        mystery_level: world.mystery_level,
                        resource_scarcity: world.resource_scarcity,
                        discovery_target: world.discovery_target,
                        loot_pool: world.loot_pool,
                        tagline: world.tagline,
                    });

                    if (error) {
                        console.error('[GeneratedWorldStore] Insert error:', error);
                        console.error('[GeneratedWorldStore] Error details:', {
                            message: error.message,
                            code: error.code,
                            details: error.details,
                            hint: error.hint,
                        });
                        // Rollback on error
                        set((state) => ({
                            worlds: state.worlds.filter((w) => w.id !== world.id),
                        }));
                    } else {
                        console.log('[GeneratedWorldStore] World saved to Supabase:', world.id);
                    }
                } catch (e) {
                    console.error('[GeneratedWorldStore] Insert failed:', e);
                }
            },

            removeWorld: async (id) => {
                const previousWorlds = get().worlds;
                set((state) => ({
                    worlds: state.worlds.filter((w) => w.id !== id),
                }));

                try {
                    const supabase = createClient();
                    const { error } = await supabase.from('generated_worlds').delete().eq('id', id);

                    if (error) {
                        console.error('[GeneratedWorldStore] Delete error:', error);
                        set({ worlds: previousWorlds });
                    }
                } catch (e) {
                    console.error('[GeneratedWorldStore] Delete failed:', e);
                    set({ worlds: previousWorlds });
                }
            },

            getWorld: (id) => {
                return get().worlds.find((w) => w.id === id);
            },

            incrementPlayCount: async (id) => {
                // Optimistic update
                set((state) => ({
                    worlds: state.worlds.map((w) =>
                        w.id === id ? { ...w, times_played: w.times_played + 1 } : w
                    ),
                }));

                try {
                    const supabase = createClient();
                    const world = get().worlds.find((w) => w.id === id);
                    if (world) {
                        await supabase
                            .from('generated_worlds')
                            .update({ times_played: world.times_played })
                            .eq('id', id);
                    }
                } catch (e) {
                    console.error('[GeneratedWorldStore] Update play count failed:', e);
                }
            },
        }),
        {
            name: 'generated-worlds-storage',
        }
    )
);
