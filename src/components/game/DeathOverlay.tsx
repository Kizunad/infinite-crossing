'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/game';
import { useAtlasStore, AtlasEntry } from '@/lib/atlas-store';
import { Button } from '@/components/ui/button';
import { Skull, Database, BookOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useGeneratedWorldStore } from '@/lib/generated-world-store';

export function DeathOverlay() {
    const { isDead, isTyping, lastDeathReport, reset, history, playerProfile, currentWorldState } = useGameStore();
    const { entries, addEntry, addRunSummary } = useAtlasStore();
    const [analyzing, setAnalyzing] = useState(false);
    const [newLore, setNewLore] = useState<Omit<AtlasEntry, 'id' | 'unlocked_at'>[]>([]);
    const [runSummary, setRunSummary] = useState<string>("");

    useEffect(() => {
        // Trigger analysis once when overlay appears
        if (isDead && !isTyping && !analyzing && newLore.length === 0 && !runSummary) {
            setAnalyzing(true);

            // For generated worlds, we must provide the template content as the backend cannot load it by ID
            const isGenerated = playerProfile.current_world_id.startsWith('gen_');
            let worldTemplateContent: string | undefined;

            if (isGenerated) {
                const generatedWorld = useGeneratedWorldStore.getState().getWorld(playerProfile.current_world_id);
                worldTemplateContent = generatedWorld?.template_content;
            }

            fetch('/api/game/atlas', {
                method: 'POST',
                body: JSON.stringify({
                    world_id: playerProfile.current_world_id,
                    world_template: worldTemplateContent,
                    history,
                    existing_topics: entries.map(e => e.topic)
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.new_entries) {
                        setNewLore(data.new_entries);
                        setRunSummary(data.run_summary);
                        // Persist lore entries to store
                        data.new_entries.forEach((entry: any) => addEntry({
                            ...entry,
                            source_world_id: useGameStore.getState().playerProfile.current_world_id
                        }));
                        // Persist run summary (Tombstone)
                        if (data.run_summary) {
                            addRunSummary({
                                world_id: useGameStore.getState().playerProfile.current_world_id,
                                summary: data.run_summary,
                                outcome: 'death',
                                turns_survived: useGameStore.getState().currentWorldState?.turn_count || history.length,
                            });
                        }
                    }
                })
                .catch(err => console.error("Atlas Error:", err))
                .finally(() => setAnalyzing(false));
        }
    }, [isDead, isTyping, analyzing, newLore.length, runSummary, playerProfile.current_world_id, history, entries, addEntry, addRunSummary]);

    // Only show if dead AND narrative has finished typing
    if (!isDead || isTyping) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-1000 backdrop-blur-sm overflow-y-auto">
            <div className="max-w-md w-full text-center space-y-6 my-auto">
                <div className="relative">
                    <Skull className="w-20 h-20 text-red-700 mx-auto animate-pulse" />
                    <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
                </div>

                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-red-600 tracking-[0.2em] uppercase font-mono">Terminated</h1>
                    <p className="text-zinc-500 font-mono text-xs">Vital signs zero. Neural link collapsed.</p>
                </div>

                {/* Death Report */}
                {lastDeathReport && (
                    <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl space-y-2 text-left relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-800/50" />
                        <div>
                            <div className="text-[10px] text-red-500 uppercase tracking-widest mb-1">Cause of Termination</div>
                            <div className="font-bold text-red-100">{lastDeathReport.cause_of_death}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-red-500 uppercase tracking-widest mb-1">Tactical Analysis</div>
                            <div className="text-xs text-red-300/80 italic leading-relaxed">
                                "{lastDeathReport.avoidance_suggestion}"
                            </div>
                        </div>
                    </div>
                )}

                {/* Atlas Updates */}
                <div className="space-y-2">
                    {analyzing ? (
                        <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading Mission Data to Atlas...
                        </div>
                    ) : newLore.length > 0 ? (
                        <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-center gap-2 text-green-500/80 text-xs font-bold uppercase tracking-widest">
                                <Database className="w-3 h-3" /> Atlas Database Updated
                            </div>
                            {newLore.map((entry, i) => (
                                <Card key={i} className="bg-zinc-900/50 border-green-900/30 text-left">
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
                    ) : null}
                </div>

                <Button
                    size="lg"
                    className="w-full bg-red-900 hover:bg-red-800 text-red-100 font-bold tracking-widest uppercase h-12 border border-red-700 cursor-pointer"
                    onClick={() => {
                        reset();
                    }}
                >
                    Re-Initialize Sequence
                </Button>
            </div>
        </div>
    );
}