-- Page Views table for lightweight analytics tracking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path);

-- RLS: allow anonymous inserts (tracking happens before login)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated (service role) can read
CREATE POLICY "Authenticated can read page views"
  ON page_views FOR SELECT
  TO authenticated
  USING (true);
