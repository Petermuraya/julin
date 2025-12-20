-- Add nullable bedrooms column to properties to match client expectations
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS bedrooms INTEGER;

-- Optional index to help queries filtering by bedrooms
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms
ON public.properties(bedrooms);
