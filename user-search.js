
import { supabase } from './supabase.js';

export async function searchUsers(query) {
  const term = query?.trim();

  if (!term || term.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${term}%`)
    .limit(20);

  if (error) {
    console.error('Ошибка поиска пользователей:', error.message);
    throw error;
  }

  return data ?? [];
}
