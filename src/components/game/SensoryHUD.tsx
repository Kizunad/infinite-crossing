'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Eye, Ear, Wind, Activity, Brain } from 'lucide-react'; // Using icons for senses
import { cn } from '@/lib/utils';

interface SensoryHUDProps {
    rawText: string;
    onComplete?: () => void;
    animate?: boolean;
}

interface SenseData {
    icon: React.ReactNode;
    label: string;
    content: string;
    color: string;
}

export function SensoryHUD({ rawText, onComplete, animate = false }: SensoryHUDProps) {
    const [visibleItems, setVisibleItems] = useState<number>(animate ? 0 : 5);

    // Parse the raw markdown block into structured data
    const parseSenses = (text: string): SenseData[] => {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const data: SenseData[] = [];

        lines.forEach(line => {
            // Remove markdown blockquote '>' char
            const content = line.replace(/^>\s*/, '').trim();

            if (content.includes('视觉')) {
                data.push({
                    icon: <Eye className="w-4 h-4" />,
                    label: 'VISUAL',
                    content: content.replace(/.*：/, '').trim(),
                    color: "text-blue-400"
                });
            } else if (content.includes('听觉')) {
                data.push({
                    icon: <Ear className="w-4 h-4" />,
                    label: 'AUDIO',
                    content: content.replace(/.*：/, '').trim(),
                    color: "text-amber-400"
                });
            } else if (content.includes('嗅觉') || content.includes('触觉')) {
                data.push({
                    icon: <Wind className="w-4 h-4" />,
                    label: 'OLFACTORY',
                    content: content.replace(/.*：/, '').trim(),
                    color: "text-green-400"
                });
            } else if (content.includes('直觉') || content.includes('第六感')) {
                data.push({
                    icon: <Brain className="w-4 h-4" />,
                    label: 'INTUITION',
                    content: content.replace(/.*：/, '').trim(),
                    color: "text-purple-400"
                });
            }
        });
        return data;
    };

    const senses = parseSenses(rawText);

    useEffect(() => {
        if (!animate) {
            if (onComplete) onComplete();
            return;
        }

        if (visibleItems < senses.length) {
            const timer = setTimeout(() => {
                setVisibleItems(prev => prev + 1);
            }, 600); // 600ms delay between each item for "scanning" effect
            return () => clearTimeout(timer);
        } else {
            if (onComplete) {
                // Small delay after last item before starting narrative
                const timer = setTimeout(onComplete, 800);
                return () => clearTimeout(timer);
            }
        }
    }, [visibleItems, animate, senses.length, onComplete]);

    if (senses.length === 0) return null;

    return (
        <Card className="bg-black/40 border-l-4 border-l-green-500/50 border-y-0 border-r-0 rounded-none p-4 mb-6 backdrop-blur-sm overflow-hidden relative group">
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,0,0.02)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none bg-[length:100%_4px,6px_100%] animate-scanline opacity-20" />

            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-xs font-bold text-green-500/80 tracking-[0.2em] uppercase">
                    Env_Scan_Log
                </span>
            </div>

            <div className="space-y-3">
                {senses.map((sense, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex items-start gap-4 transition-all duration-500",
                            idx < visibleItems
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 -translate-x-4 absolute" // hidden items don't take layout space if absolute, but simpler to just hide opacity if we want layout stability. Let's strictly control rendering.
                        )}
                        style={{ display: idx < visibleItems ? 'flex' : 'none' }}
                    >
                        <div className={cn("mt-0.5 p-1.5 rounded bg-white/5", sense.color)}>
                            {sense.icon}
                        </div>
                        <div className="flex-1 space-y-0.5">
                            <div className={cn("text-[10px] font-bold tracking-widest opacity-70", sense.color)}>
                                {sense.label}
                            </div>
                            <div className="text-sm text-zinc-300 font-mono leading-relaxed">
                                {sense.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
