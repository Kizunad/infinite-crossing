import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayerProfile, QuestOutput, WorldState, JudgeVerdict } from '@/types/game';

// Snapshot of the game state needed to restore a session
export interface GameSaveData {
    sessionId: string | null;
    playerProfile: PlayerProfile;
    currentWorldState: WorldState;
    currentQuestState: QuestOutput | null;
    history: { action: string; verdict: JudgeVerdict }[];
    isDead: boolean;
    lastDeathReport: JudgeVerdict['death_report'];
}

export interface SaveSlot {
    id: string;
    timestamp: number;
    label: string;
    worldId: string;
    data: GameSaveData;
}

interface SaveState {
    slots: SaveSlot[];
    saveGame: (slotId: string, label: string, data: GameSaveData) => void;
    deleteSave: (slotId: string) => void;
    loadGame: (slotId: string) => GameSaveData | null;
}

export const useSaveStore = create<SaveState>()(
    persist(
        (set, get) => ({
            slots: [],

            saveGame: (slotId, label, data) => {
                set((state) => {
                    const newSlot: SaveSlot = {
                        id: slotId,
                        timestamp: Date.now(),
                        label,
                        worldId: data.playerProfile.current_world_id,
                        data
                    };

                    // Replace existing or add new
                    const existingIndex = state.slots.findIndex(s => s.id === slotId);
                    if (existingIndex >= 0) {
                        const newSlots = [...state.slots];
                        newSlots[existingIndex] = newSlot;
                        return { slots: newSlots };
                    } else {
                        return { slots: [...state.slots, newSlot] };
                    }
                });
            },

            deleteSave: (slotId) => {
                set((state) => ({
                    slots: state.slots.filter((s) => s.id !== slotId),
                }));
            },

            loadGame: (slotId) => {
                const slot = get().slots.find((s) => s.id === slotId);
                return slot ? slot.data : null;
            },
        }),
        {
            name: 'webgame-saves', // localStorage key
        }
    )
);
