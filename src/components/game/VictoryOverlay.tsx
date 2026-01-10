'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { useAtlasStore } from '@/lib/atlas-store';
import { WORLD_TEMPLATES } from '@/lib/world-constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Check, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LootItem, SettlementAtlasEntry } from '@/types/settlement';
import type { InventoryItem } from '@/types/game';

export function VictoryOverlay() {
    const { playerProfile, sessionId, reset, history, currentWorldState } = useGameStore();
    const { addEntry, addRunSummary } = useAtlasStore();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedSource, setSelectedSource] = useState<'loot_pool' | 'inventory' | null>(null);
    const [isSettling, setIsSettling] = useState(false);
    const [settled, setSettled] = useState(false);
    const [newLore, setNewLore] = useState<SettlementAtlasEntry[]>([]);

    // Only show if player status is 'ascended'
    if (playerProfile.status !== 'ascended') return null;

    // Get world's loot pool
    const worldKey = Object.keys(WORLD_TEMPLATES).find(
        (key) => WORLD_TEMPLATES[key].world_id === currentWorldState.world_id
    );
    const lootPool: LootItem[] = worldKey ? WORLD_TEMPLATES[worldKey].loot_pool : [];
    const inventory: InventoryItem[] = playerProfile.inventory || [];

    const handleSelect = (id: string, source: 'loot_pool' | 'inventory') => {
        setSelectedId(id);
        setSelectedSource(source);
    };

    const handleSettle = async () => {
        if (!selectedId || !selectedSource || !sessionId) return;

        setIsSettling(true);
        try {
            const res = await fetch('/api/game/settle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    chosen_loot_id: selectedId,
                    loot_source: selectedSource,
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Process new Lore from Archivist
                if (data.new_atlas_entries && data.new_atlas_entries.length > 0) {
                    setNewLore(data.new_atlas_entries);
                    data.new_atlas_entries.forEach((entry: SettlementAtlasEntry) => {
                        addEntry({
                            topic: entry.topic,
                            category: entry.category,
                            description: entry.description,
                            source_world_id: currentWorldState.world_id,
                            carry_penalty: entry.carry_penalty,
                        });
                    });
                }

                // Persist chosen loot to Atlas store
                if (data.chosen_loot) {
                    addEntry({
                        topic: data.chosen_loot.name,
                        category: data.chosen_loot.type === 'item' ? 'item' : 'secret',
                        description: `${data.chosen_loot.description} 【副作用】${data.chosen_loot.side_effect}`,
                        source_world_id: currentWorldState.world_id,
                    });
                }

                // Add run summary for victory (prefer AI-generated if available)
                const summaryText = data.run_summary?.summary
                    || `特工成功撤离，带走了【${data.chosen_loot?.name || '未知物品'}】。`;
                addRunSummary({
                    world_id: currentWorldState.world_id,
                    summary: summaryText,
                    outcome: 'escape',
                    turns_survived: currentWorldState.turn_count || history.length,
                });

                setSettled(true);
            } else {
                console.error('Settlement failed:', data.error_message);
            }
        } catch (error) {
            console.error('Settlement API error:', error);
        } finally {
            setIsSettling(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-1000 overflow-y-auto font-mono">
            {/* Background Grid & Scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,0,0.02)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

            <div className="max-w-4xl w-full relative z-20 border border-green-500/30 bg-black/80 p-6 md:p-12 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                {/* Decorative Terminal Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500" />

                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <div className="inline-block border border-green-500/50 px-4 py-1 text-xs text-green-400 uppercase tracking-[0.3em]">
                        System Notification
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase glitch-text">
                        Mission <span className="text-green-500">Complete</span>
                    </h1>
                    <p className="text-green-500/60 text-sm md:text-base max-w-lg mx-auto border-t border-green-500/20 pt-4 mt-4">
                        Subject extracted successfully. Local reality anchored.
                        <br />
                        Initiating resource recovery protocol...
                    </p>
                </div>

                {!settled ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                        {/* Loot Pool Section */}
                        {lootPool.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                    Artifacts Recovered
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {lootPool.map((loot) => (
                                        <div
                                            key={loot.id}
                                            onClick={() => handleSelect(loot.id, 'loot_pool')}
                                            className={cn(
                                                "group relative p-4 border transition-all duration-300 cursor-pointer",
                                                selectedId === loot.id && selectedSource === 'loot_pool'
                                                    ? "bg-amber-500/10 border-amber-500"
                                                    : "bg-zinc-900/40 border-zinc-800 hover:border-amber-500/50 hover:bg-amber-900/10"
                                            )}
                                        >
                                            {/* Selection Indicator */}
                                            {selectedId === loot.id && selectedSource === 'loot_pool' && (
                                                <div className="absolute top-2 right-2 w-2 h-2 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                                            )}

                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className={cn(
                                                    "font-bold text-lg tracking-tight",
                                                    selectedId === loot.id ? "text-amber-400" : "text-zinc-300 group-hover:text-amber-400"
                                                )}>
                                                    {loot.name}
                                                </h4>
                                                <span className="text-[10px] uppercase border border-zinc-700 px-1.5 py-0.5 text-zinc-500 bg-black">
                                                    Class: {loot.type}
                                                </span>
                                            </div>

                                            <p className="text-xs text-zinc-400 leading-relaxed mb-3 border-l-2 border-zinc-800 pl-2">
                                                {loot.description}
                                            </p>

                                            <div className="flex items-center gap-2 text-[10px] text-red-400/90 bg-red-950/20 p-2 border border-red-900/30">
                                                <AlertTriangle className="w-3 h-3" />
                                                WARNING: {loot.side_effect}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Inventory Section */}
                        {inventory.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    Personnel Equipment
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {inventory.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelect(item.id, 'inventory')}
                                            className={cn(
                                                "relative p-3 border transition-all duration-200 cursor-pointer h-full flex flex-col justify-between",
                                                selectedId === item.id && selectedSource === 'inventory'
                                                    ? "bg-green-500/10 border-green-500"
                                                    : "bg-zinc-900/40 border-zinc-800 hover:border-green-500/50 hover:bg-green-900/10"
                                            )}
                                        >
                                            {selectedId === item.id && selectedSource === 'inventory' && (
                                                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                                            )}

                                            <div className="text-sm font-bold text-zinc-300 mb-1 truncate">
                                                {item.name}
                                            </div>
                                            <div className="text-[10px] text-zinc-600 uppercase">
                                                {item.type}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Bar */}
                        <div className="pt-8 border-t border-zinc-800 flex justify-end">
                            <Button
                                size="lg"
                                disabled={!selectedId || isSettling}
                                onClick={handleSettle}
                                className={cn(
                                    "min-w-[200px] h-12 text-sm font-bold uppercase tracking-[0.2em] transition-all border",
                                    !selectedId
                                        ? "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed"
                                        : "bg-green-500 text-black border-green-400 hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                                )}
                            >
                                {isSettling ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Confirm Selection <span className="text-lg">»</span>
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Post-Settlement State */
                    <div className="text-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-green-500 text-green-500 mb-4 bg-green-500/10">
                            <Check className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
                            Transfer Complete
                        </h2>
                        <p className="text-zinc-500 text-sm max-w-md mx-auto">
                            Asset successfully logged in the Atlas Archive.
                            Wait for neural disconnect procedure.
                        </p>

                        {/* New Lore Display */}
                        {newLore.length > 0 && (
                            <div className="space-y-3 text-left max-w-md mx-auto pt-4 border-t border-zinc-800 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-center gap-2 text-green-500/80 text-xs font-bold uppercase tracking-widest">
                                    <Database className="w-3 h-3" /> Atlas Database Updated
                                </div>
                                {newLore.map((entry, i) => (
                                    <Card key={i} className="bg-zinc-900/50 border-green-900/30">
                                        <CardHeader className="p-3 pb-1">
                                            <CardTitle className="text-sm font-mono text-green-400 flex justify-between items-center">
                                                <span>{entry.topic}</span>
                                                <span className="text-[10px] bg-green-950 px-1.5 py-0.5 rounded text-green-600 border border-green-900">{entry.category}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-1 text-xs text-zinc-400">
                                            {entry.description}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        <Button
                            onClick={() => reset()}
                            className="mt-8 bg-zinc-900 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black w-64 h-12 uppercase tracking-widest font-bold transition-all"
                        >
                            Terminate Session
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
