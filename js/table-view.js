/**
 * Table View
 * 
 * 受け付けるJSONスキーマ:
 * {
 *   "id": string (必須),
 *   "url"?: string,                    // サムネイル取得用のURL
 *   "thumbnail"?: string,              // 直接サムネイルURL（urlがない場合のフォールバック）
 *   "title"?: string,
 *   "type"?: string,
 *   "date"?: string,
 *   "tags"?: string[],
 *   "assets"?: {
 *     "image"?: string,                // サムネイル画像（thumbnailより優先）
 *     "md"?: string,                   // Markdownファイルのリンク（content配下）
 *     "midi"?: string,                 // MIDIファイルのリンク（将来の拡張）
 *     "wav"?: string                   // WAVファイルのリンク（将来の拡張）
 *   }
 * }
 * 
 * 使用フィールド:
 * - id: 必須
 * - url: サムネイル取得用のURL（YouTube、SoundCloudなど）
 * - thumbnail: 直接サムネイルURL
 * - title: タイトル表示
 * - type: タイプ表示
 * - date: 日付表示
 * - tags: タグ表示
 * - assets.image: サムネイル画像（最優先）
 * - assets.md: Markdownファイルのリンク（ツールチップ表示用）
 * 
 * サムネイル取得ロジック:
 * 1. assets.imageが指定されている場合、それを最優先
 * 2. thumbnailが直接指定されている場合、それを使用
 * 3. urlが指定されている場合、urlの種類に応じて自動取得
 *    - YouTube: https://www.youtube.com/watch?v=VIDEO_ID → https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
 *    - SoundCloud: oEmbed APIから取得
 *    - その他: urlをそのまま使用
 * 4. どちらもない場合、プレースホルダーを表示
 */

import { extractVideoId, executeAction } from './utils.js';

// URLからサムネイルURLを取得
function getThumbnailFromUrl(url) {
    if (!url) return null;
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractVideoId(url);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
    }
    
    // SoundCloud
    if (url.includes('soundcloud.com')) {
        // oEmbed APIから取得（非同期）
        return null; // 非同期処理が必要なため、後で処理
    }
    
    // その他のURLはそのまま使用
    return url;
}

// Table View用のサムネイルURL取得
function getTableThumbnailUrl(item) {
    // 1. assets.imageが最優先
    if (item.assets && item.assets.image) {
        return item.assets.image;
    }
    
    // 2. thumbnailが直接指定されている場合
    if (item.thumbnail) {
        return item.thumbnail;
    }
    
    // 3. urlから取得を試みる
    if (item.url) {
        const thumbnailUrl = getThumbnailFromUrl(item.url);
        if (thumbnailUrl) {
            return thumbnailUrl;
        }
    }
    
    // 4. どちらもない場合、空文字を返す（プレースホルダーを表示）
    return '';
}

/**
 * @param {HTMLElement} container
 * @param {{ sortOrder?: 'asc'|'desc', filterType?: string }} [options]
 * @param {Array} [items] - 渡されない場合は fetch する
 */
export async function renderTable(container, options = {}, items = null) {
    if (!container) {
        console.error('Table View: containerが存在しません');
        return;
    }

    const sortOrder = options.sortOrder || 'asc';
    const filterType = options.filterType || '';

    container.innerHTML = '<p class="loading-msg">Loading...</p>';
    container.style.display = 'block';

    try {
        let data = items;
        if (!Array.isArray(data)) {
            const response = await fetch('data/items.json');
            if (!response.ok) {
                throw new Error(`データの読み込みに失敗しました: ${response.status} ${response.statusText}`);
            }
            data = await response.json();
        }
        if (!Array.isArray(data)) {
            throw new Error('データが配列形式ではありません');
        }

        // Type で絞り込み
        let filtered = filterType
            ? data.filter(item => item.type === filterType)
            : data;

        // 追加順 / 追加順（逆）
        if (sortOrder === 'desc') {
            filtered = [...filtered].reverse();
        }

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
                    <th>Type</th>
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

// view-transition-name用にIDをサニタイズ（CSS識別子として有効な形式に）
function getViewTransitionName(id) {
    return 'item-' + String(id).replace(/[^a-zA-Z0-9-_]/g, '-');
}

function createTableRow(item) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', item.id);
    row.style.viewTransitionName = getViewTransitionName(item.id);
    
    // サムネイル
    const thumbnailCell = document.createElement('td');
    const thumbnailImg = document.createElement('img');
    const thumbnailUrl = getTableThumbnailUrl(item);
    
    if (thumbnailUrl) {
        thumbnailImg.src = thumbnailUrl;
    } else {
        // プレースホルダー
        thumbnailImg.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="45">
                <rect fill="#f0f0f0" width="80" height="45"/>
                <text fill="#999" font-family="sans-serif" font-size="10" dy="10.5" font-weight="bold" 
                      x="50%" y="50%" text-anchor="middle">${item.type || item.id}</text>
            </svg>
        `)}`;
    }
    
    thumbnailImg.alt = item.title || item.id;
    thumbnailImg.className = 'table-thumbnail';
    
    // 画像読み込みエラー時の処理
    thumbnailImg.onerror = function() {
        // YouTubeの場合は、hqdefaultを試す
        if (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be'))) {
            const videoId = extractVideoId(item.url);
            if (videoId) {
                this.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                return;
            }
        }
        
        // SoundCloudの場合は、oEmbed APIから取得を試す
        if (item.url && item.url.includes('soundcloud.com')) {
            fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(item.url)}&format=json`)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('SoundCloud API error');
                })
                .then(data => {
                    if (data.thumbnail_url) {
                        this.src = data.thumbnail_url;
                    } else {
                        this.onerror();
                    }
                })
                .catch(err => {
                    console.log('SoundCloud thumbnail fetch failed:', err);
                    this.src = `data:image/svg+xml,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="45">
                            <rect fill="#f0f0f0" width="80" height="45"/>
                            <text fill="#999" font-family="sans-serif" font-size="10" dy="10.5" font-weight="bold" 
                                  x="50%" y="50%" text-anchor="middle">${item.type || item.id}</text>
                        </svg>
                    `)}`;
                });
            return;
        }
        
        // その他のエラーの場合、プレースホルダーを表示
        this.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="45">
                <rect fill="#f0f0f0" width="80" height="45"/>
                <text fill="#999" font-family="sans-serif" font-size="10" dy="10.5" font-weight="bold" 
                      x="50%" y="50%" text-anchor="middle">${item.type || item.id}</text>
            </svg>
        `)}`;
    };
    
    thumbnailCell.appendChild(thumbnailImg);
    
    // SoundCloudのサムネイルを非同期で取得（初期表示後に更新）
    if (item.url && item.url.includes('soundcloud.com') && !item.thumbnail && !item.assets?.image) {
        fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(item.url)}&format=json`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('SoundCloud API error');
            })
            .then(data => {
                if (data.thumbnail_url) {
                    thumbnailImg.src = data.thumbnail_url;
                }
            })
            .catch(err => {
                console.log('SoundCloud thumbnail fetch failed:', err);
            });
    }
    
    // タイトル
    const titleCell = document.createElement('td');
    titleCell.textContent = item.title || item.id;
    titleCell.className = 'table-title';
    
    // タイプ
    const typeCell = document.createElement('td');
    typeCell.textContent = item.type || '-';
    typeCell.className = 'table-type';
    
    // 日付
    const dateCell = document.createElement('td');
    dateCell.textContent = item.date || '-';
    dateCell.className = 'table-date';
    
    // タグ
    const tagsCell = document.createElement('td');
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'table-tags';
    if (item.tags && item.tags.length > 0) {
        item.tags.forEach(tag => {
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
    row.appendChild(typeCell);
    row.appendChild(dateCell);
    row.appendChild(tagsCell);
    
    // クリック時の動作（複数のアセットタイプがある場合の優先順位: wav > midi > md > url）
    row.addEventListener('click', () => {
        executeAction(item);
    });
    
    // assets.mdがある場合は、ツールチップとして表示
    if (item.assets && item.assets.md) {
        // Markdownファイルを読み込んでツールチップに表示
        fetch(item.assets.md)
            .then(response => response.text())
            .then(markdown => {
                const preview = markdown.substring(0, 200);
                row.title = preview;
            })
            .catch(err => console.log('Markdown tooltip fetch failed:', err));
    }
    
    return row;
}
