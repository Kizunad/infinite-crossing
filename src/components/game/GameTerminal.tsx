"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/game";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function GameTerminal({ worldId }: { worldId: string }) {
    const { history, isProcessing, setTyping } = useGameStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll whenever history changes or processing starts
    useEffect(() => {
        const timeout = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timeout);
    }, [history, isProcessing]);

    return (
        <ScrollArea className="flex-1 p-2 md:p-4 font-mono text-xs md:text-sm min-h-0">
            <div className="flex flex-col gap-4 md:gap-6 pb-4">
                {/* Intro */}
                <div className="text-muted-foreground italic select-none text-[10px] md:text-xs">
                    {">"} 系统初始化完成
                    <br />
                    {">"} 已与特工142建立连接
                    <br />
                    {">"} 开始传输...
                </div>

                {/* History */}
                {history.map((turn, index) => (
                    <HistoryItem
                        key={index}
                        turn={turn}
                        isLast={index === history.length - 1}
                        onTypewriterComplete={
                            index === history.length - 1
                                ? () => setTyping(false)
                                : undefined
                        }
                    />
                ))}

                {isProcessing && <ProcessingLogs />}

                <div ref={bottomRef} className="h-4" />
            </div>
        </ScrollArea>
    );
}

import { SensoryHUD } from "./SensoryHUD";
import type { GameHistoryItem } from "@/types/game";

function HistoryItem({
    turn,
    isLast,
    onTypewriterComplete,
}: {
    turn: GameHistoryItem;
    isLast: boolean;
    onTypewriterComplete?: () => void;
}) {
    const [sensoryDone, setSensoryDone] = useState(!isLast);
    const [expanded, setExpanded] = useState(isLast);

    useEffect(() => {
        setExpanded(isLast);
    }, [isLast]);

    // Split content
    const fullText = turn.verdict.narrative.content;
    const sensoryMatch = fullText.match(
        /(^> \*\*\[环境感知\]\*\*[\s\S]*?)(\n\n|$)/,
    );

    const sensoryText = sensoryMatch ? sensoryMatch[1] : null;
    const narrativeText = sensoryMatch
        ? fullText.substring(sensoryMatch[0].length).trim()
        : fullText;

    return (
        <div
            className="space-y-2 transition-all duration-300 group"
            onMouseEnter={() => !isLast && setExpanded(true)}
            onMouseLeave={() => !isLast && setExpanded(false)}
            onClick={() => !isLast && setExpanded(!expanded)}
        >
            {/* Player Action */}
            <div className="flex justify-end">
                <div
                    className={cn(
                        "bg-primary/10 text-primary px-2 md:px-3 py-1.5 md:py-2 rounded-lg max-w-[85%] md:max-w-[80%] border border-primary/20 text-right transition-all text-xs md:text-sm",
                        !expanded && "opacity-50 scale-95 origin-right",
                    )}
                >
                    {">"} {turn.action}
                </div>
            </div>

            {/* Response Area */}
            <div
                className={cn(
                    "rounded-lg border border-border/50 shadow-sm transition-all duration-500 ease-in-out relative overflow-hidden",
                    turn.verdict.narrative.tone === "suspenseful"
                        ? "bg-purple-950/10 border-purple-900/20"
                        : "bg-muted/30",
                    expanded
                        ? "max-h-[2000px] opacity-100 p-2 md:p-4"
                        : "max-h-0 opacity-0 p-0 border-none my-0",
                )}
            >
                {/* Visual Glitch/Decorations */}
                <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                    <div className="w-2 h-2 border-t border-r border-primary" />
                </div>

                {sensoryText && (
                    <SensoryHUD
                        rawText={sensoryText}
                        animate={isLast}
                        onComplete={() => setSensoryDone(true)}
                    />
                )}

                {/* Only show narrative when sensory is done (or if there is no sensory) */}
                {(sensoryDone || !sensoryText) && (
                    <div className="animate-in fade-in duration-500">
                        <Typewriter
                            text={narrativeText}
                            speed={isLast ? 20 : 0}
                            onComplete={onTypewriterComplete}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function Typewriter({
    text,
    speed = 30,
    onComplete,
}: {
    text: string;
    speed?: number;
    onComplete?: () => void;
}) {
    const [displayed, setDisplayed] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        // Immediate completion for 0 speed
        if (speed === 0) {
            setDisplayed(text);
            setIsComplete(true);
            if (onComplete) setTimeout(onComplete, 0); // Defer update
            return;
        }

        // Reset state for new text
        setDisplayed("");
        setIsComplete(false);

        const timer = setInterval(() => {
            setDisplayed((prev) => {
                if (prev.length >= text.length) {
                    clearInterval(timer);
                    setIsComplete(true);
                    if (onComplete) setTimeout(onComplete, 0); // Defer update
                    return text;
                }
                return text.substring(0, prev.length + 1);
            });
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    const skip = () => {
        setDisplayed(text);
        setIsComplete(true);
        if (onComplete) setTimeout(onComplete, 0); // Defer update
    };

    return (
        <div
            onClick={skip}
            className={cn(
                "prose prose-invert prose-xs md:prose-sm max-w-none",
                !isComplete && "cursor-pointer",
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => (
                        <p className="mb-1.5 md:mb-2 last:mb-0 inline text-xs md:text-sm">
                            {children}
                        </p>
                    ),
                    strong: ({ children }) => (
                        <strong className="text-primary font-bold">
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => (
                        <em className="text-muted-foreground italic">
                            {children}
                        </em>
                    ),
                    code: ({ children }) => (
                        <code className="bg-primary/20 text-primary px-1 rounded text-[10px] md:text-xs">
                            {children}
                        </code>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc ml-3 md:ml-4 mb-2">
                            {children}
                        </ul>
                    ),
                    li: ({ children }) => (
                        <li className="mb-0.5 md:mb-1 text-xs md:text-sm">
                            {children}
                        </li>
                    ),
                }}
            >
                {displayed}
            </ReactMarkdown>
            {!isComplete && (
                <span className="inline-block w-1.5 md:w-2 h-3 md:h-4 bg-primary align-middle ml-1 animate-pulse" />
            )}
        </div>
    );
}

function ProcessingLogs() {
    const MESSAGES = [
        "分析玩家意图...",
        "查询世界状态...",
        "计算概率矩阵...",
        "模拟NPC反应...",
        "检索本地知识...",
        "投掷命运骰(1d100)...",
        "更新世界标记...",
        "生成叙事响应...",
        "优化因果链...",
    ];

    const [msg, setMsg] = useState(MESSAGES[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMsg(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex justify-start animate-fade-in">
            <div className="bg-muted/30 p-2 md:p-3 rounded-lg flex gap-2 items-center text-[10px] md:text-xs font-mono text-muted-foreground/80 border border-muted">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary/50 rounded-full animate-pulse" />
                <span className="animate-pulse">{msg}</span>
            </div>
        </div>
    );
}
