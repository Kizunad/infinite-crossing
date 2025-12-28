-- =============================================================================
-- Infinite Crossing - Supabase Database Schema
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Atlas Entries (Player's unlocked knowledge and items)
CREATE TABLE IF NOT EXISTS atlas_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('location', 'npc', 'rule', 'secret', 'item')),
  description TEXT NOT NULL,
  source_world_id TEXT NOT NULL,
  carry_penalty JSONB, -- { type, value, description }
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

ALTER TABLE atlas_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own entries" ON atlas_entries;
CREATE POLICY "Users can manage own entries" ON atlas_entries
  FOR ALL USING (auth.uid() = user_id);

-- 2. Run Summaries (Game session records)
CREATE TABLE IF NOT EXISTS run_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  world_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('death', 'escape', 'mastery')),
  turns_survived INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE run_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own summaries" ON run_summaries;
CREATE POLICY "Users can manage own summaries" ON run_summaries
  FOR ALL USING (auth.uid() = user_id);

-- 3. Generated Worlds (Public world templates - shared by all players)
CREATE TABLE IF NOT EXISTS generated_worlds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  template_content TEXT NOT NULL,
  times_played INTEGER DEFAULT 0,
  creator_name TEXT, -- Optional: for display credit only, not auth
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public table: anyone can read and write (for now)
-- In production, you may want to add moderation/approval flow
ALTER TABLE generated_worlds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read worlds" ON generated_worlds;
CREATE POLICY "Anyone can read worlds" ON generated_worlds
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create worlds" ON generated_worlds;
CREATE POLICY "Anyone can create worlds" ON generated_worlds
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update play count" ON generated_worlds;
CREATE POLICY "Anyone can update play count" ON generated_worlds
  FOR UPDATE USING (true);

-- 4. Game Sessions (Active game state)
CREATE TABLE IF NOT EXISTS game_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  world_template_id TEXT NOT NULL,
  world_template TEXT NOT NULL,
  hard_rules TEXT NOT NULL,
  world_state JSONB NOT NULL,
  player_profile JSONB NOT NULL,
  quest_state JSONB,
  compressed_history TEXT,
  last_compression_turn INTEGER DEFAULT 0,
  env_state JSONB,
  history JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Game sessions allow NULL user_id for guest mode
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own sessions" ON game_sessions;
CREATE POLICY "Users can manage own sessions" ON game_sessions
  FOR ALL USING (
    user_id IS NULL OR auth.uid() = user_id
  );

-- =============================================================================
-- Disable Email Confirmation (for username-only auth)
-- =============================================================================
-- Go to: Authentication -> Providers -> Email
-- Uncheck "Confirm email"
-- This allows immediate login after registration without email verification
