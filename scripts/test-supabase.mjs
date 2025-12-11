import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment.');
  process.exit(2);
}

const supabase = createClient(url, key);

async function main() {
  try {
    const { data, error } = await supabase.from('properties').select('id').limit(1);
    if (error) {
      console.error('Supabase query error:', error.message || error);
      process.exit(3);
    }
    console.log('Connection ok — sample data:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(4);
  }
}

main();
