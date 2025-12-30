'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAtlasStore } from '@/lib/atlas-store';
import { useGameStore } from '@/store/game';
import { useGeneratedWorldStore } from '@/lib/generated-world-store';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Globe, Radio, Terminal, Zap, ChevronLeft, ChevronRight, ScanLine, Binary, Wand2, Crosshair } from 'lucide-react';
import { AtlasDialog } from '@/components/game/AtlasDialog';
import { AuthWrapper } from '@/components/AuthWrapper';
import { cn } from '@/lib/utils';

export default function LandingPage() {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const { t, tArray } = useTranslation();
    const atlasEntries = useAtlasStore((state) => state.entries);
    const playerStats = useGameStore((state) => state.playerProfile.stats);
    const generatedWorlds = useGeneratedWorldStore((state) => state.worlds);

    const transmissions = tArray('home.transmissions');
    const [signal, setSignal] = useState('');

    // Combine static and generated worlds for random selection
    const allWorldIds = useMemo(() => {
        const staticIds = ['mistwood', 'cycoflora'];
        const generatedIds = generatedWorlds.map(w => w.id);
        return [...staticIds, ...generatedIds];
    }, [generatedWorlds]);

    const handleRandomWorld = () => {
        const randomId = allWorldIds[Math.floor(Math.random() * allWorldIds.length)];
        router.push(`/prepare?world=${randomId}`);
    };

    useEffect(() => {
        setMounted(true);
        if (transmissions.length > 0) {
            setSignal(transmissions[0]);
            const interval = setInterval(() => {
                setSignal(transmissions[Math.floor(Math.random() * transmissions.length)]);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [transmissions]);

    if (!mounted) return <div className="h-screen bg-black" />;

    const uniqueTopics = new Set(atlasEntries.map(e => e.topic)).size;
    const lastEntry = atlasEntries.length > 0 ? atlasEntries[atlasEntries.length - 1] : null;

    return (
        <main className="h-screen w-full bg-black text-green-500 font-mono flex flex-col overflow-hidden relative selection:bg-green-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,0,0.02)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
            <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 0%, black 100%) opacity-80 pointer-events-none" />

            {/* Top Bar */}
            <header className="w-full p-4 md:p-6 flex justify-between items-center z-20 border-b border-green-900/30 bg-black/90 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-green-500">
                    <Terminal className="w-5 h-5" />
                    <span className="font-bold tracking-[0.2em] text-sm">{t('home.systemTitle')}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="hidden md:flex items-center gap-3 border-r border-green-900/50 pr-4 mr-1">
                        <span className="text-zinc-500">{t('home.operativePower')}: <span className="text-green-400 font-bold ml-1">[{playerStats.power}]</span></span>
                    </div>
                    <span className="flex items-center gap-2 text-green-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {t('common.online')}
                    </span>
                    <AuthWrapper />
                    <span className="text-zinc-600">{t('common.version')}</span>
                </div>
            </header>

            {/* Center Content */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-20 p-4">
                <div className="mb-12 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-950/20 text-green-500 border border-green-500/20 text-[10px] tracking-widest uppercase mb-4 animate-pulse">
                        <Activity className="w-3 h-3" />
                        {t('home.neuralLink')}
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-green-400 via-green-600 to-green-900 glitch-text" data-text="INFINITE">
                        INFINITE<br />CROSSING
                    </h1>

                    <p className="text-zinc-400 max-w-lg mx-auto text-xs md:text-sm leading-relaxed border-t border-green-900/30 pt-6">
                        <span className="text-green-600 mr-2">::</span>
                        {t('home.tagline1')}
                        {t('home.tagline2')}
                        <br />
                        <span className="text-green-600 mr-2">::</span>
                        {t('home.tagline3')}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        size="lg"
                        onClick={handleRandomWorld}
                        className="h-16 px-12 text-lg bg-green-600 text-black hover:bg-green-500 hover:scale-105 transition-all duration-300 font-bold tracking-[0.15em] border-2 border-green-500 shadow-[0_0_30px_-5px_rgba(34,197,94,0.6)]"
                    >
                        <Crosshair className="w-5 h-5 mr-3 fill-current animate-[spin_3s_linear_infinite]" />
                        {t('home.initiateSequence')}
                    </Button>
                    <Link href="/generate">
                        <Button
                            size="lg"
                            className="h-16 px-12 text-lg bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-purple-600/20 text-fuchsia-400 border-2 border-fuchsia-500/60 hover:border-fuchsia-400 hover:bg-gradient-to-r hover:from-fuchsia-600 hover:via-purple-600 hover:to-fuchsia-600 hover:text-black hover:scale-105 transition-all duration-300 font-bold tracking-[0.15em] shadow-[0_0_25px_-5px_rgba(217,70,239,0.5)] hover:shadow-[0_0_40px_-5px_rgba(217,70,239,0.8)] group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
                            <ScanLine className="w-5 h-5 mr-3 group-hover:animate-ping" />
                            {t('home.locateWorld')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Bottom Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 z-20 max-w-7xl mx-auto w-full">
                {/* Atlas Widget (Clickable) */}
                <AtlasDialog
                    trigger={
                        <Card className="bg-black/60 border-green-900/30 backdrop-blur hover:border-green-500/50 hover:bg-green-950/10 transition-all cursor-pointer group h-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2 group-hover:text-green-400 transition-colors tracking-widest">
                                    <Database className="w-3 h-3" /> {t('home.atlasDatabase')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-end relative z-10">
                                    <div>
                                        <div className="text-3xl font-black text-green-500">{atlasEntries.length}</div>
                                        <div className="text-[10px] text-zinc-500 uppercase">{t('home.knownFragments')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-zinc-400 group-hover:text-green-400 transition-colors">{uniqueTopics}</div>
                                        <div className="text-[10px] text-zinc-500 uppercase">{t('home.uniqueTopics')}</div>
                                    </div>
                                </div>
                                {lastEntry && (
                                    <div className="mt-4 pt-3 border-t border-green-900/30 text-[10px] text-zinc-500 truncate font-mono flex items-center gap-2">
                                        <ScanLine className="w-3 h-3 text-green-600" />
                                        {t('home.lastEntry')}: <span className="text-green-400">{lastEntry.topic}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    }
                />

                {/* Signal Widget */}
                <Card className="bg-black/60 border-green-900/30 backdrop-blur hover:border-green-500/30 transition-colors group h-full">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2 group-hover:text-green-400 transition-colors tracking-widest">
                            <Radio className="w-3 h-3" /> {t('home.interceptedSignal')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[88px] flex flex-col justify-center">
                        <div className="font-mono text-xs text-green-500/80">
                            <span className="opacity-50 mr-2">&gt;</span>
                            {signal.split('').map((char, i) => (
                                <span key={i} className="animate-in fade-in duration-100" style={{ animationDelay: `${i * 30}ms` }}>
                                    {char}
                                </span>
                            ))}
                            <span className="inline-block w-2 h-4 bg-green-500 ml-1 animate-pulse align-middle" />
                        </div>
                    </CardContent>
                </Card>

                {/* Interactive World Selector */}
                <div className="col-span-1 md:col-span-1">
                    <WorldSelector />
                </div>
            </div>
        </main>
    );
}

function WorldSelector() {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const worldKeys = ['mistwood', 'cycoflora'] as const;
    const worlds = {
        mistwood: {
            id: 'mistwood',
            name: 'MISTWOOD',
            desc: 'Anomaly: Fog | Threat: High',
            color: 'text-green-500',
            border: 'hover:border-green-500/50',
            bg: 'group-hover:bg-green-950/10'
        },
        cycoflora: {
            id: 'cycoflora',
            name: 'CYCOFLORA',
            desc: 'Anomaly: Bio-Mech | Threat: Extreme',
            color: 'text-pink-500',
            border: 'hover:border-pink-500/50',
            bg: 'group-hover:bg-pink-950/10'
        }
    };

    const currentKey = worldKeys[selectedIndex];
    const current = worlds[currentKey];

    const cycle = (direction: -1 | 1) => {
        setSelectedIndex((prev) => {
            const next = prev + direction;
            if (next < 0) return worldKeys.length - 1;
            if (next >= worldKeys.length) return 0;
            return next;
        });
    };

    return (
        <Card
            className={`h-full bg-black/60 border-green-900/30 backdrop-blur transition-all duration-300 group ${current.border} ${current.bg} select-none cursor-pointer`}
            onWheel={(e) => {
                if (e.deltaY > 0) cycle(1);
                else cycle(-1);
            }}
        >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className={`text-[10px] font-bold uppercase flex items-center gap-2 transition-colors tracking-widest ${current.color} opacity-80 group-hover:opacity-100`}>
                    <Globe className="w-3 h-3" /> Target Selector
                </CardTitle>
                <div className="flex gap-1">
                    {worldKeys.map((key, idx) => (
                        <div
                            key={key}
                            className={`w-1.5 h-1.5 rounded-sm transition-all ${idx === selectedIndex ? (key === 'mistwood' ? 'bg-green-500' : 'bg-pink-500') : 'bg-zinc-800'}`}
                        />
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-600 hover:text-white hover:bg-white/5 rounded-none"
                        onClick={() => cycle(-1)}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex-1 space-y-1 text-center">
                        <h3 className={`text-xl font-black tracking-[0.2em] uppercase ${current.color}`}>
                            {current.name}
                        </h3>
                        <div className="flex justify-center">
                            <span className="text-[9px] font-mono text-zinc-600 border border-zinc-900 bg-black px-1.5 py-0.5">
                                ID: {current.id.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-600 hover:text-white hover:bg-white/5 rounded-none"
                        onClick={() => cycle(1)}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="w-full bg-zinc-900/50 h-px relative overflow-hidden">
                    <div className={`absolute inset-0 w-1/3 bg-current opacity-20 animate-loading-bar ${current.color}`} />
                </div>

                <div className="pt-1">
                    <Link href={`/prepare?world=${currentKey}`} className="block w-full">
                        <Button variant="outline" size="sm" className={`w-full font-mono text-[10px] border-zinc-800 bg-black hover:bg-zinc-900 ${current.color} border-opacity-50`}>
                            <Binary className="w-3 h-3 mr-2" />
                            INITIALIZE_{current.name}
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}