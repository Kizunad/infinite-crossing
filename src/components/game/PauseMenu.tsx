'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/game';
import { Power, Play, AlertTriangle } from 'lucide-react';

interface PauseMenuProps {
    isOpen: boolean;
    onResume: () => void;
}

export function PauseMenu({ isOpen, onResume }: PauseMenuProps) {
    const router = useRouter();
    const { reset } = useGameStore();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="max-w-md w-full bg-zinc-950 border border-green-900/50 p-6 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                {/* Decorative Grid Background */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />

                {/* Header */}
                <div className="relative z-10 text-center space-y-2 mb-8">
                    <h2 className="text-2xl font-black text-green-500 tracking-[0.2em] uppercase font-mono animate-pulse">
                        System Paused
                    </h2>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-green-900 to-transparent" />
                    <p className="text-green-500/50 font-mono text-xs">Uplink suspended. Awaiting input.</p>
                </div>

                {/* Actions */}
                <div className="relative z-10 space-y-3">
                    <Button
                        onClick={onResume}
                        className="w-full bg-green-950/30 hover:bg-green-500 hover:text-black border border-green-800 text-green-400 font-mono h-12 uppercase tracking-wider transition-all duration-300 group"
                    >
                        <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Resume Uplink
                    </Button>

                    <Button
                        onClick={() => {
                            reset();
                            router.push('/');
                        }}
                        className="w-full bg-red-950/10 hover:bg-red-900/50 border border-red-900/30 text-red-500 hover:text-red-400 font-mono h-12 uppercase tracking-wider transition-all duration-300 group"
                    >
                        <Power className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Terminate Session
                    </Button>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
                        <AlertTriangle className="w-3 h-3" />
                        <span>State is persisted locally</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
