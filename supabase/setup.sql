-- ==========================================
-- 1. PROFILES TABLE (Inbound Founders)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  -- Core data (filled out by the founder/form)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namn TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  slush_bio TEXT,
  slush_industry TEXT,
  job_title TEXT,
  website TEXT,
  meeting_time TEXT,
  country TEXT,

  -- AI rated
  score INT,
  verdict TEXT,
  reasoning TEXT,

  
  created_at TIMESTAMPTZ DEFAULT NOW()
  companystate TEXT,
);

-- ==========================================
-- 2. INVESTOR SETTINGS TABLE (Filters/Alerts)
-- ==========================================
CREATE TABLE IF NOT EXISTS investor_settings (
  id INT PRIMARY KEY DEFAULT 1,
  allowed_regions TEXT[] DEFAULT ARRAY['nordic_baltic'],
  allowed_stages TEXT[] DEFAULT ARRAY['seed', 'series_a'],
  min_score_alert INT DEFAULT 80
);

-- Insert initial row for investor settings (safe to run multiple times)
INSERT INTO investor_settings (id, allowed_regions, allowed_stages, min_score_alert)
VALUES (1, ARRAY['nordic_baltic'], ARRAY['seed', 'series_a'], 80)
ON CONFLICT (id) DO NOTHING;