'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGameStore } from '@/store/game';
import { useSaveStore, GameSaveData } from '@/store/save-system';
import { WORLD_TEMPLATES } from '@/lib/world-constants';
import { Save, Download, Trash2, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function SaveLoadDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('load');
    const [saveLabel, setSaveLabel] = useState('');
    const [allowSave, setAllowSave] = useState(false);

    const {
        playerProfile,
        currentWorldState,
        currentQuestState,
        sessionId,
        history,
        isDead,
        lastDeathReport,
        loadState
    } = useGameStore();

    const { slots, saveGame, loadGame, deleteSave } = useSaveStore();

    // Check if current world allows saving
    useEffect(() => {
        if (isOpen && playerProfile.current_world_id) {
            const worldId = playerProfile.current_world_id;
            // Try direct key lookup first, then search by world_id property
            const meta = WORLD_TEMPLATES[worldId] ??
                Object.values(WORLD_TEMPLATES).find(m => m.world_id === worldId);
            setAllowSave(!!meta?.allowSave);
        }
    }, [isOpen, playerProfile.current_world_id]);

    const handleSave = () => {
        if (!allowSave) return;

        const slotId = `save_${Date.now()}`;
        const label = saveLabel.trim() || `Save ${new Date().toLocaleTimeString()}`;

        const saveData: GameSaveData = {
            sessionId,
            playerProfile,
            currentWorldState,
            currentQuestState,
            history,
            isDead,
            lastDeathReport
        };

        saveGame(slotId, label, saveData);
        setSaveLabel('');
        toast.success('Game Saved Successfully');
        setActiveTab('load'); // Switch to view saves
    };

    const handleLoad = (slotId: string) => {
        const data = loadGame(slotId);
        if (data) {
            loadState(data);
            setIsOpen(false);
            toast.success('Game Loaded Successfully');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 gap-2 border-zinc-700 bg-black/40 hover:bg-green-900/20 hover:text-green-400 hover:border-green-500/50 transition-all">
                    <Save className="w-3.5 h-3.5" />
                    SAVE / LOAD
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-zinc-800 text-zinc-300 font-mono shadow-[0_0_30px_rgba(0,0,0,0.8)] max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-green-500 tracking-wider flex items-center gap-2">
                        <HardDrive className="w-5 h-5" /> &gt; SYSTEM_MEMORY_BANK
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-zinc-900/50 border border-zinc-800 w-full justify-start rounded-none p-0 h-auto">
                        <TabsTrigger
                            value="load"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-500 data-[state=active]:bg-green-900/10 px-6 py-2 flex-1"
                        >
                            LOAD_DATA
                        </TabsTrigger>
                        <TabsTrigger
                            value="save"
                            disabled={!allowSave || isDead}
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-500 data-[state=active]:bg-green-900/10 px-6 py-2 flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            WRITE_DATA {(!allowSave) && '(LOCKED)'}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="save" className="pt-4 space-y-4">
                        {!allowSave ? (
                            <div className="p-8 text-center border border-red-900/30 bg-red-950/10 text-red-500 rounded">
                                <p className="text-lg mb-2">[ ERROR: WRITE_PROTECTED ]</p>
                                <p className="text-sm opacity-70">Atmospheric interference prevents establishing a memory uplink in this sector.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">MEMORY_LABEL</label>
                                    <Input
                                        placeholder="Enter description..."
                                        value={saveLabel}
                                        onChange={(e) => setSaveLabel(e.target.value)}
                                        className="bg-black border-zinc-700 focus:border-green-500 font-mono"
                                    />
                                </div>
                                <div className="p-4 border border-green-900/30 bg-green-950/5 rounded text-xs space-y-1 text-green-400/80">
                                    <p>LOCATION: {currentWorldState.environment.location}</p>
                                    <p>TIME: {currentWorldState.environment.time}</p>
                                    <p>STATUS: {isDead ? 'CRITICAL' : 'STABLE'}</p>
                                </div>
                                <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-500 text-black font-bold">
                                    <Save className="w-4 h-4 mr-2" />
                                    COMMIT_TO_MEMORY
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="load" className="pt-4">
                        <ScrollArea className="h-[300px] w-full pr-4">
                            {slots.length === 0 ? (
                                <div className="text-center text-muted-foreground py-12 italic border border-dashed border-zinc-800">
                                    active_memory_banks: 0
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {slots.sort((a, b) => b.timestamp - a.timestamp).map((slot) => (
                                        <div key={slot.id} className="group flex items-center justify-between p-3 border border-zinc-800 bg-zinc-950/50 hover:border-green-500/50 hover:bg-green-950/10 transition-all rounded">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-500 font-bold text-sm">#{slot.id.slice(-4)}</span>
                                                    <span className="text-zinc-200 font-medium">{slot.label}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex gap-3">
                                                    <span>{new Date(slot.timestamp).toLocaleString()}</span>
                                                    <span className="text-zinc-500">|</span>
                                                    <span>{slot.worldId}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-900/20" onClick={() => handleLoad(slot.id)}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/20" onClick={() => deleteSave(slot.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
