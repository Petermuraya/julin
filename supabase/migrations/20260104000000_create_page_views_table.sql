-- Create table to record page views for analytics
-- Tracks basic page and timing info; no IP is recorded here.
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  url text NOT NULL,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index to speed up time-range queries
CREATE INDEX IF NOT EXISTS page_views_created_idx ON public.page_views (created_at);
CREATE INDEX IF NOT EXISTS page_views_path_idx ON public.page_views (path);
