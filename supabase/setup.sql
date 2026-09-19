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


INSERT INTO profiles ("namn","linkedin_url","country","companystate","company_name","meeting_time","slush_bio","message")
VALUES (
  'Robin Hansson',
  'https://www.linkedin.com/in/hanssonrobin/',
  'Finland',
  'Series_A',
  'Wave Ventures',
  '13:00',
  'Investor @ Wave Ventures | Founders House',
  'Im Robin, founder of Wave Ventures and Founders House. We are building the core infrastructure and growth platform to launch and scale high-potential ventures across Northern Europe.

Following strong growth and traction across our network, we are now opening our Series A round to accelerate expansion and scale our platform offerings. Given your funds focus on Series A investments in [Sector/Platform], Id love to share our deck and walk you through our growth trajectory.

Would you have 15 minutes for a brief intro call next week?

Best regards,

Robin'
),
(
  'Touko Ursin',
  'https://www.linkedin.com/in/touko-ursin/',
  'Finland',
  'Pre-seed',
  'Helios One',
  '12:50',
  'building | IEM at Aalto | 11x hackathon winner | ex-ŌURA',
  'Hi [Investor Name],

Im Touko, co-founder at Helios One. Following my time at ŌURA and a background in Industrial Engineering at Aalto, my team and I are building the next generation of [Core Product/Solution].

Helios One is currently raising our Pre-seed round to accelerate product development and milestone validation. Given your thesis in early-stage [Sector], Id love to share our deck and a brief overview with you.

Let me know if youd be open to a quick intro chat.

Best,

Touko'

),
(
  'Konsta Varonen',
  'https://www.linkedin.com/in/konstavaronen/',
  'United States',
  'Seed',
  'Control.dev',
  '13:30',
  'Building Control.dev | Founder | Agentic Finance | Multinational | Hackathon winner | Ultraendurance hybrid ahtlete | Army special forces',
  'Im Konsta, founder of Control.dev. We are building infrastructure to power agentic finance, enabling autonomous financial operations at scale.

Control.dev is currently in its Seed stage, expanding our core engineering team and executing on our enterprise pipeline. Given your track record supporting fintech and AI infrastructure founders, Id value the opportunity to walk you through our vision and traction.

Would you be open to reviewing our deck?

Best regards,

Konsta'
),
(
  'Viljami Meriläinen',
  'https://www.linkedin.com/in/viljamimerilainen/',
  'Finland',
  'Series_A',
  'PreNew',
  '19:00',
  'Co-founder @PreNew',
  'Im Viljami, co-founder at PreNew. Over the past year, weve hit key commercial milestones in [Industry/Market] and PreNew is now raising a Series A round to scale our operations internationally.

Seeing your active investments in growth-stage [Sector/Market], I wanted to reach out and see if youd be open to a quick introduction before we formally close the round.

Best,

Viljami'
),
(
  'Ole Petersen',
  'https://www.linkedin.com/in/olepetersen/',
  'United States',
  'Series_B',
  'Listen Labs',
  '9:17',
  null,
  'Im Ole from Listen Labs. Following strong commercial momentum and expanding our enterprise footprint, Listen Labs is gearing up for our Series B raise to scale our product suite and market presence.

Given your firms expertise in backing Series B platforms, Id love to share an update on our metrics and growth plan for the coming year.

Would you have time for a brief call next week?

Best regards,

Ole'
),
(
  'Lena Weirauch',
  'https://www.linkedin.com/in/lena-weirauch/',
  'Germany',
  'Series_A',
  'AIomatic',
  '14:00',
  null,
  'Im Lena, founder/CEO at AIomatic. Were transforming how industrial and enterprise clients deploy scalable AI automation to streamline complex workflows.

AIomatic is preparing its Series A round to fuel European expansion and further product refinement. Your thesis around B2B AI software aligns closely with where we are heading.

Let me know if you have a few minutes for a brief introduction.

Best,

Lena'
),
(
  'Kim Flint',
  'https://www.linkedin.com/in/kim-flint/',
  'Germany',
  'Seed',
  'WONDA Swim',
  '14:00',
  null,
  'Hi [Investor Name],
  Im Kim, founder of WONDA Swim. We are scaling a sustainable, high-performing swimwear brand with strong unit economics and a rapidly growing direct-to-consumer base.

WONDA Swim is currently raising a Seed round to expand inventory, scale performance marketing, and launch strategic retail partnerships. Id love to share our investor deck with you if this fits your current consumer/e-commerce thesis.

Best,

Kim'
),
(
  'Kazuaki Fuchimoto',
  'https://www.linkedin.com/in/kazuaki-fuchimoto-546842223/',
  'Japan',
  'Series_A',
  'ARUM',
  '15:20',
  null,
  'Im Kazuaki Fuchimoto from ARUM. We are building advanced automation software designed to optimize manufacturing processes and increase industrial efficiency.

With significant commercial validation in Japan, ARUM is kicking off its Series A to accelerate product execution and global reach. Id welcome the chance to share our traction and pitch deck with your team.

Best regards,

Kazuaki'
),
(
  'Khalid Aljabari',
  'https://www.linkedin.com/in/khalid-aljabri-md-mba-07a74a116/',
  'United States',
  'Pre-seed',
  'Tandem Veterinary',
  '18:00',
  null,
  'Im Khalid, founder at Tandem Veterinary. Combining clinical expertise with modern health-tech solutions, we are transforming the way veterinary care is accessed and delivered.

Tandem Veterinary is raising a Pre-seed round to launch our core product and run our first clinical pilots. Given your interest in early-stage digital health and consumer tech, Id love to share our short pitch deck with you.

Best,

Khalid'
),
(
  'Peter Sarlin',
  'https://www.linkedin.com/in/psarlin?originalSubdomain=fi',
  'Finland',
  'Pre-seed',
  'Qutwo',
  '10:00',
  null,
  'Im Peter, founder at Qutwo. We are at the early stages of building a platform designed to tackle [Core Problem/Market Opportunity] using [Technology/Model].

Qutwo is currently assembling its Pre-seed round to build out our initial engineering team and deliver our MVP. Id value the opportunity to connect and share what were building.

Best regards,

Peter'
);