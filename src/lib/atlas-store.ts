import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

export type AtlasCategory = 'location' | 'npc' | 'rule' | 'secret' | 'item';

/** 物品跨世界携带惩罚 */
export interface ItemCarryPenalty {
  type: 'max_hp_reduction' | 'power_reduction' | 'trait_curse';
  value: number;
  description: string;
}

export interface AtlasEntry {
  id: string;
  topic: string;
  category: AtlasCategory;
  description: string;
  source_world_id: string;
  unlocked_at: string;
  carry_penalty?: ItemCarryPenalty;
}

export interface RunSummary {
  id: string;
  world_id: string;
  summary: string;
  outcome: 'death' | 'escape' | 'mastery';
  turns_survived: number;
  recorded_at: string;
}

interface AtlasState {
  entries: AtlasEntry[];
  runSummaries: RunSummary[];
  isLoading: boolean;
  userId: string | null;
  addEntry: (entry: Omit<AtlasEntry, 'id' | 'unlocked_at'>) => Promise<void>;
  addRunSummary: (summary: Omit<RunSummary, 'id' | 'recorded_at'>) => Promise<void>;
  hasEntry: (topic: string) => boolean;
  clearAtlas: () => void;
  syncWithUser: (userId: string | null) => Promise<void>;
}

export const useAtlasStore = create<AtlasState>()(
  persist(
    (set, get) => ({
      entries: [],
      runSummaries: [],
      isLoading: false,
      userId: null,

      syncWithUser: async (userId: string | null) => {
        set({ userId, isLoading: true });

        if (!userId) {
          // Guest mode: keep local data only
          set({ isLoading: false });
          return;
        }

        try {
          const supabase = createClient();

          // Fetch user's atlas entries
          const { data: entriesData, error: entriesError } = await supabase
            .from('atlas_entries')
            .select('*')
            .eq('user_id', userId);

          if (entriesError) {
            console.error('[AtlasStore] Fetch entries error:', entriesError);
          }

          // Fetch user's run summaries
          const { data: summariesData, error: summariesError } = await supabase
            .from('run_summaries')
            .select('*')
            .eq('user_id', userId)
            .order('recorded_at', { ascending: false });

          if (summariesError) {
            console.error('[AtlasStore] Fetch summaries error:', summariesError);
          }

          // Merge server data with local data (server wins for conflicts)
          const serverEntries: AtlasEntry[] = (entriesData || []).map((row: any) => ({
            id: row.id,
            topic: row.topic,
            category: row.category,
            description: row.description,
            source_world_id: row.source_world_id,
            unlocked_at: row.unlocked_at,
            carry_penalty: row.carry_penalty,
          }));

          const serverSummaries: RunSummary[] = (summariesData || []).map((row: any) => ({
            id: row.id,
            world_id: row.world_id,
            summary: row.summary,
            outcome: row.outcome,
            turns_survived: row.turns_survived,
            recorded_at: row.recorded_at,
          }));

          // Merge: Keep server entries + any local entries not on server
          const localEntries = get().entries;
          const serverTopics = new Set(serverEntries.map(e => e.topic.toLowerCase()));
          const uniqueLocalEntries = localEntries.filter(
            e => !serverTopics.has(e.topic.toLowerCase())
          );

          // Upload unique local entries to server
          for (const entry of uniqueLocalEntries) {
            await supabase.from('atlas_entries').insert({
              user_id: userId,
              topic: entry.topic,
              category: entry.category,
              description: entry.description,
              source_world_id: entry.source_world_id,
              carry_penalty: entry.carry_penalty,
            });
          }

          set({
            entries: [...serverEntries, ...uniqueLocalEntries],
            runSummaries: serverSummaries,
            isLoading: false,
          });
        } catch (e) {
          console.error('[AtlasStore] Sync failed:', e);
          set({ isLoading: false });
        }
      },

      addEntry: async (newEntry) => {
        const state = get();
        const exists = state.entries.some(
          (e) => e.topic.toLowerCase() === newEntry.topic.toLowerCase()
        );

        if (exists) return;

        const entry: AtlasEntry = {
          ...newEntry,
          id: crypto.randomUUID(),
          unlocked_at: new Date().toISOString(),
        };

        // Optimistic update
        set((state) => ({
          entries: [...state.entries, entry],
        }));

        // Sync to Supabase if logged in
        if (state.userId) {
          try {
            const supabase = createClient();
            const { error } = await supabase.from('atlas_entries').insert({
              user_id: state.userId,
              topic: entry.topic,
              category: entry.category,
              description: entry.description,
              source_world_id: entry.source_world_id,
              carry_penalty: entry.carry_penalty,
            });

            if (error) {
              console.error('[AtlasStore] Insert error:', error);
            }
          } catch (e) {
            console.error('[AtlasStore] Insert failed:', e);
          }
        }
      },

      addRunSummary: async (newSummary) => {
        const state = get();
        const summary: RunSummary = {
          ...newSummary,
          id: crypto.randomUUID(),
          recorded_at: new Date().toISOString(),
        };

        set((state) => ({
          runSummaries: [summary, ...state.runSummaries],
        }));

        // Sync to Supabase if logged in
        if (state.userId) {
          try {
            const supabase = createClient();
            const { error } = await supabase.from('run_summaries').insert({
              user_id: state.userId,
              world_id: summary.world_id,
              summary: summary.summary,
              outcome: summary.outcome,
              turns_survived: summary.turns_survived,
            });

            if (error) {
              console.error('[AtlasStore] Insert summary error:', error);
            }
          } catch (e) {
            console.error('[AtlasStore] Insert summary failed:', e);
          }
        }
      },

      hasEntry: (topic) => {
        return get().entries.some((e) => e.topic.toLowerCase() === topic.toLowerCase());
      },

      clearAtlas: () => set({ entries: [], runSummaries: [] }),
    }),
    {
      name: 'atlas-storage',
    }
  )
);
