'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/game';
import { useGeneratedWorldStore } from '@/lib/generated-world-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Terminal, Loader2, Sparkles, Wand2, ArrowLeft, Play, ScanLine } from 'lucide-react';
import type { GeneratedWorld } from '@/types/generated-world';

export default function GeneratePage() {
    const router = useRouter();
    const playerPower = useGameStore((state) => state.playerProfile.stats.power);
    const { addWorld } = useGeneratedWorldStore();

    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState('');
    const [averagePower, setAveragePower] = useState(8);
    const [mysteryLevel, setMysteryLevel] = useState(50);
    const [resourceScarcity, setResourceScarcity] = useState(50);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedWorld, setGeneratedWorld] = useState<GeneratedWorld | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Progress simulation for loading state
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');

    const maxPower = Math.max(10, playerPower * 3);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isGenerating) {
            const statuses = [
                'Scanning dimensional rift...',
                'Analysing timeline variance...',
                'Constructing physics matrix...',
                'Simulating social structures...',
                'Injecting narrative core...',
                'Calculating entropy...',
                'Stabilizing reality anchors...',
            ];
            let idx = 0;
            const interval = setInterval(() => {
                setProgress((prev) => Math.min(prev + Math.random() * 15, 95));
                setStatusText(statuses[idx % statuses.length]);
                idx++;
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isGenerating]);

    const handleGenerate = async () => {
        if (!theme.trim()) {
            setError('Target parameters required.');
            return;
        }

        setError(null);
        setIsGenerating(true);
        setProgress(0);
        setStatusText('Initializing Locator System...');

        try {
            const res = await fetch('/api/game/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    theme: theme.trim(),
                    average_power: averagePower,
                    mystery_level: mysteryLevel,
                    resource_scarcity: resourceScarcity,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error_message || 'Generation failed');
            }

            setProgress(100);
            setStatusText('世界生成完成！');
            setGeneratedWorld(data.world);
            addWorld(data.world);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlay = () => {
        if (generatedWorld) {
            router.push(`/prepare?world=${generatedWorld.id}`);
        }
    };

    if (!mounted) return <div className="h-screen bg-black" />;

    return (
        <main className="h-screen w-full bg-black text-green-500 font-mono flex flex-col overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,0,0.02)_50%)] z-10 bg-[length:100%_2px]" />

            {/* Header */}
            <header className="w-full p-4 md:p-6 flex justify-between items-center z-20 border-b border-green-900/30 bg-black/90 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-green-500">
                    <Terminal className="w-5 h-5" />
                    <span className="font-bold tracking-[0.2em] text-sm">DIMENSION_SCANNER // V2.0</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/')}
                    className="text-green-600 hover:text-green-400 hover:bg-green-900/10 font-mono tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    ABORT_SCAN
                </Button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6 z-20">
                {!generatedWorld ? (
                    <Card className="w-full max-w-xl bg-black/80 border-green-900/50 backdrop-blur relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
                        <CardHeader className="border-b border-green-900/30">
                            <CardTitle className="text-green-400 flex items-center gap-3 text-xl tracking-widest uppercase">
                                <ScanLine className="w-6 h-6 animate-pulse" />
                                Target Locator System
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* Theme Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] text-green-500/70 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1 h-3 bg-green-500/50 block" />
                                    Scan Parameters / Target Signatures
                                </label>
                                <textarea
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    placeholder="Input world characteristics (e.g., 'Cyberpunk Slums', 'Time-Loop Manor', 'Abyssal City')..."
                                    className="w-full h-24 bg-black/50 border border-green-900/50 rounded-none px-4 py-3 text-green-400 placeholder:text-green-900/50 focus:outline-none focus:border-green-500/80 resize-none font-mono text-sm transition-colors"
                                    disabled={isGenerating}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {/* Danger Level Slider */}
                                <div className="space-y-3">
                                    <label className="text-[10px] text-green-500/70 uppercase tracking-widest flex justify-between items-center group">
                                        <span>Threat Level</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-20 h-px bg-green-900/50 group-hover:bg-green-500/30 transition-colors" />
                                            <span className="text-green-400 font-bold bg-green-950/30 px-2 py-0.5 rounded text-xs border border-green-900">
                                                LEVEL {averagePower}
                                            </span>
                                        </div>
                                    </label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={maxPower}
                                        value={averagePower}
                                        onChange={(e) => setAveragePower(Number(e.target.value))}
                                        className="w-full accent-green-500 h-1 bg-green-900/30 rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:hover:bg-green-400 [&::-webkit-slider-thumb]:hover:shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-all"
                                        disabled={isGenerating}
                                    />
                                    <div className="flex justify-between text-[9px] text-zinc-600 font-mono tracking-wider">
                                        <span>SAFE_ZONE</span>
                                        <span>DEATH_TRAP</span>
                                    </div>
                                </div>

                                {/* Mystery Level Slider */}
                                <div className="space-y-3">
                                    <label className="text-[10px] text-purple-500/70 uppercase tracking-widest flex justify-between items-center group">
                                        <span>Entropy / Mystery</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-20 h-px bg-purple-900/50 group-hover:bg-purple-500/30 transition-colors" />
                                            <span className="text-purple-400 font-bold bg-purple-950/30 px-2 py-0.5 rounded text-xs border border-purple-900">
                                                {mysteryLevel}%
                                            </span>
                                        </div>
                                    </label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={100}
                                        value={mysteryLevel}
                                        onChange={(e) => setMysteryLevel(Number(e.target.value))}
                                        className="w-full accent-purple-500 h-1 bg-purple-900/30 rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:hover:bg-purple-400 [&::-webkit-slider-thumb]:hover:shadow-[0_0_10px_rgba(168,85,247,0.8)] transition-all"
                                        disabled={isGenerating}
                                    />
                                    <div className="flex justify-between text-[9px] text-zinc-600 font-mono tracking-wider">
                                        <span>LOGICAL</span>
                                        <span>ANOMALOUS</span>
                                    </div>
                                </div>

                                {/* Resource Scarcity Slider */}
                                <div className="space-y-3">
                                    <label className="text-[10px] text-orange-500/70 uppercase tracking-widest flex justify-between items-center group">
                                        <span>Resource Scarcity</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-20 h-px bg-orange-900/50 group-hover:bg-orange-500/30 transition-colors" />
                                            <span className="text-orange-400 font-bold bg-orange-950/30 px-2 py-0.5 rounded text-xs border border-orange-900">
                                                {resourceScarcity}%
                                            </span>
                                        </div>
                                    </label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={100}
                                        value={resourceScarcity}
                                        onChange={(e) => setResourceScarcity(Number(e.target.value))}
                                        className="w-full accent-orange-500 h-1 bg-orange-900/30 rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:hover:bg-orange-400 [&::-webkit-slider-thumb]:hover:shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-all"
                                        disabled={isGenerating}
                                    />
                                    <div className="flex justify-between text-[9px] text-zinc-600 font-mono tracking-wider">
                                        <span>ABUNDANT</span>
                                        <span>BARREN</span>
                                    </div>
                                </div>
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="text-red-400 text-sm bg-red-950/30 border border-red-500/30 px-3 py-2 rounded">
                                    {error}
                                </div>
                            )}

                            {/* Progress Bar (during generation) */}
                            {isGenerating && (
                                <div className="space-y-2">
                                    <div className="h-2 bg-green-950/50 rounded overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-green-400/80 animate-pulse">
                                        {statusText}
                                    </p>
                                </div>
                            )}

                            {/* Generate Button */}
                            <Button
                                size="lg"
                                onClick={handleGenerate}
                                disabled={isGenerating || !theme.trim()}
                                className="w-full h-14 bg-green-600 text-black hover:bg-green-500 font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        START SCAN SEQUENCE
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    /* Generated World Preview */
                    <Card className="w-full max-w-xl bg-black/80 border-green-500/50 backdrop-blur shadow-[0_0_30px_-10px_rgba(34,197,94,0.5)]">
                        <CardHeader className="border-b border-green-900/30">
                            <CardTitle className="text-green-400 flex items-center gap-3 text-xl">
                                <Sparkles className="w-6 h-6" />
                                世界生成完成
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl font-black text-green-400 tracking-wider">
                                    {generatedWorld.name}
                                </h2>
                                <p className="text-zinc-400 italic">
                                    "{generatedWorld.tagline}"
                                </p>
                                <div className="flex justify-center gap-4 text-xs text-zinc-500">
                                    <span>难度: <span className="text-green-400">{generatedWorld.average_power}</span></span>
                                    <span>|</span>
                                    <span>战利品: <span className="text-green-400">{generatedWorld.loot_pool.length}</span></span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => {
                                        setGeneratedWorld(null);
                                        setTheme('');
                                        setProgress(0);
                                    }}
                                    className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-900 hover:text-white font-mono tracking-wider"
                                >
                                    SCAN_NEXT_TARGET
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={handlePlay}
                                    className="flex-1 bg-green-600 text-black hover:bg-green-500 font-bold"
                                >
                                    <Play className="w-4 h-4 mr-2 fill-current" />
                                    INITIATE LINK
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
