import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServerClient';

export async function POST(request) {
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const { data, error } = await supabaseServer.from('chat_conversations').upsert([payload], { onConflict: 'conversation_id' }).select();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Server upsert conversation error', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }
    return NextResponse.json({ result: data || null });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('POST /api/chat/conversations error', err);
    return NextResponse.json({ error: 'Failed to upsert conversation' }, { status: 500 });
  }
}
