import { supabaseServer } from '../../infrastructure/supabase/client.server';

export async function getUserById(id: string) {
  const { data, error } = await supabaseServer.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function listUsers(limit = 50) {
  const { data, error } = await supabaseServer.from('users').select('*').limit(limit);
  if (error) throw error;
  return data ?? [];
}
