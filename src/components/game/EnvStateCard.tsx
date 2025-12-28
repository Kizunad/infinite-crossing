'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, CloudFog, ChevronRight, Eye, Ear, Wind, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThreatLevel } from '@/types/game';

const THREAT_COLORS: Record<ThreatLevel, string> = {
    safe: 'text-green-400 border-green-500/30',
    notice: 'text-blue-400 border-blue-500/30',
    warning: 'text-yellow-400 border-yellow-500/30',
    danger: 'text-red-400 border-red-500/30',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    '视觉': <Eye className="w-3 h-3" />,
    '听觉': <Ear className="w-3 h-3" />,
    '嗅觉': <Wind className="w-3 h-3" />,
    '危险': <AlertTriangle className="w-3 h-3" />,
};

export function EnvStateCard() {
    const { currentEnvState, currentWorldState } = useGameStore();
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        setOpenItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Use EnvState data if available, otherwise fallback to basic world state
    const core = currentEnvState?.core || {
        time: currentWorldState.environment.time,
        location: currentWorldState.environment.location,
        weather: currentWorldState.environment.weather,
    };
    const senses = currentEnvState?.senses || [];

    return (
        <Card className="shrink-0 relative overflow-hidden group">
            {/* Scanline Effect */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-green-500/30 blur-[1px] animate-scan pointer-events-none z-0" />

            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium flex items-center gap-2 font-mono text-green-400">
                    <CloudFog className="w-4 h-4" /> &gt; ENV_STATE
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 font-mono text-xs relative z-10">
                {/* Core Info - Always Visible */}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Loc</span>
                    <span className="font-medium text-right text-zinc-300">{core.location}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Atm</span>
                    <span className="font-medium text-right text-zinc-300">{core.weather}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium flex items-center gap-1 text-zinc-300">
                        <Clock className="w-3 h-3" /> {core.time}
                    </span>
                </div>

                {/* Collapsible Senses */}
                {senses.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800 space-y-1">
                        {senses.map((item) => (
                            <Collapsible
                                key={item.id}
                                open={openItems.has(item.id)}
                                onOpenChange={() => toggleItem(item.id)}
                            >
                                <CollapsibleTrigger className={cn(
                                    "w-full flex items-center gap-2 p-1.5 rounded border transition-all",
                                    "hover:bg-zinc-800/50 cursor-pointer",
                                    THREAT_COLORS[item.threat_level] || THREAT_COLORS.notice
                                )}>
                                    <ChevronRight className={cn(
                                        "w-3 h-3 transition-transform",
                                        openItems.has(item.id) && "rotate-90"
                                    )} />
                                    {CATEGORY_ICONS[item.category] || <Eye className="w-3 h-3" />}
                                    <span className="flex-1 text-left text-xs">{item.summary}</span>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pl-6 pr-2 py-1 text-xs text-muted-foreground">
                                    {item.details}
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
