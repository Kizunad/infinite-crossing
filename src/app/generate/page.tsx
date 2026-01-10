"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game";
import { useGeneratedWorldStore } from "@/lib/generated-world-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Terminal,
    Loader2,
    Sparkles,
    ArrowLeft,
    Play,
    ScanLine,
    User,
    Globe,
    ChevronRight,
} from "lucide-react";
import type {
    GeneratedWorld,
    CharacterCreationInput,
} from "@/types/generated-world";
import type { Gender } from "@/types/game";

export default function GeneratePage() {
    const router = useRouter();
    const playerPower = useGameStore(
        (state) => state.playerProfile.stats.power,
    );
    const { addWorld } = useGeneratedWorldStore();

    const [mounted, setMounted] = useState(false);

    // World settings
    const [theme, setTheme] = useState("");
    const [averagePower, setAveragePower] = useState(8);
    const [mysteryLevel, setMysteryLevel] = useState(50);
    const [resourceScarcity, setResourceScarcity] = useState(50);

    // Character settings
    const [characterName, setCharacterName] = useState("");
    const [characterGender, setCharacterGender] = useState<Gender>("unknown");
    const [characterAge, setCharacterAge] = useState<string>("");
    const [characterAppearance, setCharacterAppearance] = useState("");
    const [characterPersonality, setCharacterPersonality] = useState("");
    const [characterOrigin, setCharacterOrigin] = useState("");
    const [characterOccupation, setCharacterOccupation] = useState("");
    const [characterMotivation, setCharacterMotivation] = useState("");
    const [characterFlaw, setCharacterFlaw] = useState("");
    const [characterTalents, setCharacterTalents] = useState("");
    const [characterSkills, setCharacterSkills] = useState("");
    const [characterNotes, setCharacterNotes] = useState("");

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedWorld, setGeneratedWorld] = useState<GeneratedWorld | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");

    const maxPower = Math.max(10, playerPower * 3);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isGenerating) {
            const statuses = [
                "扫描维度裂隙...",
                "分析时间线变异...",
                "构建物理矩阵...",
                "模拟社会结构...",
                "注入叙事核心...",
                "计算熵值...",
                "稳定现实锚点...",
                "载入角色档案...",
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

    const buildCharacterInput = (): CharacterCreationInput | undefined => {
        // Only include character data if at least name is provided
        if (!characterName.trim()) return undefined;

        return {
            name: characterName.trim(),
            gender: characterGender,
            age: characterAge ? parseInt(characterAge) : undefined,
            appearance: characterAppearance.trim() || undefined,
            personality: characterPersonality.trim() || undefined,
            background_origin: characterOrigin.trim() || undefined,
            background_occupation: characterOccupation.trim() || undefined,
            background_motivation: characterMotivation.trim() || undefined,
            background_flaw: characterFlaw.trim() || undefined,
            talents: characterTalents.trim() || undefined,
            skills: characterSkills.trim() || undefined,
            custom_notes: characterNotes.trim() || undefined,
        };
    };

    const handleGenerate = async () => {
        if (!theme.trim()) {
            setError("请输入世界主题描述");
            return;
        }

        setError(null);
        setIsGenerating(true);
        setProgress(0);
        setStatusText("初始化定位系统...");

        try {
            const characterInput = buildCharacterInput();

            const res = await fetch("/api/game/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    theme: theme.trim(),
                    average_power: averagePower,
                    mystery_level: mysteryLevel,
                    resource_scarcity: resourceScarcity,
                    character: characterInput,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error_message || "生成失败");
            }

            setProgress(100);
            setStatusText("世界生成完成！");
            setGeneratedWorld(data.world);
            addWorld(data.world);
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
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
        <main className="min-h-screen w-full bg-black text-green-500 font-mono flex flex-col overflow-x-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,0,0.02)_50%)] z-10 bg-[length:100%_2px]" />

            {/* Header */}
            <header className="w-full p-3 md:p-6 flex justify-between items-center z-20 border-b border-green-900/30 bg-black/90 backdrop-blur-sm">
                <div className="flex items-center gap-2 md:gap-3 text-green-500">
                    <Terminal className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="font-bold tracking-widest text-xs md:text-sm">
                        维度扫描器 // V2.0
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/")}
                    className="text-green-600 hover:text-green-400 hover:bg-green-900/10 font-mono tracking-wider text-xs"
                >
                    <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">取消扫描</span>
                </Button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-start justify-center p-3 md:p-6 z-20 overflow-y-auto">
                {!generatedWorld ? (
                    <Card className="w-full max-w-2xl bg-black/80 border-green-900/50 backdrop-blur relative overflow-hidden my-4">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
                        <CardHeader className="border-b border-green-900/30 p-4 md:p-6">
                            <CardTitle className="text-green-400 flex items-center gap-2 md:gap-3 text-base md:text-xl tracking-widest uppercase">
                                <ScanLine className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                                维度定位系统
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6">
                            <Tabs defaultValue="world" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6 h-9 md:h-10">
                                    <TabsTrigger
                                        value="world"
                                        className="text-xs md:text-sm"
                                    >
                                        <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                        世界设定
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="character"
                                        className="text-xs md:text-sm"
                                    >
                                        <User className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                        角色创建
                                    </TabsTrigger>
                                </TabsList>

                                {/* World Settings Tab */}
                                <TabsContent
                                    value="world"
                                    className="space-y-4 md:space-y-6"
                                >
                                    {/* Theme Input */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] md:text-xs text-green-500/70 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1 h-3 bg-green-500/50 block" />
                                            世界主题 *
                                        </label>
                                        <textarea
                                            value={theme}
                                            onChange={(e) =>
                                                setTheme(e.target.value)
                                            }
                                            placeholder="描述你想探索的世界 (如 '赛博朋克贫民窟', '时间循环庄园', '深渊之城')..."
                                            className="w-full h-20 md:h-24 bg-black/50 border border-green-900/50 rounded-none px-3 md:px-4 py-2 md:py-3 text-green-400 placeholder:text-green-900/50 focus:outline-none focus:border-green-500/80 resize-none font-mono text-xs md:text-sm transition-colors"
                                            disabled={isGenerating}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                                        {/* Danger Level Slider */}
                                        <div className="space-y-2 md:space-y-3">
                                            <label className="text-[10px] md:text-xs text-green-500/70 uppercase tracking-widest flex justify-between items-center">
                                                <span>威胁等级</span>
                                                <span className="text-green-400 font-bold bg-green-950/30 px-2 py-0.5 rounded text-[10px] md:text-xs border border-green-900">
                                                    LV.{averagePower}
                                                </span>
                                            </label>
                                            <input
                                                type="range"
                                                min={1}
                                                max={maxPower}
                                                value={averagePower}
                                                onChange={(e) =>
                                                    setAveragePower(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full accent-green-500 h-1 bg-green-900/30 rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:rounded-full"
                                                disabled={isGenerating}
                                            />
                                            <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                                                <span>安全</span>
                                                <span>致命</span>
                                            </div>
                                        </div>

                                        {/* Mystery Level Slider */}
                                        <div className="space-y-2 md:space-y-3">
                                            <label className="text-[10px] md:text-xs text-purple-500/70 uppercase tracking-widest flex justify-between items-center">
                                                <span>神秘程度</span>
                                                <span className="text-purple-400 font-bold bg-purple-950/30 px-2 py-0.5 rounded text-[10px] md:text-xs border border-purple-900">
                                                    {mysteryLevel}%
                                                </span>
                                            </label>
                                            <input
                                                type="range"
                                                min={1}
                                                max={100}
                                                value={mysteryLevel}
                                                onChange={(e) =>
                                                    setMysteryLevel(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full accent-purple-500 h-1 bg-purple-900/30 rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
                                                disabled={isGenerating}
                                            />
                                            <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                                                <span>理性</span>
                                                <span>诡异</span>
                                            </div>
                                        </div>

                                        {/* Resource Scarcity Slider */}
                                        <div className="space-y-2 md:space-y-3">
                                            <label className="text-[10px] md:text-xs text-orange-500/70 uppercase tracking-widest flex justify-between items-center">
                                                <span>资源稀缺度</span>
                                                <span className="text-orange-400 font-bold bg-orange-950/30 px-2 py-0.5 rounded text-[10px] md:text-xs border border-orange-900">
                                                    {resourceScarcity}%
                                                </span>
                                            </label>
                                            <input
                                                type="range"
                                                min={1}
                                                max={100}
                                                value={resourceScarcity}
                                                onChange={(e) =>
                                                    setResourceScarcity(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="w-full accent-orange-500 h-1 bg-orange-900/30 rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full"
                                                disabled={isGenerating}
                                            />
                                            <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                                                <span>富饶</span>
                                                <span>贫瘠</span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Character Creation Tab */}
                                <TabsContent
                                    value="character"
                                    className="space-y-4 md:space-y-5"
                                >
                                    <p className="text-[10px] md:text-xs text-zinc-500 border-b border-zinc-800 pb-2">
                                        //
                                        自定义你的角色，AI将根据这些信息调整叙事和互动
                                    </p>

                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-green-500/70 uppercase tracking-widest">
                                                角色名
                                            </label>
                                            <Input
                                                value={characterName}
                                                onChange={(e) =>
                                                    setCharacterName(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="输入名字..."
                                                className="bg-black/50 border-green-900/50 text-green-400 placeholder:text-green-900/50 text-xs md:text-sm h-9"
                                                disabled={isGenerating}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-green-500/70 uppercase tracking-widest">
                                                年龄
                                            </label>
                                            <Input
                                                type="number"
                                                value={characterAge}
                                                onChange={(e) =>
                                                    setCharacterAge(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="年龄..."
                                                className="bg-black/50 border-green-900/50 text-green-400 placeholder:text-green-900/50 text-xs md:text-sm h-9"
                                                disabled={isGenerating}
                                            />
                                        </div>
                                    </div>

                                    {/* Gender Selection */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-green-500/70 uppercase tracking-widest">
                                            性别
                                        </label>
                                        <div className="flex gap-2">
                                            {[
                                                { value: "male", label: "男" },
                                                {
                                                    value: "female",
                                                    label: "女",
                                                },
                                                {
                                                    value: "other",
                                                    label: "其他",
                                                },
                                                {
                                                    value: "unknown",
                                                    label: "不明",
                                                },
                                            ].map((option) => (
                                                <Button
                                                    key={option.value}
                                                    variant={
                                                        characterGender ===
                                                        option.value
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setCharacterGender(
                                                            option.value as Gender,
                                                        )
                                                    }
                                                    className={`text-xs h-8 px-3 ${
                                                        characterGender ===
                                                        option.value
                                                            ? "bg-green-600 text-black"
                                                            : "border-green-900/50 text-green-500 hover:bg-green-950/30"
                                                    }`}
                                                    disabled={isGenerating}
                                                >
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Appearance & Personality */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-green-500/70 uppercase tracking-widest">
                                                外貌特征
                                            </label>
                                            <textarea
                                                value={characterAppearance}
                                                onChange={(e) =>
                                                    setCharacterAppearance(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="描述外貌特点..."
                                                className="w-full h-16 bg-black/50 border border-green-900/50 rounded-none px-3 py-2 text-green-400 placeholder:text-green-900/50 focus:outline-none focus:border-green-500/80 resize-none font-mono text-xs"
                                                disabled={isGenerating}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-green-500/70 uppercase tracking-widest">
                                                性格特点
                                            </label>
                                            <textarea
                                                value={characterPersonality}
                                                onChange={(e) =>
                                                    setCharacterPersonality(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="描述性格特点..."
                                                className="w-full h-16 bg-black/50 border border-green-900/50 rounded-none px-3 py-2 text-green-400 placeholder:text-green-900/50 focus:outline-none focus:border-green-500/80 resize-none font-mono text-xs"
                                                disabled={isGenerating}
                                            />
                                        </div>
                                    </div>

                                    {/* Background Section */}
                                    <div className="border-t border-zinc-800 pt-3 space-y-3">
                                        <p className="text-[10px] text-amber-500/70 uppercase tracking-widest flex items-center gap-1">
                                            <ChevronRight className="w-3 h-3" />
                                            背景故事
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-zinc-500">
                                                    出身背景
                                                </label>
                                                <Input
                                                    value={characterOrigin}
                                                    onChange={(e) =>
                                                        setCharacterOrigin(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="如: 贵族后裔、流浪者..."
                                                    className="bg-black/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 text-xs h-8"
                                                    disabled={isGenerating}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-zinc-500">
                                                    职业身份
                                                </label>
                                                <Input
                                                    value={characterOccupation}
                                                    onChange={(e) =>
                                                        setCharacterOccupation(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="如: 赏金猎人、学者..."
                                                    className="bg-black/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 text-xs h-8"
                                                    disabled={isGenerating}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-zinc-500">
                                                    动机目标
                                                </label>
                                                <Input
                                                    value={characterMotivation}
                                                    onChange={(e) =>
                                                        setCharacterMotivation(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="如: 寻找失踪的妹妹..."
                                                    className="bg-black/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 text-xs h-8"
                                                    disabled={isGenerating}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-zinc-500">
                                                    弱点缺陷
                                                </label>
                                                <Input
                                                    value={characterFlaw}
                                                    onChange={(e) =>
                                                        setCharacterFlaw(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="如: 恐高、易怒..."
                                                    className="bg-black/50 border-zinc-800 text-zinc-300 placeholder:text-zinc-700 text-xs h-8"
                                                    disabled={isGenerating}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Talents & Skills */}
                                    <div className="border-t border-zinc-800 pt-3 space-y-3">
                                        <p className="text-[10px] text-purple-500/70 uppercase tracking-widest flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            天赋与技能
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-zinc-500">
                                                    天赋资质
                                                </label>
                                                <textarea
                                                    value={characterTalents}
                                                    onChange={(e) =>
                                                        setCharacterTalents(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="如: 过目不忘、第六感、天生神力..."
                                                    className="w-full h-16 bg-black/50 border border-purple-900/30 rounded-none px-3 py-2 text-purple-400 placeholder:text-purple-900/50 focus:outline-none focus:border-purple-500/80 resize-none font-mono text-xs"
                                                    disabled={isGenerating}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-zinc-500">
                                                    习得技能
                                                </label>
                                                <textarea
                                                    value={characterSkills}
                                                    onChange={(e) =>
                                                        setCharacterSkills(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="如: 剑术精通、黑客技术、急救..."
                                                    className="w-full h-16 bg-black/50 border border-blue-900/30 rounded-none px-3 py-2 text-blue-400 placeholder:text-blue-900/50 focus:outline-none focus:border-blue-500/80 resize-none font-mono text-xs"
                                                    disabled={isGenerating}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Notes */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest">
                                            其他备注
                                        </label>
                                        <textarea
                                            value={characterNotes}
                                            onChange={(e) =>
                                                setCharacterNotes(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="任何其他想让AI知道的角色信息..."
                                            className="w-full h-14 bg-black/50 border border-zinc-800 rounded-none px-3 py-2 text-zinc-400 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 resize-none font-mono text-xs"
                                            disabled={isGenerating}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {/* Error Display */}
                            {error && (
                                <div className="text-red-400 text-xs md:text-sm bg-red-950/30 border border-red-500/30 px-3 py-2 rounded mt-4">
                                    {error}
                                </div>
                            )}

                            {/* Progress Bar */}
                            {isGenerating && (
                                <div className="space-y-2 mt-4">
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
                                className="w-full h-12 md:h-14 bg-green-600 text-black hover:bg-green-500 font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4 md:mt-6 text-sm md:text-base"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-2 animate-spin" />
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                        开始扫描
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    /* Generated World Preview */
                    <Card className="w-full max-w-xl bg-black/80 border-green-500/50 backdrop-blur shadow-[0_0_30px_-10px_rgba(34,197,94,0.5)] my-4">
                        <CardHeader className="border-b border-green-900/30 p-4 md:p-6">
                            <CardTitle className="text-green-400 flex items-center gap-2 md:gap-3 text-base md:text-xl">
                                <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                                世界生成完成
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                            <div className="text-center space-y-3 md:space-y-4">
                                <h2 className="text-2xl md:text-3xl font-black text-green-400 tracking-wider">
                                    {generatedWorld.name}
                                </h2>
                                <p className="text-zinc-400 italic text-sm md:text-base">
                                    "{generatedWorld.tagline}"
                                </p>
                                <div className="flex justify-center gap-4 text-[10px] md:text-xs text-zinc-500">
                                    <span>
                                        难度:{" "}
                                        <span className="text-green-400">
                                            {generatedWorld.average_power}
                                        </span>
                                    </span>
                                    <span>|</span>
                                    <span>
                                        战利品:{" "}
                                        <span className="text-green-400">
                                            {generatedWorld.loot_pool.length}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => {
                                        setGeneratedWorld(null);
                                        setTheme("");
                                        setProgress(0);
                                    }}
                                    className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-900 hover:text-white font-mono tracking-wider text-xs md:text-sm h-10 md:h-12"
                                >
                                    扫描下一个目标
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={handlePlay}
                                    className="flex-1 bg-green-600 text-black hover:bg-green-500 font-bold text-xs md:text-sm h-10 md:h-12"
                                >
                                    <Play className="w-4 h-4 mr-2 fill-current" />
                                    开始探索
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
