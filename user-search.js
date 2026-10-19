
async function searchUsers(query) {
  const supabase = window.veltoSupabase;
  if (!supabase) throw new Error('Supabase не подключён');

  const term = query.trim();
  if (term.length < 2) return [];

  let request = supabase
    .from('public_profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${term}%`)
    .limit(20);

  const userId = window.VELTO_AUTH_USER?.id;
  if (userId) request = request.neq('id', userId);

  const { data, error } = await request;
  if (error) throw error;
  return data || [];
}

function createVeltoSearch() {
  if (document.getElementById('velto-user-search')) return;

  const style = document.createElement('style');
  style.textContent = `
    #velto-user-search {
      max-width: 480px; margin: 16px auto; padding: 16px;
      color: var(--text-color, inherit);
      font-family: Arial, sans-serif;
    }
    #velto-search-input {
      box-sizing: border-box; width: 100%; padding: 13px;
      border: 1px solid #28a86b; border-radius: 12px;
      background: transparent; color: inherit; font-size: 16px;
    }
    #velto-search-results { margin-top: 10px; }
    .velto-user-result {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; border-bottom: 1px solid #8884;
    }
    .velto-user-result img, .velto-avatar {
      width: 42px; height: 42px; border-radius: 50%;
      object-fit: cover; background: #28a86b;
    }
    .velto-avatar {
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold;
    }
    .velto-user-name { font-weight: bold; }
    .velto-user-handle { opacity: .7; font-size: 13px; }
    #velto-search-status { margin-top: 10px; opacity: .75; }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.id = 'velto-user-search';
  panel.innerHTML = `
    <h3>Поиск пользователей</h3>
    <input id="velto-search-input" type="search"
      placeholder="Введи имя пользователя..." autocomplete="off">
    <div id="velto-search-status">Введи минимум 2 символа</div>
    <div id="velto-search-results"></div>
  `;

  document.body.appendChild(panel);

  const input = panel.querySelector('#velto-search-input');
  const status = panel.querySelector('#velto-search-status');
  const results = panel.querySelector('#velto-search-results');

  let timer;

  input.addEventListener('input', () => {
    clearTimeout(timer);
    results.replaceChildren();

    const query = input.value.trim();
    if (query.length < 2) {
      status.textContent = 'Введи минимум 2 символа';
      return;
    }

    status.textContent = 'Ищем...';

    timer = setTimeout(async () => {
      try {
        const users = await searchUsers(query);

        if (input.value.trim() !== query) return;

        results.replaceChildren();
        status.textContent = users.length
          ? `Найдено пользователей: ${users.length}`
          : 'Пользователи не найдены';

        users.forEach(user => {
          const row = document.createElement('div');
          row.className = 'velto-user-result';

          if (user.avatar_url) {
            const img = document.createElement('img');
            img.src = user.avatar_url;
            img.alt = '';
            img.onerror = () => {
              const fallback = document.createElement('div');
              fallback.className = 'velto-avatar';
              fallback.textContent =
                (user.username || '?')[0].toUpperCase();
              img.replaceWith(fallback);
            };
            row.appendChild(img);
          } else {
            const avatar = document.createElement('div');
            avatar.className = 'velto-avatar';
            avatar.textContent =
              (user.username || '?')[0].toUpperCase();
            row.appendChild(avatar);
          }

          const info = document.createElement('div');
          const name = document.createElement('div');
          name.className = 'velto-user-name';
          name.textContent = user.display_name || user.username || 'Пользователь';

          const handle = document.createElement('div');
          handle.className = 'velto-user-handle';
          handle.textContent = '@' + (user.username || '');

          info.append(name, handle);
          row.appendChild(info);
          results.appendChild(row);
        });
      } catch (error) {
        status.textContent = 'Ошибка поиска. Проверь вход и настройки Supabase.';
        console.error('Velto search:', error);
      }
    }, 300);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createVeltoSearch);
} else {
  createVeltoSearch();
}
