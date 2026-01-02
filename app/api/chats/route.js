import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServerClient';

export async function GET() {
  try {
    const { data: convs, error: convErr } = await supabaseServer.from('chat_conversations').select('*').order('started_at', { ascending: false }).limit(200);
    if (!convErr && Array.isArray(convs) && convs.length > 0) {
      return NextResponse.json({ conversations: convs });
    }

    const { data, error } = await supabaseServer.rpc('get_chat_sessions', {});
    if (error) {
      const { data: msgs, error: e2 } = await supabaseServer.from('chat_messages').select('session_id, max(created_at) as last_at').group('session_id').order('last_at', { ascending: false }).limit(200);
      if (e2) return NextResponse.json({ error: e2.message || e2 }, { status: 500 });
      return NextResponse.json({ sessions: msgs });
    }
    return NextResponse.json({ sessions: data });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/chats error', err);
    return NextResponse.json({ error: 'Failed to list chat sessions' }, { status: 500 });
  }
}
