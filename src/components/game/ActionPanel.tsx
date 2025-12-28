'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JudgeOption } from '@/types/game';

export function ActionPanel() {
    const { history, submitAction, isProcessing, isDead, isTyping } = useGameStore();
    const [input, setInput] = useState('');

    // Get last turn options or default
    const lastTurn = history[history.length - 1];
    const defaultOptions: Partial<JudgeOption>[] = [
        { id: 'def1', text: "Look around", risk_level: 'low' },
        { id: 'def2', text: "Check inventory", risk_level: 'low' }
    ];

    const options = lastTurn?.verdict.options || defaultOptions;

    const handleCustomAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing || isDead || isTyping) return;
        await submitAction(input);
        setInput('');
    };

    const isDisabled = isProcessing || isDead || isTyping;

    return (
        <div className="p-4 border-t border-zinc-800 bg-black/80 backdrop-blur z-20">
            {/* Quick Options */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
                {options.map((opt: any, i: number) => (
                    <Button
                        key={opt.id || i}
                        variant="outline"
                        onClick={() => submitAction(opt.text)}
                        disabled={isDisabled}
                        className={cn(
                            "whitespace-nowrap transition-all duration-200 active:scale-95 group relative overflow-hidden",
                            "hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:border-green-500/50 hover:text-green-400",
                            "hover:-translate-y-0.5",
                            opt.risk_level === 'critical' && "border-red-500 text-red-500 hover:bg-red-950/20 animate-pulse hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]",
                            opt.risk_level === 'high' && "border-orange-500/50 hover:border-orange-500 text-orange-400"
                        )}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {opt.text}
                            {/* Micro arrow on hover */}
                            <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                &gt;
                            </span>
                        </span>
                        {/* Subtle scanline overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
                    </Button>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleCustomAction} className="flex gap-2">
                <div className="relative flex-1">
                    <Terminal className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isProcessing ? "系统推演中..." : (isDead ? "连接已断开..." : (isTyping ? "等待传输完毕..." : "输入你的行动..."))}
                        className="pl-9 font-mono transition-all duration-300 focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 focus:shadow-[0_0_15px_rgba(34,197,94,0.15)] bg-black/50"
                        disabled={isDisabled}
                        autoFocus
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isDisabled || !input.trim()}
                    className="transition-all duration-300 hover:shadow-[0_0_10px_rgba(34,197,94,0.4)] hover:bg-green-600 active:scale-95"
                >
                    {isProcessing ? (
                        <span className="animate-spin">⟳</span>
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </Button>
            </form>
        </div>
    );
}