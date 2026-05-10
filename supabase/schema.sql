-- Ampere Database Schema

-- Products being marketed
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  url             TEXT NOT NULL,
  pitch           TEXT NOT NULL,
  audience        TEXT NOT NULL,
  pain_point      TEXT NOT NULL,
  differentiator  TEXT NOT NULL,
  conversion_goal TEXT DEFAULT 'free_trial',
  tone            TEXT DEFAULT 'warm_helpful',
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Platform connections per product
CREATE TABLE platform_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  credentials     JSONB,
  posting_freq    TEXT DEFAULT 'daily',
  optimal_times   TEXT[] DEFAULT ARRAY['08:00', '12:00', '18:00'],
  active          BOOLEAN DEFAULT TRUE,
  connected_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Reddit subreddits to monitor
CREATE TABLE reddit_monitors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
  subreddit       TEXT NOT NULL,
  keywords        TEXT[] NOT NULL,
  active          BOOLEAN DEFAULT TRUE,
  last_checked    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Reddit threads that triggered monitoring
CREATE TABLE reddit_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id      UUID REFERENCES reddit_monitors(id),
  product_id      UUID REFERENCES products(id),
  thread_id       TEXT UNIQUE NOT NULL,
  thread_title    TEXT NOT NULL,
  thread_body     TEXT,
  thread_url      TEXT NOT NULL,
  subreddit       TEXT NOT NULL,
  thread_age_hrs  NUMERIC,
  draft_reply     TEXT,
  status          TEXT DEFAULT 'pending',
  urgency         TEXT DEFAULT 'normal',
  posted_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- All content in the approval queue
CREATE TABLE content_queue (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID REFERENCES products(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL,
  content_type      TEXT NOT NULL,
  body              TEXT NOT NULL,
  image_url         TEXT,
  image_prompt      TEXT,
  link              TEXT,
  utm_params        JSONB,
  status            TEXT DEFAULT 'pending',
  urgency           TEXT DEFAULT 'normal',
  predicted_eng     INTEGER DEFAULT 3,
  scheduled_for     TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  posted_at         TIMESTAMPTZ,
  buffer_post_id    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Performance tracking
CREATE TABLE content_performance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID REFERENCES content_queue(id),
  product_id      UUID REFERENCES products(id),
  platform        TEXT NOT NULL,
  clicks          INTEGER DEFAULT 0,
  signups         INTEGER DEFAULT 0,
  conversions     INTEGER DEFAULT 0,
  mrr_added       NUMERIC DEFAULT 0,
  tracked_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword/angle performance
CREATE TABLE content_patterns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id),
  platform        TEXT NOT NULL,
  angle           TEXT NOT NULL,
  avg_clicks      NUMERIC DEFAULT 0,
  avg_signups     NUMERIC DEFAULT 0,
  sample_size     INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly insight reports
CREATE TABLE weekly_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id),
  week_of         DATE NOT NULL,
  posts_published INTEGER DEFAULT 0,
  total_clicks    INTEGER DEFAULT 0,
  signups         INTEGER DEFAULT 0,
  conversions     INTEGER DEFAULT 0,
  mrr_added       NUMERIC DEFAULT 0,
  best_content_id UUID REFERENCES content_queue(id),
  recommendations TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Email sequences
CREATE TABLE email_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id),
  name            TEXT NOT NULL,
  trigger         TEXT NOT NULL,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  delay_hours     INTEGER DEFAULT 0,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Email sends
CREATE TABLE email_sends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     UUID REFERENCES email_sequences(id),
  recipient_email TEXT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  opened          BOOLEAN DEFAULT FALSE,
  clicked         BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_queue_status ON content_queue(status);
CREATE INDEX idx_queue_product ON content_queue(product_id);
CREATE INDEX idx_queue_scheduled ON content_queue(scheduled_for);
CREATE INDEX idx_reddit_status ON reddit_threads(status);
CREATE INDEX idx_performance_product ON content_performance(product_id);
CREATE INDEX idx_performance_content ON content_performance(content_id);
CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_platform_connections_product ON platform_connections(product_id);
CREATE INDEX idx_reddit_monitors_product ON reddit_monitors(product_id);

-- Row Level Security (enable after connecting Clerk user IDs)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
