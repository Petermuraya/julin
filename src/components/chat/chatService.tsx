import { supabase } from '@/integrations/supabase/client';
import { retry } from '@/lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
const SERVER_API = (import.meta.env.VITE_SERVER_API_URL || '').replace(/\/$/, '');

export async function restUpsertConversation(payload: Record<string, unknown>) {
  const body = { ...payload };
  if ('id' in body) delete body.id;

  if (SERVER_API) {
    const proxy = async () => {
      const res = await fetch(`${SERVER_API}/api/chat/conversations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`proxy upsert failed: ${res.status}`);
      return res.json().catch(() => null);
    };
    return retry(proxy, 3, 200);
  }

  const doUpsert = async () => {
    const { data, error } = await supabase.from('chat_conversations').upsert(body, { onConflict: 'conversation_id' }).select();
    if (error) throw error;
    return data;
  };
  return retry(doUpsert, 3, 200);
}

export async function restInsertMessage(payload: Record<string, unknown> | Array<Record<string, unknown>>) {
  if (SERVER_API) {
    const proxy = async () => {
      const res = await fetch(`${SERVER_API}/api/chat/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`proxy insert failed: ${res.status}`);
      return res.json().catch(() => null);
    };
    return retry(proxy, 3, 200);
  }

  const doInsert = async () => {
    const { data, error } = await supabase.from('chat_messages').insert(payload);
    if (error) throw error;
    return data;
  };
  return retry(doInsert, 3, 200);
}

export async function restPatchConversation(conversation_id: string, patch: Record<string, unknown>) {
  if (SERVER_API) {
    const res = await fetch(`${SERVER_API}/api/chat/conversations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id, ...patch })
    });
    if (!res.ok) throw new Error(`proxy patch failed: ${res.status}`);
    return res.json().catch(() => null);
  }

  const { data, error } = await supabase.from('chat_conversations').update(patch).eq('conversation_id', conversation_id).select();
  if (error) throw error;
  return data;
}

export type ChatResponse = { reply: string; properties?: any[]; session_id?: string; error?: string } | null;

export async function fetchReply(payload: Record<string, unknown>, timeout = 15000): Promise<ChatResponse> {
  const url = `${SUPABASE_URL}/functions/v1/chat`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`edge function error ${res.status}: ${txt}`);
    }
    return res.json().catch(() => null);
  } finally { clearTimeout(id); }
}

export default { restUpsertConversation, restInsertMessage, restPatchConversation, fetchReply };
