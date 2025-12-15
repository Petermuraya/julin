import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment.');
  process.exit(2);
}

const supabase = createClient(url, key);

async function createBlogsTable() {
  try {
    // First check if table exists
    const { data, error: checkError } = await supabase.from('blogs').select('id').limit(1);
    if (!checkError) {
      console.log('Blogs table already exists');
      return;
    }

    // If table doesn't exist, create it using RPC or direct SQL
    // Since we can't run DDL directly, we'll use the admin key if available
    console.log('Blogs table does not exist. Please create it manually in Supabase dashboard with this SQL:');

    const sql = `
-- Create blogs table
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
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

-- Allow anyone to read published blogs
CREATE POLICY "Anyone can read published blogs" ON blogs FOR SELECT USING (published = true);
    `;

    console.log(sql);

  } catch (err) {
    console.error('Error:', err);
  }
}

createBlogsTable();