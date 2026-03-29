import './nav.js';

const params = new URLSearchParams(window.location.search);
const id = (params.get('id') || '').trim();

const titleEl = document.getElementById('articleViewTitle');
const bodyHost = document.getElementById('articleView');
const loadingEl = document.getElementById('articleViewBody');

async function run() {
  if (!id || !titleEl || !bodyHost) {
    if (bodyHost) bodyHost.innerHTML = '<p class="article-view-error">id がありません。</p>';
    return;
  }

  let meta = null;
  try {
    const res = await fetch('/pages/article/data/articles.json', { cache: 'no-store' });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) meta = list.find((a) => a && a.id === id);
    }
  } catch (_) {}

  if (!meta || !meta.file) {
    if (loadingEl) loadingEl.textContent = '記事が見つかりません。';
    else bodyHost.innerHTML = '<p class="article-view-error">記事が見つかりません。</p>';
    return;
  }

  const displayTitle = meta.title || meta.id;
  titleEl.textContent = displayTitle;
  document.title = `${displayTitle} - natʇsu`;

  const mdPath = `/pages/article/assets/${encodeURIComponent(meta.file)}`;
  try {
    const mdRes = await fetch(mdPath, { cache: 'no-store' });
    if (!mdRes.ok) throw new Error(String(mdRes.status));
    const md = await mdRes.text();
    const html = typeof marked !== 'undefined' && marked.parse ? marked.parse(md) : `<pre>${escapeHtml(md)}</pre>`;
    bodyHost.innerHTML = `<div class="article-prose">${html}</div>`;
  } catch (e) {
    console.error(e);
    bodyHost.innerHTML = '<p class="article-view-error">本文を読み込めませんでした。</p>';
  }
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

run();
