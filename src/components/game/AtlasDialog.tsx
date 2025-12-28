'use client';

import { useState, useMemo } from 'react';
import { useAtlasStore } from '@/lib/atlas-store';
import { useGameStore } from '@/store/game';
import { WORLD_TEMPLATES } from '@/lib/world-constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GameScrollArea } from '@/components/game/GameScrollArea';
import { Database, MapPin, User, Book, Key, Box, Skull, Clock, Trophy, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AtlasDialogProps {
  trigger?: React.ReactNode;
}

// Helper to get a human-readable world name
function getWorldDisplayName(worldId: string): string {
  const entry = Object.entries(WORLD_TEMPLATES).find(([, meta]) => meta.world_id === worldId);
  if (entry) {
    // Capitalize the key (e.g., 'mistwood' -> 'MISTWOOD')
    return entry[0].toUpperCase();
  }
  // Fallback: extract from ID
  return worldId.replace('world_', '').replace(/_\d+$/, '').toUpperCase();
}

export function AtlasDialog({ trigger }: AtlasDialogProps) {
  const { entries: allEntries, runSummaries: allRunSummaries } = useAtlasStore();
  const { playerProfile } = useGameStore();
  const [activeTab, setActiveTab] = useState<'lore' | 'history'>('lore');
  const [selectedWorldId, setSelectedWorldId] = useState<string | 'all'>('all');

  // Build list of worlds from WORLD_TEMPLATES + any unique source_world_ids in entries
  const worldOptions = useMemo(() => {
    const worldsFromTemplates = Object.values(WORLD_TEMPLATES).map(w => w.world_id);
    const worldsFromEntries = allEntries.map(e => e.source_world_id).filter(Boolean);
    const worldsFromRuns = allRunSummaries.map(r => r.world_id).filter(Boolean);
    const allWorldIds = Array.from(new Set([...worldsFromTemplates, ...worldsFromEntries, ...worldsFromRuns]));
    return allWorldIds;
  }, [allEntries, allRunSummaries]);

  // Filter entries based on selectedWorldId
  const filteredEntries = useMemo(() => {
    if (selectedWorldId === 'all') {
      return allEntries;
    }
    return allEntries.filter(e => e.source_world_id === selectedWorldId || !e.source_world_id);
  }, [allEntries, selectedWorldId]);

  // Filter runs based on selectedWorldId
  const filteredRuns = useMemo(() => {
    if (selectedWorldId === 'all') {
      return allRunSummaries;
    }
    return allRunSummaries.filter(r => r.world_id === selectedWorldId);
  }, [allRunSummaries, selectedWorldId]);

  // Calculate discovery progress
  const discoveryStats = useMemo(() => {
    if (selectedWorldId === 'all') {
      const totalTarget = Object.values(WORLD_TEMPLATES).reduce((sum, w) => sum + (w.discovery_target ?? 50), 0);
      const totalDiscovered = allEntries.length;
      return { discovered: totalDiscovered, target: totalTarget };
    }
    const worldMeta = Object.values(WORLD_TEMPLATES).find(w => w.world_id === selectedWorldId);
    const target = worldMeta?.discovery_target ?? 50;
    const discovered = filteredEntries.length;
    return { discovered, target };
  }, [selectedWorldId, allEntries, filteredEntries]);

  const discoveryPercent = Math.min(100, Math.round((discoveryStats.discovered / discoveryStats.target) * 100));

  const getIcon = (category: string) => {
    switch (category) {
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'npc': return <User className="w-4 h-4" />;
      case 'rule': return <Book className="w-4 h-4" />;
      case 'secret': return <Key className="w-4 h-4" />;
      case 'item': return <Box className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'death': return <Skull className="w-4 h-4 text-red-500" />;
      case 'mastery': return <Trophy className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex-1 gap-2 border-green-500/30 text-green-500 hover:text-green-400 hover:border-green-400 hover:bg-green-950/30 font-mono transition-all duration-300 group">
            <Database className="w-4 h-4 group-hover:animate-pulse" />
            ATLAS
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] bg-black border-green-500/30 text-green-500 font-mono flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-500 tracking-wider text-xl uppercase">
            <Database className="w-5 h-5 animate-pulse" />
            &gt; SYSTEM_DATABASE // ATLAS
          </DialogTitle>
          <DialogDescription className="text-green-500/60 text-xs">
            &gt; DISCOVERY_PROGRESS: {discoveryStats.discovered} / {discoveryStats.target} ({discoveryPercent}%)
          </DialogDescription>
          <Progress
            value={discoveryPercent}
            className="h-2 bg-green-950/30 mt-2"
            indicatorClassName="bg-green-500 transition-all duration-500"
          />
        </DialogHeader>

        {/* World Filter Row */}
        <div className="flex flex-wrap gap-2 py-3 border-b border-green-500/20">
          <span className="text-green-500/60 text-xs uppercase tracking-wider self-center mr-2">
            <Globe className="w-3 h-3 inline mr-1" />
            FILTER:
          </span>
          <Button
            variant={selectedWorldId === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedWorldId('all')}
            className={`text-xs h-7 px-3 uppercase tracking-wider ${selectedWorldId === 'all'
              ? 'bg-green-500 text-black hover:bg-green-400'
              : 'border-green-500/30 text-green-500 hover:border-green-400 hover:bg-green-950/30'
              }`}
          >
            ALL
          </Button>
          {worldOptions.map(worldId => (
            <Button
              key={worldId}
              variant={selectedWorldId === worldId ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedWorldId(worldId)}
              className={`text-xs h-7 px-3 uppercase tracking-wider ${selectedWorldId === worldId
                ? 'bg-green-500 text-black hover:bg-green-400'
                : 'border-green-500/30 text-green-500 hover:border-green-400 hover:bg-green-950/30'
                }`}
            >
              {getWorldDisplayName(worldId)}
            </Button>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'lore' | 'history')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-green-950/20 border border-green-500/30">
            <TabsTrigger value="lore" className="data-[state=active]:bg-green-500 data-[state=active]:text-black uppercase tracking-wider">
              知识库
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-green-500 data-[state=active]:text-black uppercase tracking-wider">
              历史记录
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lore" className="flex-1 overflow-hidden mt-4">
            <GameScrollArea className="h-full pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEntries.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-green-500/40 border border-dashed border-green-500/20 rounded bg-green-950/5">
                    <Database className="w-12 h-12 mb-4 opacity-20" />
                    <p>&gt; NO_DATA_FOUND</p>
                    <p className="text-xs mt-2 text-center max-w-xs opacity-60">
                      // Complete mission cycles to populate database entries.
                    </p>
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <Card key={entry.id} className="bg-black border-green-500/30 hover:border-green-500/60 transition-colors group">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-400 uppercase tracking-tight flex-1 min-w-0">
                          {getIcon(entry.category)}
                          <span className="truncate">{entry.topic}</span>
                        </CardTitle>
                        <Badge variant="outline" className="capitalize text-[10px] border-green-500/30 text-green-500/70 bg-green-950/10 shrink-0">
                          {entry.category}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-xs text-green-500/80 leading-relaxed font-sans opacity-90">
                          {entry.description}
                        </p>
                        {entry.carry_penalty && (
                          <div className="mt-2 p-2 bg-red-950/20 border border-red-500/20 rounded flex items-start gap-2">
                            <Skull className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                            <span className="text-[10px] text-red-400 leading-tight">
                              [Reality Anchor Penalty]: {entry.carry_penalty.description}
                            </span>
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-green-500/10 flex justify-between items-center text-[9px] text-green-500/40 uppercase">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {getWorldDisplayName(entry.source_world_id)}
                          </span>
                          <span>{new Date(entry.unlocked_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </GameScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
            <GameScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {filteredRuns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-green-500/40 border border-dashed border-green-500/20 rounded bg-green-950/5">
                    <Skull className="w-12 h-12 mb-4 opacity-20" />
                    <p>&gt; NO_RECORDS_FOUND</p>
                    <p className="text-xs mt-2 text-center max-w-xs opacity-60">
                      // Complete or fail a mission to create a historical record.
                    </p>
                  </div>
                ) : (
                  filteredRuns.map((run) => (
                    <Card key={run.id} className="bg-black border-green-500/30 hover:border-green-500/60 transition-colors">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-400 uppercase tracking-tight flex-1 min-w-0">
                          {getOutcomeIcon(run.outcome)}
                          <span className="truncate">
                            {run.outcome === 'death' ? '阵亡记录' : run.outcome === 'mastery' ? '通关记录' : '撤离记录'}
                          </span>
                        </CardTitle>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${run.outcome === 'death' ? 'border-red-500/30 text-red-500/70 bg-red-950/10' :
                          run.outcome === 'mastery' ? 'border-yellow-500/30 text-yellow-500/70 bg-yellow-950/10' :
                            'border-blue-500/30 text-blue-500/70 bg-blue-950/10'
                          }`}>
                          {run.turns_survived} 回合
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-xs text-green-500/80 leading-relaxed font-sans opacity-90 italic">
                          &quot;{run.summary}&quot;
                        </p>
                        <div className="mt-3 pt-3 border-t border-green-500/10 flex justify-between items-center text-[9px] text-green-500/40 uppercase">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {getWorldDisplayName(run.world_id)}
                          </span>
                          <span>{new Date(run.recorded_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </GameScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
