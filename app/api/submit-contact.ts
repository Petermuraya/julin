import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-forwarded-for');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Server misconfigured' });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { name, email, phone, message, subject } = req.body || {};

  if (!name || !email || !phone || !message) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{ name, email, phone, message, subject: subject || null, sender_ip: ip }]);

    if (error) {
      console.error('[api/submit-contact] insert error', error);
      res.status(500).json({ error: 'Failed to submit' });
      return;
    }

    res.status(201).json({ success: true, id: data?.[0]?.id || null });
  } catch (err) {
    console.error('[api/submit-contact] unexpected', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
