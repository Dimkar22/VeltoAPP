export async function searchUsers(query) {
  const supabase = window.veltoSupabase;

  if (!supabase) {
    throw new Error('Supabase не подключён');
  }

  const term = String(query ?? '').trim();

  if (term.length < 2) {
    return [];
  }

  const currentUserId = window.VELTO_AUTH_USER?.id;

  let request = supabase
    .from('public_profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${term}%`)
    .limit(20);

  if (currentUserId) {
    request = request.neq('id', currentUserId);
  }

  const { data, error } = await request;

  if (error) {
    console.error('Ошибка поиска Velto:', error.message);
    throw error;
  }

  return data ?? [];
}
