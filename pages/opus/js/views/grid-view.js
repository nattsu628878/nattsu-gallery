/**
 * Grid View（シンプル版）
 *
 * スキーマ: id（必須）, title, 画像（assets.image / thumbnail / url から取得）
 * 順番はランダム。段ごとに左右交互の無限横スクロール。
 * ホバーでタイトルを小さく表示。詳細窓はなし。
 */

import { extractVideoId, getThumbnailUrlForItem, getViewTransitionName, executeAction } from '../utils.js';

const ITEMS_PER_ROW = 5;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {HTMLElement} container
 * @param {{}} [options] - 未使用（Grid は id/title/image のみ・ランダム順）
 * @param {Array} [items]
 */
export async function renderGrid(container, options = {}, items = null) {
  if (!container) {
    console.error('Grid View: containerが存在しません');
    return;
  }

  container.innerHTML = '<p class="loading-msg">Loading...</p>';
  container.style.display = 'flex';

  try {
    let data = items;
    if (!Array.isArray(data)) {
      const response = await fetch('/pages/opus/data/items.json');
      if (!response.ok) throw new Error(`データの読み込みに失敗しました: ${response.status} ${response.statusText}`);
      data = await response.json();
    }
    if (!Array.isArray(data)) throw new Error('データが配列形式ではありません');

    const filtered = data.filter((item) => item.id);
    const shuffled = shuffle(filtered);

    container.innerHTML = '';

    if (shuffled.length === 0) {
      container.innerHTML = '<p class="empty-msg">No data</p>';
      return;
    }

    const rows = [];
    for (let i = 0; i < shuffled.length; i += ITEMS_PER_ROW) {
      rows.push(shuffled.slice(i, i + ITEMS_PER_ROW));
    }

    rows.forEach((rowItems, rowIndex) => {
      const row = document.createElement('div');
      row.className = 'grid-row ' + (rowIndex % 2 === 0 ? 'grid-row--right' : 'grid-row--left');

      const track = document.createElement('div');
      track.className = 'grid-row-track';
      rowItems.forEach((item) => {
        track.appendChild(createMediaCard(item, rowIndex, false));
      });
      rowItems.forEach((item) => {
        track.appendChild(createMediaCard(item, rowIndex, true));
      });

      row.appendChild(track);
      container.appendChild(row);
    });
  } catch (error) {
    console.error('Grid View エラー:', error);
    container.style.display = 'block';
    container.innerHTML = `<p style="color: #f44336;">エラー: ${error.message}</p>`;
  }
}

/**
 * @param {boolean} duplicate - 無限スクロール用の複製列（View Transition / a11y 用に区別）
 */
function createMediaCard(item, rowIndex, duplicate = false) {
  const card = document.createElement('div');
  card.className = 'media-card';
  card.setAttribute('data-id', item.id);
  if (!duplicate) {
    card.style.viewTransitionName = getViewTransitionName(item.id);
  } else {
    card.setAttribute('aria-hidden', 'true');
  }

  const thumbnail = document.createElement('div');
  thumbnail.className = 'thumbnail';

  const thumbnailUrl = getThumbnailUrlForItem(item);
  const img = document.createElement('img');
  img.alt = item.title || item.id;
  img.loading = 'lazy';

  if (thumbnailUrl) {
    img.src = thumbnailUrl;
  } else {
    img.src = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="225">
        <rect fill="#f0f0f0" width="400" height="225"/>
        <text fill="#999" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".35em">${(item.title || item.id).toString().slice(0, 20)}</text>
      </svg>
    `)}`;
  }

  img.onerror = function () {
    // maxresdefault が存在しない動画があるため、YouTube は hqdefault にフォールバック
    if (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be'))) {
      const videoId = extractVideoId(item.url);
      if (videoId && this.src && this.src.includes('maxresdefault')) {
        this.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        return;
      }
    }
    this.src = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="225">
        <rect fill="#f0f0f0" width="400" height="225"/>
        <text fill="#999" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".35em">${(item.title || item.id).toString().slice(0, 20)}</text>
      </svg>
    `)}`;
  };

  thumbnail.appendChild(img);
  card.appendChild(thumbnail);

  const titleEl = document.createElement('div');
  titleEl.className = 'grid-card-title';
  titleEl.textContent = item.title || item.id;
  card.appendChild(titleEl);

  card.addEventListener('click', () => executeAction(item));

  return card;
}

