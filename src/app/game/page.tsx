'use client';

import { Suspense, useEffect, useState } from 'react';
import { useGameStore } from '@/store/game';
import { useGeneratedWorldStore } from '@/lib/generated-world-store';
import { Button } from '@/components/ui/button';
import { SidePanel } from '@/components/game/SidePanel';
import { GameTerminal } from '@/components/game/GameTerminal';
import { ActionPanel } from '@/components/game/ActionPanel';
import { DeathOverlay } from '@/components/game/DeathOverlay';
import { VictoryOverlay } from '@/components/game/VictoryOverlay';
import { DiceOverlay } from '@/components/game/DiceOverlay';
import { LoadingSequence } from '@/components/game/LoadingSequence';
import { PauseMenu } from '@/components/game/PauseMenu';
import { useRouter, useSearchParams } from 'next/navigation';

function GameContent() {
  const { sessionId, isProcessing } = useGameStore();
  const { getWorld } = useGeneratedWorldStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const searchParams = useSearchParams();
  const worldId = searchParams.get('world') || 'mistwood';

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!mounted) return <div className="h-screen bg-black" />;

  // If no session, redirect to prepare page
  if (!sessionId) {
    if (isProcessing) {
      return <LoadingSequence worldId={worldId} />;
    }

    // Redirect to prepare page
    router.push(`/prepare?world=${worldId}`);
    return (
      <div className="h-screen bg-black text-green-500 flex items-center justify-center font-mono">
        <span className="animate-pulse">REDIRECTING TO PREPARATION PHASE...</span>
      </div>
    );
  }

  // Main Game Interface
  return (
    <main className="dark flex h-screen w-full bg-black text-zinc-300 font-mono overflow-hidden relative">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />

      {/* CRT Scanline (Subtle) */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_3px] opacity-30 mix-blend-overlay" />

      {/* Layout Grid */}
      <SidePanel />

      <div className="flex-1 flex flex-col min-w-0 border-l border-zinc-800 bg-black/90 relative z-10">
        <GameTerminal worldId={worldId} />
        <ActionPanel />
      </div>

      {/* Manual Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-40 text-zinc-500 hover:text-green-500 hover:bg-green-950/30 border border-transparent hover:border-green-500/30"
        onClick={() => setIsPaused(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
      </Button>

      <DeathOverlay />
      <VictoryOverlay />
      <DiceOverlay />
      <PauseMenu isOpen={isPaused} onResume={() => setIsPaused(false)} />
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black text-green-500 flex items-center justify-center font-mono">INITIALIZING...</div>}>
      <GameContent />
    </Suspense>
  );
}