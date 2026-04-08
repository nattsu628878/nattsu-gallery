import './nav.js';

const listEl = document.getElementById('articleList');

async function loadArticles() {
  if (!listEl) return;
  listEl.innerHTML = '<li class="article-list-loading">…</li>';
  try {
    const res = await fetch('./data/articles.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      listEl.innerHTML = '<li class="article-list-empty">（記事なし）</li>';
      return;
    }
    const sorted = [...data].sort((a, b) => {
      const da = (a.date || '').trim();
      const db = (b.date || '').trim();
      return db.localeCompare(da);
    });
    listEl.innerHTML = sorted
      .map((a) => {
        const id = escape(a.id || '');
        const title = escape(a.title || a.id || '');
        const date = escape((a.date || '').trim() || '—');
        const href = `./view.html?id=${encodeURIComponent(a.id)}`;
        return `<li class="article-list-item"><a class="article-list-link" href="${href}">${title}</a><span class="article-list-meta">${date}</span></li>`;
      })
      .join('');
  } catch (e) {
    console.error(e);
    listEl.innerHTML = '<li class="article-list-error">一覧を読み込めませんでした。</li>';
  }
}

function escape(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

loadArticles();
