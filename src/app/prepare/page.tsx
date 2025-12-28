'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/game';
import { useAtlasStore } from '@/lib/atlas-store';
import { useGeneratedWorldStore } from '@/lib/generated-world-store';
import { Button } from '@/components/ui/button';
import { LoadingSequence } from '@/components/game/LoadingSequence';
import { Shuffle, Play, ArrowLeft } from 'lucide-react';

function PrepareContent() {
    const { sessionId, startNewGame, isProcessing } = useGameStore();
    const { entries: atlasEntries } = useAtlasStore();
    const { worlds: generatedWorlds, getWorld, incrementPlayCount, fetchWorlds } = useGeneratedWorldStore();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    const [selectedAtlasItem, setSelectedAtlasItem] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const initialWorldId = searchParams.get('world') || 'mistwood';
    const [worldId, setWorldId] = useState(initialWorldId);

    // All available worlds (static + generated)
    const allWorlds = useMemo(() => {
        const staticWorlds = [
            { id: 'mistwood', name: 'MISTWOOD SECTOR', type: 'static' },
            { id: 'cycoflora', name: 'CYCOFLORA SECTOR', type: 'static' },
        ];
        const dynamicWorlds = generatedWorlds.map(w => ({
            id: w.id,
            name: w.name.toUpperCase(),
            type: 'generated'
        }));
        return [...staticWorlds, ...dynamicWorlds];
    }, [generatedWorlds]);

    // Get current world display name
    const currentWorld = allWorlds.find(w => w.id === worldId);
    const worldDisplayName = currentWorld?.name || worldId.toUpperCase() + ' SECTOR';

    const isGeneratedWorld = worldId.startsWith('gen_');
    const generatedWorld = isGeneratedWorld ? getWorld(worldId) : undefined;

    useEffect(() => {
        setMounted(true);
        // Fetch worlds from Supabase on mount
        fetchWorlds();
    }, [fetchWorlds]);

    // Random world selection
    const handleRandomWorld = () => {
        if (allWorlds.length === 0) return;
        const randomIndex = Math.floor(Math.random() * allWorlds.length);
        const randomWorld = allWorlds[randomIndex];
        setWorldId(randomWorld.id);
    };

    // If already have a session, redirect to game
    useEffect(() => {
        if (sessionId && mounted) {
            router.push('/game');
        }
    }, [sessionId, mounted, router]);

    if (!mounted) return <div className="h-screen bg-black" />;

    if (isProcessing) {
        return <LoadingSequence worldId={worldId} />;
    }

    const availableItems = atlasEntries.filter(e => e.category === 'item');
    const selectedEntry = selectedAtlasItem
        ? availableItems.find(e => e.id === selectedAtlasItem)
        : undefined;

    const handleStartGame = () => {
        if (isGeneratedWorld) {
            incrementPlayCount(worldId);
        }
        startNewGame(
            worldId,
            selectedEntry ? {
                id: selectedEntry.id,
                topic: selectedEntry.topic,
                description: selectedEntry.description,
                carry_penalty: selectedEntry.carry_penalty
            } : undefined,
            generatedWorld?.template_content
        );
    };

    return (
        <main className="dark h-screen w-full flex flex-col items-center justify-center bg-black text-green-500 font-mono gap-8 p-4 relative overflow-hidden">
            {/* CRT Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />

            <div className="flex flex-col md:flex-row gap-8 z-10 max-w-5xl w-full items-start justify-center">
                {/* LEFT: System Link / Connection Panel */}
                <div className="flex-1 space-y-6 text-center border border-green-500/30 p-8 bg-black/80 shadow-[0_0_20px_rgba(34,197,94,0.1)] w-full max-w-md mx-auto">
                    <h1 className="text-3xl font-bold tracking-widest uppercase animate-pulse drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                        &gt; SYSTEM LINK
                    </h1>

                    {/* Target Selection with Random Button */}
                    <div className="text-sm space-y-3 text-green-400/80">
                        <div className="flex items-center justify-center gap-3">
                            <span>Target:</span>
                            <span className="text-white uppercase flex-1 text-left truncate max-w-[180px]">
                                {worldDisplayName}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRandomWorld}
                                className="text-green-500 hover:text-green-400 hover:bg-green-900/20 p-2 h-8 w-8"
                                title="Random World"
                            >
                                <Shuffle className="w-4 h-4" />
                            </Button>
                        </div>
                        <p>Protocol: <span className="text-white">Omega-3</span></p>
                        <p>Encryption: <span className="text-white">Quantum-Entangled</span></p>
                        {currentWorld?.type === 'generated' && (
                            <p className="text-purple-400 text-xs">[ USER-GENERATED DIMENSION ]</p>
                        )}
                    </div>

                    <div className="h-px w-full bg-green-500/30 my-4" />

                    <div className="space-y-4">
                        {/* Display Selected Loadout if any */}
                        {selectedEntry && (
                            <div className={`text-xs border p-3 mb-4 rounded text-left ${selectedEntry.carry_penalty ? 'bg-red-950/30 border-red-500/50' : 'bg-green-950/30 border-green-500/30'}`}>
                                <p className="text-green-400 font-bold mb-1 uppercase">&gt; EXTRA LOADOUT EQUIPPED</p>
                                <p className="text-white">{selectedEntry.topic}</p>
                                <p className="opacity-60 italic mt-1">{selectedEntry.description.substring(0, 50)}...</p>
                                {selectedEntry.carry_penalty && (
                                    <div className="mt-2 pt-2 border-t border-red-500/30">
                                        <p className="text-red-400 text-[10px] uppercase font-bold">⚠️ 跨维度惩罚</p>
                                        <p className="text-red-300/80 text-[10px] mt-1">{selectedEntry.carry_penalty.description}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <Button
                                size="lg"
                                onClick={handleStartGame}
                                className="w-full bg-green-900/20 text-green-400 border border-green-500/50 hover:bg-green-500 hover:text-black transition-all duration-300 font-mono"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                [ INITIATE CONNECTION ]
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={() => router.push('/')}
                                className="w-full text-green-600 hover:text-green-400 hover:bg-green-900/10 font-mono text-xs"
                            >
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                ABORT SEQUENCE
                            </Button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Atlas Loadout Protocol */}
                <div className="flex-1 h-[500px] flex flex-col border border-green-500/20 p-6 bg-black/90 w-full max-w-md mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

                    <h2 className="text-xl font-bold tracking-wider uppercase mb-4 text-green-400 flex items-center gap-2 relative z-10">
                        <span className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
                        LOADOUT PROTOCOL
                    </h2>
                    <p className="text-xs text-green-500/60 mb-4 border-b border-green-500/20 pb-2 relative z-10">
            // Select one additional artifact from the Atlas database to materialize in this simulation.
                    </p>

                    {availableItems.length > 0 ? (
                        <>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar relative z-10">
                                {availableItems.map(item => {
                                    const isSelected = selectedAtlasItem === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedAtlasItem(isSelected ? null : item.id)}
                                            className={`
                        cursor-pointer border p-3 transition-all duration-200 group
                        ${isSelected
                                                    ? 'bg-green-500/10 border-green-400 text-green-100 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                                    : 'bg-transparent border-green-500/20 text-green-500/70 hover:border-green-500/50 hover:bg-green-500/5'}
                      `}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold uppercase text-sm truncate">{item.topic}</span>
                                                {isSelected && <span className="text-[10px] bg-green-500 text-black px-1 rounded animate-pulse">ACTIVE</span>}
                                            </div>
                                            <p className="text-[10px] opacity-70 leading-relaxed font-sans line-clamp-2">
                                                {item.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 pt-2 border-t border-green-500/20 text-[10px] text-green-500/40 uppercase flex justify-between relative z-10">
                                <span>AVAILABLE: {availableItems.length}</span>
                                <span>CAPACITY: 1 SLOT</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-green-500/30 text-center relative z-10">
                            <div className="w-16 h-16 border border-dashed border-green-500/30 rounded flex items-center justify-center mb-4">
                                <span className="text-2xl opacity-50">?</span>
                            </div>
                            <p className="font-bold uppercase tracking-widest mb-1">&gt; DATABASE_EMPTY</p>
                            <p className="text-[10px] max-w-[200px]">
                                No eligible artifacts found in Atlas. Explore worlds to unlock permanent loadout items.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function PreparePage() {
    return (
        <Suspense fallback={<div className="h-screen bg-black text-green-500 flex items-center justify-center font-mono">SCANNING...</div>}>
            <PrepareContent />
        </Suspense>
    );
}
