import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  // runtime check helps avoid confusing errors during migration
  // (leave as no-op in production where envs are present)
  // eslint-disable-next-line no-console
  console.warn('Supabase browser client missing env vars');
}

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
