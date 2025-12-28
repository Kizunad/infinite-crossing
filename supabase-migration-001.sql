-- Migration: Make generated_worlds public (remove user_id)
-- =============================================================================
-- Run this if you already created the old schema

-- Drop old policies
DROP POLICY IF EXISTS "Users can manage own worlds" ON generated_worlds;
DROP POLICY IF EXISTS "Public can read worlds" ON generated_worlds;
DROP POLICY IF EXISTS "Anyone can read worlds" ON generated_worlds;
DROP POLICY IF EXISTS "Anyone can create worlds" ON generated_worlds;
DROP POLICY IF EXISTS "Anyone can update play count" ON generated_worlds;

-- Drop old table and recreate
DROP TABLE IF EXISTS generated_worlds;

-- Recreate as public table with all metadata
CREATE TABLE generated_worlds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  tagline TEXT,
  template_content TEXT NOT NULL,
  times_played INTEGER DEFAULT 0,
  average_power INTEGER DEFAULT 10,
  mystery_level INTEGER DEFAULT 50,
  resource_scarcity INTEGER DEFAULT 50,
  discovery_target INTEGER DEFAULT 100,
  loot_pool JSONB DEFAULT '[]'::jsonb,
  creator_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generated_worlds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read worlds" ON generated_worlds
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create worlds" ON generated_worlds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update play count" ON generated_worlds
  FOR UPDATE USING (true);
