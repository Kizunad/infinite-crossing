"use client";

import { useState } from "react";
import { useGameStore } from "@/store/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Terminal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { JudgeOption } from "@/types/game";

export function ActionPanel() {
    const { history, submitAction, isProcessing, isDead, isTyping } =
        useGameStore();
    const [input, setInput] = useState("");

    // Get last turn options or default
    const lastTurn = history[history.length - 1];
    const defaultOptions: Partial<JudgeOption>[] = [
        { id: "def1", text: "观察周围", risk_level: "low" },
        { id: "def2", text: "检查物品", risk_level: "low" },
    ];

    const options = lastTurn?.verdict.options || defaultOptions;

    const handleCustomAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing || isDead || isTyping) return;
        await submitAction(input);
        setInput("");
    };

    const isDisabled = isProcessing || isDead || isTyping;

    const getPlaceholder = () => {
        if (isProcessing) return "处理中...";
        if (isDead) return "连接已断开";
        if (isTyping) return "等待传输...";
        return "输入自定义行动...";
    };

    // Risk level badge colors
    const getRiskStyles = (riskLevel: string | undefined) => {
        switch (riskLevel) {
            case "critical":
                return "border-red-500/70 text-red-400 hover:bg-red-950/30 hover:border-red-500 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]";
            case "high":
                return "border-orange-500/50 text-orange-400 hover:border-orange-500 hover:bg-orange-950/20";
            case "medium":
                return "border-yellow-500/40 text-yellow-400 hover:border-yellow-500/70 hover:bg-yellow-950/20";
            default:
                return "border-green-500/30 text-green-400 hover:border-green-500/50 hover:bg-green-950/20";
        }
    };

    return (
        <div className="p-2 md:p-4 border-t border-zinc-800 bg-black/80 backdrop-blur z-20">
            {/* Quick Options - Scrollable on mobile */}
            <div className="flex gap-1.5 md:gap-2 mb-2 md:mb-4 overflow-x-auto pb-2 scrollbar-thin -mx-2 px-2">
                {options.map((opt: any, i: number) => (
                    <Button
                        key={opt.id || i}
                        variant="outline"
                        size="sm"
                        onClick={() => submitAction(opt.text)}
                        disabled={isDisabled}
                        className={cn(
                            "whitespace-nowrap transition-all duration-200 active:scale-95 group relative overflow-hidden shrink-0",
                            "text-[10px] md:text-xs h-7 md:h-9 px-2 md:px-3",
                            "hover:-translate-y-0.5",
                            getRiskStyles(opt.risk_level),
                        )}
                    >
                        <span className="relative z-10 flex items-center gap-1">
                            {/* Risk indicator dot */}
                            {opt.risk_level === "critical" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            )}
                            {opt.risk_level === "high" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            )}
                            {opt.text}
                            {/* Micro arrow on hover */}
                            <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:inline">
                                &gt;
                            </span>
                        </span>
                        {/* Subtle shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
                    </Button>
                ))}
            </div>

            {/* Input Area */}
            <form
                onSubmit={handleCustomAction}
                className="flex gap-1.5 md:gap-2"
            >
                <div className="relative flex-1">
                    <Terminal className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={getPlaceholder()}
                        className={cn(
                            "pl-7 md:pl-9 font-mono transition-all duration-300",
                            "text-xs md:text-sm h-8 md:h-10",
                            "focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50",
                            "focus:shadow-[0_0_15px_rgba(34,197,94,0.15)] bg-black/50",
                        )}
                        disabled={isDisabled}
                        autoFocus
                    />
                </div>
                <Button
                    type="submit"
                    size="sm"
                    disabled={isDisabled || !input.trim()}
                    className={cn(
                        "transition-all duration-300 active:scale-95",
                        "h-8 w-8 md:h-10 md:w-10 p-0",
                        "hover:shadow-[0_0_10px_rgba(34,197,94,0.4)] hover:bg-green-600",
                    )}
                >
                    {isProcessing ? (
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                    ) : (
                        <Send className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                </Button>
            </form>

            {/* Status indicator for mobile */}
            {isDisabled && (
                <div className="mt-2 md:hidden text-center">
                    <span className="text-[9px] text-muted-foreground font-mono flex items-center justify-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        {isProcessing
                            ? "处理中"
                            : isTyping
                              ? "传输中"
                              : "等待中"}
                    </span>
                </div>
            )}
        </div>
    );
}
