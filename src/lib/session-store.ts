import { randomUUID } from 'crypto';
import { PlayerProfile, QuestOutput, WorldState, EnvStateData, GameHistoryItem } from '@/types/game';
import { createClient } from '@supabase/supabase-js';

export type GameSession = {
  session_id: string;
  user_id?: string | null;
  world_template_id: string;
  world_template: string;
  hard_rules: string;
  world_state: WorldState;
  player_profile: PlayerProfile;
  quest_state: QuestOutput | null;
  timestamp?: number;
  compressed_history?: string;
  last_compression_turn?: number;
  last_envstate_turn?: number;
  env_state?: EnvStateData;
  history?: GameHistoryItem[];
};

// Create a Supabase client for server-side use
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[SessionStore] Supabase not configured, using memory storage');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// In-memory fallback for when Supabase is not available
const memoryStore = new Map<string, GameSession>();

export async function createSession(input: Omit<GameSession, 'session_id'>, userId?: string | null): Promise<GameSession> {
  const session_id = randomUUID();
  const session: GameSession = {
    session_id,
    user_id: userId,
    ...input,
    timestamp: Date.now()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('game_sessions').insert({
      session_id: session.session_id,
      user_id: session.user_id,
      world_template_id: session.world_template_id,
      world_template: session.world_template,
      hard_rules: session.hard_rules,
      world_state: session.world_state,
      player_profile: session.player_profile,
      quest_state: session.quest_state,
      compressed_history: session.compressed_history,
      last_compression_turn: session.last_compression_turn,
      env_state: session.env_state,
      history: session.history,
    });

    if (error) {
      console.error('[SessionStore] Create session error:', error);
    }

    // Always refresh memory cache so getSession can't return stale state.
    memoryStore.set(session_id, session);
  } else {
    memoryStore.set(session_id, session);
  }

  return session;
}

export async function getSession(session_id: string): Promise<GameSession | null> {
  // First check memory store for faster access
  const memorySession = memoryStore.get(session_id);
  if (memorySession) {
    return memorySession;
  }

  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('session_id', session_id)
      .maybeSingle(); // Use maybeSingle() to not error on 0 rows

    if (error) {
      console.error('[SessionStore] Get session error:', error);
      return null;
    }

    if (data) {
      const session: GameSession = {
        session_id: data.session_id,
        user_id: data.user_id,
        world_template_id: data.world_template_id,
        world_template: data.world_template,
        hard_rules: data.hard_rules,
        world_state: data.world_state,
        player_profile: data.player_profile,
        quest_state: data.quest_state,
        compressed_history: data.compressed_history,
        last_compression_turn: data.last_compression_turn,
        env_state: data.env_state,
        history: data.history,
      };
      // Cache in memory for faster subsequent access
      memoryStore.set(session_id, session);
      return session;
    }
  }

  return null;
}

export async function saveSession(session: GameSession): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { error } = await supabase
      .from('game_sessions')
      .update({
        world_state: session.world_state,
        player_profile: session.player_profile,
        quest_state: session.quest_state,
        compressed_history: session.compressed_history,
        last_compression_turn: session.last_compression_turn,
        env_state: session.env_state,
        history: session.history,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', session.session_id);

    if (error) {
      console.error('[SessionStore] Save session error:', error);
    }

    // Always refresh memory cache so getSession can't return stale state.
    memoryStore.set(session.session_id, { ...session, timestamp: Date.now() });
  } else {
    memoryStore.set(session.session_id, { ...session, timestamp: Date.now() });
  }
}

// Sync version for backward compatibility (wraps async)
export function createSessionSync(input: Omit<GameSession, 'session_id'>, userId?: string | null): GameSession {
  const session_id = randomUUID();
  const session: GameSession = { session_id, user_id: userId, ...input, timestamp: Date.now() };
  memoryStore.set(session_id, session);

  // Fire and forget async save
  createSession(input, userId).catch(console.error);

  return session;
}
