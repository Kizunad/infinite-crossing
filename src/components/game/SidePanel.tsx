'use client';

import { useGameStore } from '@/store/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, CloudFog, ShieldAlert, Backpack, Package, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { AtlasDialog } from './AtlasDialog';
import { SaveLoadDialog } from './SaveLoadDialog';
import { EnvStateCard } from './EnvStateCard';

export function SidePanel() {
    const { playerProfile, currentWorldState, currentQuestState, history, setInputText, fastSimEnabled, toggleFastSim, isPrefetching } = useGameStore();
    const stats = playerProfile.stats;
    const inventory = playerProfile.inventory || [];

    // Safe defaults for stats to prevent UI glitches with legacy sessions
    const hp = stats.hp ?? 100;
    const maxHp = stats.max_hp ?? 100;
    const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 0;

    const lastVerdict = history.length > 0 ? history[history.length - 1].verdict : null;
    const lastDiceRoll = lastVerdict?.dice_roll;

    const handleItemClick = (itemName: string) => {
        setInputText(`Use ${itemName} on...`);
    };

    return (
        <aside className="w-80 h-full border-r border-zinc-800 bg-black/50 flex flex-col overflow-hidden backdrop-blur-sm z-20">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
                {/* Dice Roll Display (New) */}
                {lastDiceRoll !== undefined && (
                    <Card className="bg-primary/5 border-primary/20 shrink-0">
                        <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-primary font-mono">&gt; RNG_OUTPUT</span>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-xl font-bold font-mono",
                                    lastDiceRoll > 80 ? "text-green-500" :
                                        lastDiceRoll < 20 ? "text-red-500" : "text-foreground"
                                )}>
                                    {lastDiceRoll}
                                </span>
                                <span className="text-xs text-muted-foreground">/ 100</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Environment Card */}
                <EnvStateCard />

                {/* Stats Card */}
                <Card className="shrink-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 font-mono text-green-400">
                            <ShieldAlert className="w-4 h-4" /> &gt; SYSTEM_INTEGRITY
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1 font-mono">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">HP_VAL</span>
                                <span className="text-zinc-300">{hp} / {maxHp}</span>
                            </div>
                            <Progress
                                value={hpPercent}
                                className="h-2 bg-red-950/20"
                                indicatorClassName={cn(
                                    "bg-red-500 transition-all duration-500 ease-out",
                                    hpPercent < 30 && "animate-pulse-fast"
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Inventory Card */}
                <Card className="shrink-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 font-mono text-green-400">
                            <Backpack className="w-4 h-4" /> &gt; LOCAL_CACHE
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        {inventory.length === 0 ? (
                            <div className="text-xs text-muted-foreground text-center py-4 border border-dashed border-zinc-800 rounded font-mono">
                                [ NULL ]
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {inventory.map((item) => (
                                    <Button
                                        key={item.id}
                                        variant="outline"
                                        className="h-auto py-2 px-2 flex flex-col items-start gap-1 text-left whitespace-normal break-words border-zinc-800 hover:border-green-500/50 hover:bg-green-950/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                        onClick={() => handleItemClick(item.name)}
                                        title={item.description}
                                    >
                                        <div className="flex items-center gap-1 w-full">
                                            <Package className="w-3 h-3 shrink-0 text-primary" />
                                            <span className="font-semibold text-xs leading-none font-mono text-zinc-300">{item.name}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground line-clamp-2 leading-tight w-full font-mono">
                                            {item.type}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Objectives */}
                <Card className="shrink-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium font-mono text-green-400">// TASKS</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 font-mono">
                        {currentQuestState && (
                            <ul className="space-y-2 text-xs">
                                {currentQuestState.visible_objectives.map((obj) => (
                                    <li key={obj.id} className="flex gap-2">
                                        <span className={cn("text-green-500 shrink-0", obj.status === 'completed' ? 'opacity-50' : '')}>
                                            {obj.status === 'completed' ? '[x]' : '[ ]'}
                                        </span>
                                        <span className={obj.status === 'completed' ? 'line-through text-muted-foreground' : 'text-zinc-300'}>
                                            {obj.text}
                                        </span>
                                    </li>
                                ))}
                                {currentQuestState.visible_objectives.length === 0 && (
                                    <span className="text-muted-foreground italic">No active objectives.</span>
                                )}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Fixed Footer for Atlas */}
            <div className="p-4 border-t bg-background/50 backdrop-blur shrink-0 space-y-2">
                {/* Fast Simulation Toggle */}
                <Button
                    variant={fastSimEnabled ? "default" : "outline"}
                    size="sm"
                    className={cn(
                        "w-full font-mono text-xs transition-all",
                        fastSimEnabled && "bg-primary/80 hover:bg-primary"
                    )}
                    onClick={() => toggleFastSim(!fastSimEnabled)}
                >
                    {isPrefetching ? (
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                        <Zap className={cn("w-3 h-3 mr-2", fastSimEnabled && "fill-current")} />
                    )}
                    Fast Sim: {fastSimEnabled ? 'ON' : 'OFF'}
                </Button>
                <div className="flex gap-2">
                    <AtlasDialog />
                    <SaveLoadDialog />
                </div>
            </div>
        </aside>
    );
}
