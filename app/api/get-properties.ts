import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[api/get-properties] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow simple CORS for browsers during migration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Server misconfigured' });
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[api/get-properties] supabase error', error);
      res.status(500).json({ error: error.message || error });
      return;
    }

    res.status(200).json({ properties: data || [] });
  } catch (err) {
    console.error('[api/get-properties] unexpected', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
