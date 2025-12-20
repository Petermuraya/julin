import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-forwarded-for",
};

type ContactPayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
  subject?: string;
};

// Rate limit settings
const WINDOW_MINUTES = Number(Deno.env.get('CONTACT_RATE_LIMIT_WINDOW_MINUTES') || '60'); // minutes
const MAX_SUBMISSIONS_PER_WINDOW = Number(Deno.env.get('CONTACT_RATE_LIMIT_MAX') || '5');

async function handleRequest(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Basic validation
  if (!body?.email || !body?.message || !body?.name || !body?.phone) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }

  // Check recent submissions by email, phone, or IP
  const windowAgo = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { data: recentByEmail, error: errEmail } = await supabase
    .from('contact_submissions')
    .select('id')
    .eq('email', body.email)
    .gte('created_at', windowAgo)
    .limit(1);

  if (errEmail) {
    console.error('Rate check error (email):', errEmail);
  }

  const { data: recentByPhone, error: errPhone } = await supabase
    .from('contact_submissions')
    .select('id')
    .eq('phone', body.phone)
    .gte('created_at', windowAgo)
    .limit(1);

  if (errPhone) {
    console.error('Rate check error (phone):', errPhone);
  }

  const { data: recentByIp, error: errIp } = await supabase
    .from('contact_submissions')
    .select('id')
    .eq('sender_ip', ip)
    .gte('created_at', windowAgo)
    .limit(1);

  if (errIp) {
    console.error('Rate check error (ip):', errIp);
  }

  if ((recentByEmail && recentByEmail.length > 0) || (recentByPhone && recentByPhone.length > 0) || (recentByIp && recentByIp.length > 0)) {
    return new Response(JSON.stringify({ error: 'Too many submissions, please try again later' }), { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }

  // Insert using service role key
  const { data: insertData, error: insertErr } = await supabase
    .from('contact_submissions')
    .insert([{ name: body.name, email: body.email, phone: body.phone, message: body.message, subject: body.subject || null, sender_ip: ip }]);

  if (insertErr) {
    console.error('Insert error:', insertErr);
    return new Response(JSON.stringify({ error: 'Failed to submit' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true, id: insertData?.[0]?.id || null }), { status: 201, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

Deno.serve(handleRequest);
