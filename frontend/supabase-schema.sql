-- Supabase SQL Schema for Sui-In-Space
-- Run this in your Supabase SQL Editor to create tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  galactic_balance BIGINT DEFAULT 0,
  sui_balance BIGINT DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  agent_type INTEGER NOT NULL,
  agent_class INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{"processing": 10, "mobility": 10, "power": 10, "resilience": 10, "luck": 5, "neuralBandwidth": 100}',
  is_staked BOOLEAN DEFAULT FALSE,
  missions_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ships table
CREATE TABLE IF NOT EXISTS ships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ship_class INTEGER NOT NULL,
  max_health INTEGER DEFAULT 100,
  current_health INTEGER DEFAULT 100,
  speed INTEGER DEFAULT 10,
  firepower INTEGER DEFAULT 10,
  fuel INTEGER DEFAULT 100,
  max_fuel INTEGER DEFAULT 100,
  is_docked BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  station_type INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  total_staked BIGINT DEFAULT 0,
  yield_rate INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id),
  ship_id UUID REFERENCES ships(id),
  status INTEGER DEFAULT 0, -- 0=Active, 1=Completed, 2=Failed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reward BIGINT,
  success BOOLEAN
);

-- Activity Log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  sound_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'en',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet_address);
CREATE INDEX IF NOT EXISTS idx_agents_player ON agents(player_id);
CREATE INDEX IF NOT EXISTS idx_ships_player ON ships(player_id);
CREATE INDEX IF NOT EXISTS idx_stations_player ON stations(player_id);
CREATE INDEX IF NOT EXISTS idx_missions_player ON missions(player_id);
CREATE INDEX IF NOT EXISTS idx_activity_player ON activity_log(player_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can restrict based on auth later)
CREATE POLICY "Allow all for players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ships" ON ships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for stations" ON stations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for missions" ON missions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);
