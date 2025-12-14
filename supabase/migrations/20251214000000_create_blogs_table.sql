-- Create blogs table
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_blogs_published ON blogs(published, published_at DESC);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_author ON blogs(author_id);

-- RLS Policies
-- Allow anyone to read published blogs
CREATE POLICY "Anyone can read published blogs"
ON blogs FOR SELECT
USING (published = true);

-- Allow admins to do everything
CREATE POLICY "Admins can manage blogs"
ON blogs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_blog_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;

  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM blogs WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- Create trigger to auto-generate slug
CREATE OR REPLACE FUNCTION set_blog_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_blog_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_blog_slug
BEFORE INSERT ON blogs
FOR EACH ROW
EXECUTE FUNCTION set_blog_slug();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_blog_updated_at
BEFORE UPDATE ON blogs
FOR EACH ROW
EXECUTE FUNCTION update_blog_updated_at();
