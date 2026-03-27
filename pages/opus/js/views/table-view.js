/**
 * Table View
 *
 * 必須スキーマ: id, title, date, tags（type は廃止・tags に統合）
 * ソート: 日付順 / 日付逆順
 * 絞り込み: タグ（選択したタグを含むアイテムのみ表示）
 */

import { extractVideoId, getThumbnailUrlForItem, getViewTransitionName, executeAction } from '../utils.js';

/**
 * @param {HTMLElement} container
 * @param {{ sortOrder?: 'asc'|'desc', filterTag?: string }} [options]
 * @param {Array} [items]
 */
export async function renderTable(container, options = {}, items = null) {
    if (!container) {
        console.error('Table View: containerが存在しません');
        return;
    }

    const sortOrder = options.sortOrder || 'asc';
    const filterTag = (options.filterTag || '').trim();

    container.innerHTML = '<p class="loading-msg">Loading...</p>';
    container.style.display = 'block';

    try {
        let data = items;
        if (!Array.isArray(data)) {
            const response = await fetch('/pages/opus/data/items.json');
            if (!response.ok) {
                throw new Error(`データの読み込みに失敗しました: ${response.status} ${response.statusText}`);
            }
            data = await response.json();
        }
        if (!Array.isArray(data)) {
            throw new Error('データが配列形式ではありません');
        }

        // タグで絞り込み（指定タグを1つ以上含むアイテム）
        let filtered = filterTag
            ? data.filter(item => Array.isArray(item.tags) && item.tags.includes(filterTag))
            : data;

        // 日付でソート（日付文字列で比較。未設定は末尾）
        filtered = [...filtered].sort((a, b) => {
            const da = a.date || '';
            const db = b.date || '';
            const cmp = da.localeCompare(db);
            return sortOrder === 'desc' ? -cmp : cmp;
        });

        console.log('Table View: データ取得成功', filtered.length, '件');

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-msg">No data</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Thumbnail</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Tags</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;

        const tbody = table.querySelector('tbody');
        filtered.forEach(item => {
            const row = createTableRow(item);
            tbody.appendChild(row);
        });

        container.appendChild(table);
    } catch (error) {
        console.error('Table View エラー:', error);
        container.innerHTML = `<p style="color: #f44336;">エラー: ${error.message}</p>`;
    }
}

function createTableRow(item) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', item.id);
    row.style.viewTransitionName = getViewTransitionName(item.id);

    // サムネイル
    const thumbnailCell = document.createElement('td');
    const thumbnailImg = document.createElement('img');
    const thumbnailUrl = getThumbnailUrlForItem(item);

    if (thumbnailUrl) {
        thumbnailImg.src = thumbnailUrl;
    } else {
        thumbnailImg.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="45">
                <rect fill="#f0f0f0" width="80" height="45"/>
                <text fill="#999" font-family="sans-serif" font-size="10" dy="10.5" font-weight="bold"
                      x="50%" y="50%" text-anchor="middle">${(item.title || item.id).toString().slice(0, 8)}</text>
            </svg>
        `)}`;
    }

    thumbnailImg.alt = item.title || item.id;
    thumbnailImg.className = 'table-thumbnail';

    thumbnailImg.onerror = function() {
        if (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be'))) {
            const videoId = extractVideoId(item.url);
            if (videoId) {
                this.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                return;
            }
        }
        if (item.url && item.url.includes('soundcloud.com')) {
            fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(item.url)}&format=json`)
                .then(response => response.ok ? response.json() : Promise.reject())
                .then(data => { if (data.thumbnail_url) this.src = data.thumbnail_url; })
                .catch(() => {});
            return;
        }
        this.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="45">
                <rect fill="#f0f0f0" width="80" height="45"/>
                <text fill="#999" font-family="sans-serif" font-size="10" x="50%" y="50%" text-anchor="middle" dy=".35em">-</text>
            </svg>
        `)}`;
    };

    thumbnailCell.appendChild(thumbnailImg);

    if (item.url && item.url.includes('soundcloud.com') && !item.thumbnail && !item.assets?.image) {
        fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(item.url)}&format=json`)
            .then(response => response.ok ? response.json() : Promise.reject())
            .then(data => { if (data.thumbnail_url) thumbnailImg.src = data.thumbnail_url; })
            .catch(() => {});
    }

    // タイトル
    const titleCell = document.createElement('td');
    titleCell.textContent = item.title || item.id;
    titleCell.className = 'table-title';

    // 日付
    const dateCell = document.createElement('td');
    dateCell.textContent = item.date || '-';
    dateCell.className = 'table-date';

    // タグ（type は廃止、tags に統合。旧 type も tags に含めている場合はここに表示）
    const tagsCell = document.createElement('td');
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'table-tags';
    if (item.tags && item.tags.length > 0) {
        [...item.tags].sort((a, b) => String(a).localeCompare(String(b))).forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'table-tag';
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
        });
    } else {
        tagsContainer.textContent = '-';
    }
    tagsCell.appendChild(tagsContainer);

    row.appendChild(thumbnailCell);
    row.appendChild(titleCell);
    row.appendChild(dateCell);
    row.appendChild(tagsCell);

    row.addEventListener('click', () => executeAction(item));

    if (item.assets && item.assets.md) {
        fetch(item.assets.md)
            .then(response => response.text())
            .then(markdown => { row.title = markdown.substring(0, 200); })
            .catch(() => {});
    }

    return row;
}

