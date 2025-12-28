'use client';

import { useEffect, useState, useRef } from 'react';
import { useAtlasStore } from '@/lib/atlas-store';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Terminal, Database, ShieldAlert, Cpu } from 'lucide-react';

const SYSTEM_LOGS = [
    "Initializing neural handshake...",
    "Bypassing quantum firewall...",
    "Allocating memory sectors...",
    "Deciphering world seeds...",
    "Injecting personality matrix...",
    "Optimizing narrative pathways...",
    "Verifying causality consistency...",
    "Suppressing reality paradoxes...",
    "Loading asset bundles: [TEXTURES]...",
    "Loading asset bundles: [AUDIO]...",
    "Establishing secure uplink...",
    "Synchronizing with temporal anchor...",
    "Detecting user bio-metrics...",
    "Calibrating difficulty algorithms...",
    "Scanning for anomalies...",
    "Downloading sector maps...",
    "Linking to Atlas global database...",
    "Encrypting player choices...",
    "Rerouting power to logic cores...",
    "System green. Standing by for specific world data...",
    "Resolving ambiguous timelines...",
    "Fragmenting consciousness stream...",
    "Rebuilding user avatar shape...",
    "Testing sensory inputs...",
    "WARNING: Minor timeline fluctuation detected...",
    "Stabilizing...",
    "Compiling generated history...",
    "Finalizing session parameters..."
];

export function LoadingSequence({ worldId }: { worldId: string }) {
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [currentLore, setCurrentLore] = useState<{ topic: string, desc: string } | null>(null);
    const { entries } = useAtlasStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Progress Bar & Logs logic
    useEffect(() => {
        // Progress reaches 90% in about 45s, then crawls
        const progressInterval = setInterval(() => {
            setProgress(p => {
                if (p >= 95) return p; // Wait for actual completion
                // Fast at start, slow at end
                const increment = p < 30 ? 2 : p < 70 ? 0.5 : 0.1;
                return Math.min(95, p + increment);
            });
        }, 500);

        // Logs appear randomly
        const logInterval = setInterval(() => {
            const randomLog = SYSTEM_LOGS[Math.floor(Math.random() * SYSTEM_LOGS.length)];
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 });
            setLogs(prev => [...prev.slice(-10), `[${timestamp}] ${randomLog}`]);
        }, 800);

        return () => {
            clearInterval(progressInterval);
            clearInterval(logInterval);
        };
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Lore Injection logic (every 8 seconds)
    useEffect(() => {
        const injectLore = () => {
            // Filter lore for current world, only show data from current world context
            const worldEntries = entries.filter(e => e.source_world_id === worldId || !e.source_world_id);

            if (worldEntries.length > 0) {
                const randomEntry = worldEntries[Math.floor(Math.random() * worldEntries.length)];
                setCurrentLore({ topic: randomEntry.topic, desc: randomEntry.description });
            } else {
                // Fallback hints if no lore known yet for this world
                const FALLBACK_HINTS = [
                    { topic: "SURVIVAL TIP", desc: "Death is not the end. Your 'Atlas' gathers data from every failure." },
                    { topic: "WORLD DATA", desc: `You are entering ${worldId.toUpperCase()}. Expect heavy resistance.` },
                    { topic: "OPERATIVE INSTRUCTION", desc: "Use the 'Terminal' to input free-form actions. Creativity is rewarded." }
                ];
                setCurrentLore(FALLBACK_HINTS[Math.floor(Math.random() * FALLBACK_HINTS.length)]);
            }
        };

        injectLore(); // Immediate first hint
        const interval = setInterval(injectLore, 8000);
        return () => clearInterval(interval);
    }, [entries, worldId]);

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 font-mono overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 shadow-[0_0_10px_#22c55e]" />

            <div className="max-w-2xl w-full space-y-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between text-green-500 border-b border-green-500/30 pb-2">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 animate-pulse" />
                        <span className="font-bold tracking-widest">ESTABLISHING LINK :: {worldId.toUpperCase()}</span>
                    </div>
                    <div className="text-xs">{progress.toFixed(1)}%</div>
                </div>

                {/* Main Progress Visualization */}
                <div className="space-y-2">
                    <Progress value={progress} className="h-2 bg-green-900/20 indicator-green" />
                    <div className="flex justify-between text-[10px] text-green-500/60 uppercase">
                        <span>Allocating Resources</span>
                        <span>Compiling World State</span>
                        <span>Neural Synchronization</span>
                    </div>
                </div>

                {/* Two Column Layout: Logs & Lore */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
                    {/* System Logs */}
                    <Card className="bg-black/50 border-green-500/20 backdrop-blur-sm">
                        <CardContent className="p-4 h-full flex flex-col">
                            <h3 className="text-xs text-green-600 font-bold mb-2 flex items-center gap-2">
                                <Cpu className="w-3 h-3" /> SYSTEM_OUT
                            </h3>
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-hidden relative space-y-1 text-[10px] text-green-500/80 font-mono"
                            >
                                <div className="absolute inset-0 overflow-y-auto pr-2 custom-scrollbar">
                                    {logs.map((log, i) => (
                                        <div key={i} className="whitespace-nowrap">
                                            <span className="opacity-50 mr-2">{log.substring(0, 11)}</span>
                                            {log.substring(11)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lore/Hint Display */}
                    <Card className="bg-green-900/5 border-green-500/20 backdrop-blur-sm">
                        <CardContent className="p-4 h-full flex flex-col justify-center text-center relative overflow-hidden">
                            {/* Scanning Effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent h-full w-full animate-scan" />

                            <div className="relative z-10 space-y-3 animate-in fade-in zoom-in duration-500" key={currentLore?.topic}>
                                <div className="mx-auto w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                                    {entries.length > 0 ? <Database className="w-4 h-4 text-green-400" /> : <ShieldAlert className="w-4 h-4 text-green-400" />}
                                </div>
                                <h4 className="text-sm font-bold text-green-400 tracking-wider">
                                    DATA FRAGMENT: {currentLore?.topic}
                                </h4>
                                <p className="text-xs text-green-300/70 leading-relaxed max-w-[90%] mx-auto">
                                    "{currentLore?.desc}"
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Cancel Button */}
                <div className="text-center pt-8">
                    <p className="text-[10px] text-zinc-600 animate-pulse mb-2">DO NOT DISCONNECT POWER</p>
                </div>
            </div>
        </div>
    );
}
