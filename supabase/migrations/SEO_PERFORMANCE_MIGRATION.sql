-- Supabase Migrations for SEO & Performance Optimizations
-- This file contains all necessary schema additions for the optimized platform

-- Add indexes for faster queries on property listing pages
CREATE INDEX IF NOT EXISTS idx_properties_status_created 
ON properties(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_type_price 
ON properties(property_type, price);

CREATE INDEX IF NOT EXISTS idx_properties_location 
ON properties(location);

CREATE INDEX IF NOT EXISTS idx_buyer_inquiries_property 
ON buyer_inquiries(property_id);

CREATE INDEX IF NOT EXISTS idx_buyer_inquiries_created 
ON buyer_inquiries(created_at DESC);

-- Add site_messages table for contact form persistence
CREATE TABLE IF NOT EXISTS site_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new', -- new, read, responded, archived
  source VARCHAR(50) DEFAULT 'contact_form', -- contact_form, inquiry_follow_up, etc
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for site_messages
ALTER TABLE site_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert messages
CREATE POLICY "Allow anonymous to insert messages"
ON site_messages FOR INSERT
WITH CHECK (true);

-- Allow authenticated admin to view all messages
CREATE POLICY "Allow admin to view messages"
ON site_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Add indexes for site_messages
CREATE INDEX IF NOT EXISTS idx_site_messages_status 
ON site_messages(status);

CREATE INDEX IF NOT EXISTS idx_site_messages_created 
ON site_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_messages_email 
ON site_messages(email);

-- Add view_count to properties for analytics
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add page_views table for tracking analytics
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for page_views (everyone can insert)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous to insert page views"
ON page_views FOR INSERT
WITH CHECK (true);

-- Add index for page_views
CREATE INDEX IF NOT EXISTS idx_page_views_property_created 
ON page_views(property_id, created_at DESC);

-- Add performance column to track which properties convert best
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS last_inquired_at TIMESTAMPTZ;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS inquiry_count INTEGER DEFAULT 0;

-- Trigger to update properties.inquiry_count when new inquiry created
CREATE OR REPLACE FUNCTION update_property_inquiry_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties 
  SET inquiry_count = inquiry_count + 1,
      last_inquired_at = now()
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inquiry_count
AFTER INSERT ON buyer_inquiries
FOR EACH ROW
EXECUTE FUNCTION update_property_inquiry_count();

-- Add featured properties capability
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Create index for featured properties
CREATE INDEX IF NOT EXISTS idx_properties_featured 
ON properties(is_featured, created_at DESC);

-- Add search optimization columns
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update search vector when property is created/updated
CREATE OR REPLACE FUNCTION update_property_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_vector
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION update_property_search_vector();

-- Create GiST index for full-text search
CREATE INDEX IF NOT EXISTS idx_properties_search_vector 
ON properties USING GiST(search_vector);

-- Update existing properties' search vectors
UPDATE properties 
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C');

-- Create materialized view for homepage featured properties
CREATE OR REPLACE VIEW featured_properties_view AS
SELECT 
  id,
  title,
  price,
  location,
  property_type,
  description,
  seller_name,
  seller_phone,
  status,
  created_at,
  inquiry_count,
  is_featured
FROM properties
WHERE status = 'approved'
  AND (is_featured OR inquiry_count > 5)
ORDER BY 
  CASE WHEN is_featured THEN 0 ELSE 1 END,
  inquiry_count DESC,
  created_at DESC
LIMIT 50;

-- Permissions for featured_properties_view
ALTER TABLE featured_properties_view OWNER TO authenticated;

-- Add tracking for site analytics (optional, comment out if not needed)
CREATE TABLE IF NOT EXISTS site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50), -- page_view, property_view, inquiry_submitted, etc
  metric_value INTEGER DEFAULT 1,
  property_id UUID REFERENCES properties(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

-- Enable RLS for site_analytics
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous to insert analytics
CREATE POLICY "Allow anonymous to insert analytics"
ON site_analytics FOR INSERT
WITH CHECK (true);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_site_analytics_metric_created 
ON site_analytics(metric_type, created_at DESC);

-- Add comment to properties table
COMMENT ON TABLE properties IS 'Core table for property listings - indexed for fast queries, search_vector for full-text search, inquiry tracking for analytics';
