import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { useAtlasStore } from '@/lib/atlas-store';
import type { JudgeVerdict, PlayerProfile, QuestObjective, WorldState, QuestOutput, EnvStateData, GameHistoryItem } from '@/types/game';
import type { RunTurnResult } from '@/lib/game-engine';

interface GameState {
  sessionId: string | null;

  // Real-time Data
  playerProfile: PlayerProfile;
  currentWorldState: WorldState;
  currentQuestState: QuestStatePublic | null;
  currentEnvState: EnvStateData | null;

  history: GameHistoryItem[];

  // UI Status
  isProcessing: boolean;
  isRolling: boolean;
  pendingTurn: { action: string; verdict: JudgeVerdict } | null;
  isDead: boolean;
  isTyping: boolean; // Controls delay for death screen / next action
  inputText: string; // For pre-filling input
  lastDeathReport: JudgeVerdict['death_report'];

  // Fast Simulation
  fastSimEnabled: boolean;
  prefetchedResults: Record<string, RunTurnResult>;
  isPrefetching: boolean;

  // History Compression
  compressedHistory: string;
  lastCompressionTurn: number;
  isCompressing: boolean;

  // Actions
  startNewGame: (worldId: string, extraItem?: {
    id: string;
    topic: string;
    description: string;
    carry_penalty?: {
      type: 'max_hp_reduction' | 'power_reduction' | 'trait_curse';
      value: number;
      description: string;
    };
  }, generatedTemplate?: string) => Promise<void>;
  submitAction: (actionContent: string) => Promise<void>;
  completeTurn: () => void;
  setTyping: (status: boolean) => void;
  setInputText: (text: string) => void;
  reset: () => void;
  loadState: (savedState: Partial<GameState>) => void;
  toggleFastSim: (enabled: boolean) => void;
  triggerPrefetch: (options: string[]) => Promise<void>;
  setAscended: () => void; // Trigger victory state
  triggerCompression: () => Promise<void>; // Async history compression
  setEnvState: (data: EnvStateData) => void;
}

type QuestStatePublic = QuestOutput;

const INITIAL_PROFILE: PlayerProfile = {
  id: 'p1',
  name: 'Operative',
  current_world_id: 'mistwood',
  status: 'alive',
  stats: { hp: 100, max_hp: 100, power: 10 },
  inventory: [],
  traits: []
};

const INITIAL_WORLD: WorldState = {
  world_id: 'mistwood',
  turn_count: 0,
  environment: {
    time: '18:00',
    weather: '...',
    location: '系统初始化中...'
  },
  flags: {},
  active_threats: []
};

function getKnownLore(currentWorldId: string): string[] {
  const entries = useAtlasStore.getState().entries;
  return entries
    .filter(e => {
      // STRICT Filtering: Only allow entries that explicitly belong to this world.
      // This prevents "pollution" where lore from World A appears in World B's context.
      // Global items/rules should have a specific handling if added later, but for now, strict is safer.
      return e.source_world_id === currentWorldId;
    })
    .slice(0, 30) // Still limit total context size
    .map(e => `${e.topic} (${e.category}): ${e.description}`);
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      playerProfile: INITIAL_PROFILE,
      currentWorldState: INITIAL_WORLD,
      currentQuestState: null,
      currentEnvState: null,
      history: [],
      isProcessing: false,
      isDead: false,
      isTyping: false,
      inputText: '',
      lastDeathReport: null,

      isRolling: false,
      pendingTurn: null,

      // Fast Simulation
      fastSimEnabled: false,
      prefetchedResults: {},
      isPrefetching: false,

      // History Compression
      compressedHistory: '',
      lastCompressionTurn: 0,
      isCompressing: false,

      completeTurn: () => {
        const { pendingTurn, history, currentWorldState, lastCompressionTurn, triggerCompression } = get();
        if (!pendingTurn) return;

        const newHistory = [...history, pendingTurn];
        set({
          history: newHistory,
          isRolling: false,
          pendingTurn: null,
          isTyping: true,
        });

        // Auto-trigger compression every 10 turns
        const currentTurn = currentWorldState.turn_count;
        if (newHistory.length >= 10 && (currentTurn - lastCompressionTurn) >= 10) {
          console.log(`[GameStore] Auto-triggering compression at turn ${currentTurn}`);
          triggerCompression();
        }
      },

      setTyping: (status: boolean) => set({ isTyping: status }),
      setInputText: (text: string) => set({ inputText: text }),

      toggleFastSim: (enabled: boolean) => {
        set({ fastSimEnabled: enabled });

        // Immediately trigger prefetch if enabling and options are available
        if (enabled) {
          const state = get();
          const lastTurn = state.history[state.history.length - 1];
          const options = lastTurn?.verdict.options;

          // Only trigger if: has session, has options, not already prefetching, no cached results
          if (
            state.sessionId &&
            options &&
            options.length > 0 &&
            !state.isPrefetching &&
            Object.keys(state.prefetchedResults).length === 0
          ) {
            const optionTexts = options.map((o: any) => o.text);
            get().triggerPrefetch(optionTexts);
          }
        }
      },

      triggerPrefetch: async (options: string[]) => {
        const state = get();
        if (!state.fastSimEnabled || !state.sessionId || options.length === 0) return;

        set({ isPrefetching: true });
        try {
          const res = await fetch('/api/game/prefetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: state.sessionId, options })
          });
          if (res.ok) {
            const results = await res.json();
            console.log('[FastSim] Prefetch complete. Keys stored:', Object.keys(results));
            set({ prefetchedResults: results });
          } else {
            // Handle error responses (404 = session not found, etc.)
            console.warn(`[FastSim] Prefetch failed with status ${res.status}`);
            set({ prefetchedResults: {} });
          }
        } catch (e) {
          console.warn('[FastSim] Prefetch network error:', e);
          set({ prefetchedResults: {} });
        } finally {
          set({ isPrefetching: false });
        }
      },

      startNewGame: async (worldId, extraItem, generatedTemplate) => {
        set({ isProcessing: true });

        try {
          const res = await fetch('/api/game/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              world_template_id: worldId,
              known_lore: getKnownLore(worldId),
              generated_world_template: generatedTemplate, // Pass generated template if available
              extra_items: extraItem ? [{
                id: extraItem.id,
                name: extraItem.topic,
                description: extraItem.description,
                type: 'misc',
                carry_penalty: extraItem.carry_penalty
              }] : []
            })
          });

          const data = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(data?.error_message || 'API failed');
          }

          const initialVerdict: JudgeVerdict = data.initial_verdict;

          set({
            sessionId: data.session_id,
            playerProfile: data.player_profile || { ...INITIAL_PROFILE, current_world_id: worldId },
            currentWorldState: data.world_state || { ...INITIAL_WORLD, world_id: worldId },
            currentQuestState: data.quest_state || null,
            currentEnvState: data.env_state || null,
            history: [{ action: '初始化', verdict: initialVerdict }],
            isProcessing: false,
            isDead: initialVerdict.is_death,
            isTyping: true, // Start typing effect
            lastDeathReport: initialVerdict.death_report,
            prefetchedResults: {}, // Clear any stale cache
          });

          // Trigger prefetch for initial options if Fast Sim is enabled
          const state = get();
          if (state.fastSimEnabled && initialVerdict.options.length > 0) {
            const optionTexts = initialVerdict.options.map((o: any) => o.text);
            state.triggerPrefetch(optionTexts);
          }
        } catch (error) {
          console.error('Start game failed:', error);
          set({ isProcessing: false });
        }
      },

      submitAction: async (actionContent: string) => {
        let state = get();
        if (state.isDead || state.isProcessing) return;
        if (!state.sessionId) return;

        // IMMEDIATELY set processing to prevent concurrent clicks
        set({ isProcessing: true });

        // If Fast Sim is enabled and prefetch is in progress, wait for it to complete
        if (state.fastSimEnabled && state.isPrefetching) {
          console.log('[FastSim] Waiting for prefetch to complete...');
          // Poll until isPrefetching becomes false (max 60 seconds)
          const maxWait = 60000;
          const pollInterval = 200;
          let waited = 0;
          while (get().isPrefetching && waited < maxWait) {
            await new Promise(r => setTimeout(r, pollInterval));
            waited += pollInterval;
          }
          console.log('[FastSim] Prefetch wait complete, waited:', waited, 'ms');
          state = get(); // Refresh state after waiting
        }

        // Check prefetch cache first
        console.log('[FastSim] Lookup key:', JSON.stringify(actionContent));
        console.log('[FastSim] Available keys:', Object.keys(state.prefetchedResults).map(k => JSON.stringify(k)));
        const cached = state.prefetchedResults[actionContent];
        if (cached && 'verdict' in cached) {
          console.log('[FastSim] Cache HIT for:', actionContent);
          set({
            playerProfile: cached.next_player_profile,
            currentWorldState: cached.next_world_state,
            currentQuestState: cached.next_quest_state,
            isDead: cached.verdict.is_death,
            lastDeathReport: cached.verdict.death_report,
            isProcessing: false, // Reset processing lock
            isRolling: true,
            pendingTurn: { action: actionContent, verdict: cached.verdict },
            prefetchedResults: {}, // Clear cache after use
          });

          // Lightweight sync: save cached result to server WITHOUT re-running engine
          // Sync with server (fire and forget generally, but we await to ensure save)
          try {
            const syncRes = await fetch('/api/game/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: get().sessionId,
                next_world_state: cached.next_world_state,
                next_player_profile: cached.next_player_profile,
                next_quest_state: cached.next_quest_state,
                verdict: cached.verdict, // Pass verdict for EnvState generation
              })
            });

            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.env_state) {
                get().setEnvState(syncData.env_state);
              }
            }
          } catch (e) {
            console.warn('[FastSim] Background sync failed:', e);
          }

          // Trigger prefetch for the NEXT turn's options immediately
          if (get().fastSimEnabled && cached.verdict.options.length > 0) {
            const optionTexts = cached.verdict.options.map((o: any) => o.text);
            get().triggerPrefetch(optionTexts);
          }

          return;
        }

        set({ prefetchedResults: {} }); // Clear stale cache (isProcessing already set earlier)

        const MAX_RETRIES = 5;
        let attempt = 0;

        while (attempt < MAX_RETRIES) {
          try {
            attempt++;

            // Only show toast on retries to avoid spamming on first success
            if (attempt > 1) {
              toast.loading(`Re-establishing uplink... (${attempt}/${MAX_RETRIES})`, {
                id: 'turn-retry',
                duration: 2000
              });
            }

            const res = await fetch('/api/game/turn', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: state.sessionId,
                player_action: { type: 'free_text', content: actionContent },
                known_lore: getKnownLore(state.playerProfile.current_world_id)
              })
            });

            if (res.status === 404) {
              console.warn("Session expired or invalid, resetting...");
              set({
                sessionId: null,
                isProcessing: false,
                history: [...state.history, {
                  action: actionContent,
                  verdict: {
                    turn_id: 0, is_death: false, is_victory: false, dice_roll: 0,
                    narrative: { content: "[System Error: Session Lost. Please restart.]", tone: "system" },
                    state_updates: { hp_change: 0, power_change: 0 },
                    options: [], death_report: null
                  }
                }]
              });
              return;
            }

            if (!res.ok) throw new Error('API failed');

            const result = await res.json();
            const { verdict, next_world_state, next_player_profile, next_quest_state, env_state } = result;

            // Clear any loading toasts
            toast.dismiss('turn-retry');

            // INSTEAD of updating history immediately:
            set({
              playerProfile: next_player_profile,
              currentWorldState: next_world_state,
              currentQuestState: next_quest_state,
              isDead: verdict.is_death,
              lastDeathReport: verdict.death_report,

              // Enter Rolling Phase
              isProcessing: false,
              isRolling: true,
              pendingTurn: { action: actionContent, verdict }
            });

            // Update EnvState if returned from API
            if (env_state) {
              get().setEnvState(env_state);
            }

            // Trigger prefetch during dice animation (earlier than typewriter finish)
            const currentState = get();
            if (currentState.fastSimEnabled && verdict.options.length > 0) {
              const optionTexts = verdict.options.map((o: any) => o.text);
              currentState.triggerPrefetch(optionTexts);
            }

            return; // Success, exit function

          } catch (error) {
            console.error(`Turn execution failed (Attempt ${attempt}):`, error);

            if (attempt < MAX_RETRIES) {
              // Wait before retrying (exponentialish backoff: 1s, 2s, 3s...)
              await new Promise(r => setTimeout(r, 1000 * attempt));
            } else {
              set({ isProcessing: false });
              toast.dismiss('turn-retry');
              toast.error("CONNECTION CRITICAL: Packet Loss. Manual retry required.");
            }
          }
        }
      },

      loadState: (savedState: Partial<GameState>) => {
        set({
          ...savedState,
          isProcessing: false,
          isRolling: false,
          pendingTurn: null,
          isTyping: false
        });
      },

      reset: () => set({ sessionId: null, history: [], isDead: false, isTyping: false }),

      setAscended: () => {
        const state = get();
        set({
          playerProfile: {
            ...state.playerProfile,
            status: 'ascended',
          },
        });
      },

      setEnvState: (data: EnvStateData) => {
        set({ currentEnvState: data });
      },

      triggerCompression: async () => {
        const state = get();
        if (!state.sessionId || state.isCompressing || state.history.length < 10) return;

        const lastCompressionTurn = state.lastCompressionTurn;
        const currentTurn = state.currentWorldState.turn_count;

        // Only compress if enough turns have passed since last compression
        if (currentTurn - lastCompressionTurn < 10) return;

        set({ isCompressing: true });
        console.log('[GameStore] Triggering history compression...');

        try {
          const res = await fetch('/api/game/compress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: state.sessionId,
              history: state.history,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            set({
              compressedHistory: data.compressed_history,
              lastCompressionTurn: currentTurn,
            });
            console.log(`[GameStore] Compression complete: ${data.compressed_turns} turns compressed`);
          }
        } catch (e) {
          console.error('[GameStore] Compression failed:', e);
        } finally {
          set({ isCompressing: false });
        }
      },
    }),
    {
      name: 'webgame-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        playerProfile: state.playerProfile,
        currentWorldState: state.currentWorldState,
        currentQuestState: state.currentQuestState,
        history: state.history,
        isDead: state.isDead,
        lastDeathReport: state.lastDeathReport,
        currentEnvState: state.currentEnvState
      })
    }
  )
);