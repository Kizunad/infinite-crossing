import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerStats, JudgeVerdict, WorldState } from '@/types/game';

interface GameState {
  // Session Identity
  sessionId: string | null;
  worldId: string | null;

  // Real-time Data
  stats: PlayerStats;
  history: JudgeVerdict[];
  currentWorldState: WorldState | null;

  // UI Status
  isProcessing: boolean;
  isDead: boolean;
  lastDeathReport: any | null;

  // Actions
  startNewGame: (worldId: string) => Promise<void>;
  submitAction: (action: { type: string; content: string }) => Promise<void>;
  reset: () => void;
}

/**
 * Zustand Store Blueprint
 * 
 * 职责：
 * 1. 维护前端唯一的真实数据源。
 * 2. 封装与 API 的交互逻辑。
 * 3. 持久化存储（防止刷新丢失）。
 */

/* 
// 建议实现逻辑 (Implementation logic snippet):

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      worldId: null,
      stats: { hp: 100, san: 100, exposure: 0 },
      history: [],
      currentWorldState: null,
      isProcessing: false,
      isDead: false,
      lastDeathReport: null,

      startNewGame: async (worldId) => {
        set({ isProcessing: true });
        const res = await fetch('/api/game/start', { method: 'POST', body: JSON.stringify({ worldId }) });
        const data = await res.json();
        set({
          sessionId: data.sessionId,
          worldId,
          history: [data.initialVerdict],
          isProcessing: false,
          isDead: false
        });
      },

      submitAction: async (action) => {
        if (get().isDead || get().isProcessing) return;
        set({ isProcessing: true });
        
        const res = await fetch('/api/game/turn', { 
           method: 'POST', 
           body: JSON.stringify({ sessionId: get().sessionId, action }) 
        });
        const { verdict } = await res.json();
        
        set((state) => ({
          history: [...state.history, verdict],
          stats: {
             hp: state.stats.hp + verdict.state_updates.hp_change,
             san: state.stats.san + verdict.state_updates.sanity_change,
             exposure: state.stats.exposure + verdict.state_updates.exposure_change,
          },
          isDead: verdict.is_death,
          lastDeathReport: verdict.death_report,
          isProcessing: false
        }));
      },

      reset: () => set({ sessionId: null, history: [], isDead: false }),
    }),
    { name: 'webgame-storage' }
  )
);
*/
