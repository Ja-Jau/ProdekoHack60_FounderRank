-- ==========================================
-- 1. PROFILES TABLE (Inbound Founders)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namn TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  slush_bio TEXT,
  slush_industry TEXT,
  job_title TEXT,
  website TEXT,
  meeting_time TEXT,
  country TEXT,
  stage TEXT,

  -- AI rated
  score INT,
  verdict TEXT,
  reasoning TEXT,
  status TEXT DEFAULT 'pending', -- Tracks 'pending', 'accepted', 'declined'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  companystate TEXT,
  company_name TEXT
);

-- ==========================================
-- 2. INVESTOR SETTINGS TABLE (Filters/Alerts)
-- ==========================================
CREATE TABLE IF NOT EXISTS investor_settings (
  id INT PRIMARY KEY DEFAULT 1,
  allowed_regions TEXT[] DEFAULT ARRAY['nordic_baltic'],
  allowed_stages TEXT[] DEFAULT ARRAY['seed', 'series_a'],
  core_sectors TEXT,
  excluded_sectors TEXT,
  founder_archetypes TEXT[],
  benchmark_companies TEXT,
  min_score_alert INT DEFAULT 80
);

INSERT INTO investor_settings (id, allowed_regions, allowed_stages, min_score_alert)
VALUES (1, ARRAY['nordic_baltic'], ARRAY['seed', 'series_a'], 80)
ON CONFLICT (id) DO NOTHING;


-- 1. Add profiles to the Realtime publication so changes broadcast to the frontend
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 2. Ensure full row data is sent on updates
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- 3. Ensure Row Level Security isn't silently blocking anonymous reads/writes
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE investor_settings DISABLE ROW LEVEL SECURITY;