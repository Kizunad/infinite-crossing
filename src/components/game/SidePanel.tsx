"use client";

import { useState } from "react";
import { useGameStore } from "@/store/game";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Clock,
    CloudFog,
    ShieldAlert,
    Backpack,
    Package,
    Zap,
    Loader2,
    User,
    Users,
    Map,
    Heart,
    Swords,
    Brain,
    Sparkles,
    X,
    Menu,
    ChevronRight,
    MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { AtlasDialog } from "./AtlasDialog";
import { SaveLoadDialog } from "./SaveLoadDialog";
import { EnvStateCard } from "./EnvStateCard";

export function SidePanel() {
    const {
        playerProfile,
        currentWorldState,
        currentQuestState,
        history,
        setInputText,
        fastSimEnabled,
        toggleFastSim,
        isPrefetching,
    } = useGameStore();
    const { t } = useTranslation();
    const stats = playerProfile.stats;
    const inventory = playerProfile.inventory || [];
    const customization = playerProfile.customization;
    const social = playerProfile.social;
    const traits = playerProfile.traits || [];

    // Mobile panel state
    const [isOpen, setIsOpen] = useState(false);

    // Safe defaults for stats
    const hp = stats.hp ?? 100;
    const maxHp = stats.max_hp ?? 100;
    const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 0;
    const power = stats.power ?? 10;
    const agility = stats.agility ?? 10;
    const intellect = stats.intellect ?? 10;
    const charisma = stats.charisma ?? 10;
    const luck = stats.luck ?? 10;

    const lastVerdict =
        history.length > 0 ? history[history.length - 1].verdict : null;
    const lastDiceRoll = lastVerdict?.dice_roll;

    const handleItemClick = (itemName: string) => {
        setInputText(`使用 ${itemName}`);
        setIsOpen(false); // Close on mobile after selection
    };

    // Panel content
    const PanelContent = () => (
        <div className="flex flex-col h-full">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 flex flex-col gap-3">
                {/* Dice Roll Display */}
                {lastDiceRoll !== undefined && (
                    <Card className="bg-primary/5 border-primary/20 shrink-0">
                        <CardContent className="p-2 md:p-3 flex items-center justify-between">
                            <span className="text-xs md:text-sm font-medium text-primary font-mono">
                                &gt; 命运骰
                            </span>
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        "text-lg md:text-xl font-bold font-mono",
                                        lastDiceRoll > 80
                                            ? "text-green-500"
                                            : lastDiceRoll < 20
                                              ? "text-red-500"
                                              : "text-foreground",
                                    )}
                                >
                                    {lastDiceRoll}
                                </span>
                                <span className="text-[10px] md:text-xs text-muted-foreground">
                                    / 100
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Environment Card */}
                <EnvStateCard />

                {/* Tabbed Content */}
                <Tabs defaultValue="status" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-8 md:h-9">
                        <TabsTrigger
                            value="status"
                            className="text-[10px] md:text-xs px-1"
                        >
                            <User className="w-3 h-3 md:mr-1" />
                            <span className="hidden md:inline">状态</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="inventory"
                            className="text-[10px] md:text-xs px-1"
                        >
                            <Backpack className="w-3 h-3 md:mr-1" />
                            <span className="hidden md:inline">物品</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="social"
                            className="text-[10px] md:text-xs px-1"
                        >
                            <Users className="w-3 h-3 md:mr-1" />
                            <span className="hidden md:inline">社交</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="map"
                            className="text-[10px] md:text-xs px-1"
                        >
                            <Map className="w-3 h-3 md:mr-1" />
                            <span className="hidden md:inline">地图</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Status Tab */}
                    <TabsContent value="status" className="mt-3 space-y-3">
                        {/* Character Info */}
                        <Card className="shrink-0">
                            <CardHeader className="pb-2 p-3">
                                <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2 font-mono text-green-400">
                                    <User className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="truncate">
                                        {playerProfile.name || "特工"}
                                    </span>
                                    {customization?.gender && (
                                        <span className="text-[10px] text-muted-foreground">
                                            (
                                            {customization.gender === "male"
                                                ? "♂"
                                                : customization.gender ===
                                                    "female"
                                                  ? "♀"
                                                  : "⚧"}
                                            )
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-3">
                                {/* HP Bar */}
                                <div className="space-y-1 font-mono">
                                    <div className="flex justify-between text-[10px] md:text-xs">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Heart className="w-3 h-3 text-red-500" />
                                            生命
                                        </span>
                                        <span className="text-zinc-300">
                                            {hp} / {maxHp}
                                        </span>
                                    </div>
                                    <Progress
                                        value={hpPercent}
                                        className="h-2 bg-red-950/20"
                                        indicatorClassName={cn(
                                            "bg-red-500 transition-all duration-500 ease-out",
                                            hpPercent < 30 && "animate-pulse",
                                        )}
                                    />
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs font-mono">
                                    <div className="flex items-center gap-1 text-orange-400">
                                        <Swords className="w-3 h-3" />
                                        <span>力量: {power}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-400">
                                        <Zap className="w-3 h-3" />
                                        <span>敏捷: {agility}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-purple-400">
                                        <Brain className="w-3 h-3" />
                                        <span>智力: {intellect}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-pink-400">
                                        <Users className="w-3 h-3" />
                                        <span>魅力: {charisma}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-yellow-400 col-span-2">
                                        <Sparkles className="w-3 h-3" />
                                        <span>幸运: {luck}</span>
                                    </div>
                                </div>

                                {/* Background Info */}
                                {customization?.background && (
                                    <div className="border-t border-zinc-800 pt-2 text-[10px] md:text-xs space-y-1">
                                        {customization.background
                                            .occupation && (
                                            <p className="text-muted-foreground">
                                                职业:{" "}
                                                <span className="text-zinc-300">
                                                    {
                                                        customization.background
                                                            .occupation
                                                    }
                                                </span>
                                            </p>
                                        )}
                                        {customization.background.origin && (
                                            <p className="text-muted-foreground">
                                                出身:{" "}
                                                <span className="text-zinc-300">
                                                    {
                                                        customization.background
                                                            .origin
                                                    }
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Talents & Traits */}
                        {(traits.length > 0 ||
                            (customization?.talents &&
                                customization.talents.length > 0)) && (
                            <Card className="shrink-0">
                                <CardHeader className="pb-2 p-3">
                                    <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2 font-mono text-amber-400">
                                        <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                                        天赋 & 特质
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    <div className="flex flex-wrap gap-1">
                                        {traits.map((trait) => (
                                            <span
                                                key={trait.id}
                                                className="text-[10px] px-2 py-0.5 bg-amber-950/30 border border-amber-500/30 text-amber-400 rounded"
                                                title={trait.effect}
                                            >
                                                {trait.name}
                                            </span>
                                        ))}
                                        {customization?.talents?.map(
                                            (talent) => (
                                                <span
                                                    key={talent.id}
                                                    className="text-[10px] px-2 py-0.5 bg-purple-950/30 border border-purple-500/30 text-purple-400 rounded"
                                                    title={talent.description}
                                                >
                                                    {talent.name} Lv.
                                                    {talent.level}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Objectives */}
                        <Card className="shrink-0">
                            <CardHeader className="pb-2 p-3">
                                <CardTitle className="text-xs md:text-sm font-medium font-mono text-green-400">
                                    // 任务
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 font-mono">
                                {currentQuestState && (
                                    <ul className="space-y-1 text-[10px] md:text-xs">
                                        {currentQuestState.visible_objectives.map(
                                            (obj) => (
                                                <li
                                                    key={obj.id}
                                                    className="flex gap-2"
                                                >
                                                    <span
                                                        className={cn(
                                                            "text-green-500 shrink-0",
                                                            obj.status ===
                                                                "completed"
                                                                ? "opacity-50"
                                                                : "",
                                                        )}
                                                    >
                                                        {obj.status ===
                                                        "completed"
                                                            ? "[x]"
                                                            : "[ ]"}
                                                    </span>
                                                    <span
                                                        className={
                                                            obj.status ===
                                                            "completed"
                                                                ? "line-through text-muted-foreground"
                                                                : "text-zinc-300"
                                                        }
                                                    >
                                                        {obj.text}
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                        {currentQuestState.visible_objectives
                                            .length === 0 && (
                                            <span className="text-muted-foreground italic">
                                                暂无目标
                                            </span>
                                        )}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Inventory Tab */}
                    <TabsContent value="inventory" className="mt-3">
                        <Card className="shrink-0">
                            <CardHeader className="pb-2 p-3">
                                <CardTitle className="text-xs md:text-sm font-medium flex items-center justify-between font-mono text-green-400">
                                    <span className="flex items-center gap-2">
                                        <Backpack className="w-3 h-3 md:w-4 md:h-4" />
                                        物品栏
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {inventory.length}/20
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 md:p-3">
                                {inventory.length === 0 ? (
                                    <div className="text-[10px] md:text-xs text-muted-foreground text-center py-6 border border-dashed border-zinc-800 rounded font-mono">
                                        空空如也...
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {inventory.map((item) => (
                                            <Button
                                                key={item.id}
                                                variant="outline"
                                                className="h-auto py-2 px-2 flex flex-col items-start gap-1 text-left whitespace-normal break-words border-zinc-800 hover:border-green-500/50 hover:bg-green-950/20 transition-all duration-200"
                                                onClick={() =>
                                                    handleItemClick(item.name)
                                                }
                                                title={item.description}
                                            >
                                                <div className="flex items-center gap-1 w-full">
                                                    <Package className="w-3 h-3 shrink-0 text-primary" />
                                                    <span className="font-semibold text-[10px] md:text-xs leading-none font-mono text-zinc-300 truncate">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] md:text-[10px] text-muted-foreground font-mono">
                                                    [{item.type}]
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Social Tab */}
                    <TabsContent value="social" className="mt-3">
                        <Card className="shrink-0">
                            <CardHeader className="pb-2 p-3">
                                <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2 font-mono text-blue-400">
                                    <Users className="w-3 h-3 md:w-4 md:h-4" />
                                    社交关系
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                {!social ||
                                social.relationships.length === 0 ? (
                                    <div className="text-[10px] md:text-xs text-muted-foreground text-center py-6 border border-dashed border-zinc-800 rounded font-mono">
                                        尚未建立任何关系...
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {social.relationships.map((rel) => (
                                            <div
                                                key={rel.npc_id}
                                                className="flex items-center justify-between p-2 border border-zinc-800 rounded hover:border-blue-500/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            rel.disposition ===
                                                                "friendly"
                                                                ? "bg-green-500"
                                                                : rel.disposition ===
                                                                    "hostile"
                                                                  ? "bg-red-500"
                                                                  : rel.disposition ===
                                                                      "fearful"
                                                                    ? "bg-yellow-500"
                                                                    : "bg-zinc-500",
                                                        )}
                                                    />
                                                    <span className="text-[10px] md:text-xs font-mono text-zinc-300">
                                                        {rel.npc_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-mono",
                                                            rel.trust_level > 50
                                                                ? "text-green-400"
                                                                : rel.trust_level <
                                                                    -50
                                                                  ? "text-red-400"
                                                                  : "text-zinc-400",
                                                        )}
                                                    >
                                                        {rel.trust_level > 0
                                                            ? "+"
                                                            : ""}
                                                        {rel.trust_level}
                                                    </span>
                                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Map Tab */}
                    <TabsContent value="map" className="mt-3">
                        <Card className="shrink-0">
                            <CardHeader className="pb-2 p-3">
                                <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-2 font-mono text-cyan-400">
                                    <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                                    当前位置
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-3">
                                <div className="space-y-2 font-mono text-[10px] md:text-xs">
                                    {currentWorldState.environment.region && (
                                        <div className="flex items-center gap-2">
                                            <Map className="w-3 h-3 text-cyan-500" />
                                            <span className="text-muted-foreground">
                                                区域:
                                            </span>
                                            <span className="text-cyan-400">
                                                {
                                                    currentWorldState
                                                        .environment.region
                                                }
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-green-500" />
                                        <span className="text-muted-foreground">
                                            位置:
                                        </span>
                                        <span className="text-green-400">
                                            {currentWorldState.environment
                                                .location || "未知"}
                                        </span>
                                    </div>
                                    {currentWorldState.environment
                                        .sub_location && (
                                        <div className="flex items-center gap-2 pl-5">
                                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-zinc-400">
                                                {
                                                    currentWorldState
                                                        .environment
                                                        .sub_location
                                                }
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-amber-500" />
                                        <span className="text-muted-foreground">
                                            时间:
                                        </span>
                                        <span className="text-amber-400">
                                            {currentWorldState.environment
                                                .time || "不明"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CloudFog className="w-3 h-3 text-blue-500" />
                                        <span className="text-muted-foreground">
                                            天气:
                                        </span>
                                        <span className="text-blue-400">
                                            {currentWorldState.environment
                                                .weather || "不明"}
                                        </span>
                                    </div>
                                </div>

                                {/* Present NPCs */}
                                {currentWorldState.present_npcs &&
                                    currentWorldState.present_npcs.length >
                                        0 && (
                                        <div className="border-t border-zinc-800 pt-2">
                                            <p className="text-[10px] text-muted-foreground mb-1">
                                                场景中的人物:
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {currentWorldState.present_npcs.map(
                                                    (npcId) => (
                                                        <span
                                                            key={npcId}
                                                            className="text-[10px] px-2 py-0.5 bg-blue-950/30 border border-blue-500/30 text-blue-400 rounded"
                                                        >
                                                            {npcId}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Threats */}
                                {currentWorldState.active_threats.length >
                                    0 && (
                                    <div className="border-t border-zinc-800 pt-2">
                                        <p className="text-[10px] text-red-400 mb-1 flex items-center gap-1">
                                            <ShieldAlert className="w-3 h-3" />
                                            威胁:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {currentWorldState.active_threats.map(
                                                (threat, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] px-2 py-0.5 bg-red-950/30 border border-red-500/30 text-red-400 rounded"
                                                    >
                                                        {threat}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Fixed Footer */}
            <div className="p-3 md:p-4 border-t bg-background/50 backdrop-blur shrink-0 space-y-2">
                {/* Fast Simulation Toggle */}
                <Button
                    variant={fastSimEnabled ? "default" : "outline"}
                    size="sm"
                    className={cn(
                        "w-full font-mono text-[10px] md:text-xs transition-all h-8",
                        fastSimEnabled && "bg-primary/80 hover:bg-primary",
                    )}
                    onClick={() => toggleFastSim(!fastSimEnabled)}
                >
                    {isPrefetching ? (
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                        <Zap
                            className={cn(
                                "w-3 h-3 mr-2",
                                fastSimEnabled && "fill-current",
                            )}
                        />
                    )}
                    快速模式: {fastSimEnabled ? "开" : "关"}
                </Button>
                <div className="flex gap-2">
                    <AtlasDialog />
                    <SaveLoadDialog />
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden fixed left-3 top-16 z-50 bg-black/80 border border-green-500/30 text-green-500 hover:bg-green-950/50 hover:text-green-400 h-10 w-10"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <X className="w-5 h-5" />
                ) : (
                    <Menu className="w-5 h-5" />
                )}
            </Button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Panel */}
            <aside
                className={cn(
                    "h-full border-r border-zinc-800 bg-black/95 flex flex-col overflow-hidden backdrop-blur-sm z-40",
                    // Mobile: Slide-in drawer
                    "fixed md:relative left-0 top-0 transition-transform duration-300 ease-in-out",
                    "w-72 md:w-80",
                    isOpen
                        ? "translate-x-0"
                        : "-translate-x-full md:translate-x-0",
                )}
            >
                <PanelContent />
            </aside>
        </>
    );
}
