import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../../lib/supabaseServerClient';

export async function GET(request, { params }) {
  try {
    const { session_id } = params;
    if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

    const { data, error } = await supabaseServer.from('chat_messages').select('*').eq('session_id', session_id).order('created_at', { ascending: true });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching messages', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/chats/:session_id error', err);
    return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 });
  }
}
