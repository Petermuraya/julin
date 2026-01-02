import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServerClient';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, phone, message, subject } = body || {};

    if (!name || !email || !phone || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    const { data, error } = await supabaseServer
      .from('contact_submissions')
      .insert([{ name, email, phone, message, subject: subject || null, sender_ip: ip }]);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[api/submit-contact] insert error', error);
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id || null }, { status: 201 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/submit-contact] unexpected', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
