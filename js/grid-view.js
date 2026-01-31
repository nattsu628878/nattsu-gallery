/**
 * Grid View
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
 * - assets.md: Markdownファイルのリンク（プレビュー表示用）
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

import { extractVideoId, showDetailPanel, hideDetailPanel, executeAction } from './utils.js';

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

// Grid View用のサムネイルURL取得
function getGridThumbnailUrl(item) {
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
export async function renderGrid(container, options = {}, items = null) {
    if (!container) {
        console.error('Grid View: containerが存在しません');
        return;
    }

    const sortOrder = options.sortOrder || 'asc';
    const filterType = options.filterType || '';

    container.innerHTML = '<p class="loading-msg">Loading...</p>';
    container.style.display = 'grid';

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

        console.log('Grid View: データ取得成功', filtered.length, '件');

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-msg">No data</p>';
            return;
        }

        filtered.forEach(item => {
            const card = createMediaCard(item);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Grid View エラー:', error);
        container.style.display = 'block';
        container.innerHTML = `<p style="color: #f44336;">エラー: ${error.message}</p>`;
    }
}

function createMediaCard(item) {
    const card = document.createElement('div');
    card.className = 'media-card';
    if (item.type) {
        card.setAttribute('data-type', item.type);
    }
    
    // サムネイル
    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail';
    
    // サムネイルURLを取得
    const thumbnailUrl = getGridThumbnailUrl(item);
    
    const img = document.createElement('img');
    img.alt = item.title || item.id;
    img.loading = 'lazy';
    
    // サムネイルの読み込み処理
    if (thumbnailUrl) {
        img.src = thumbnailUrl;
    } else {
        // プレースホルダー
        img.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="225">
                <rect fill="#f0f0f0" width="400" height="225"/>
                <text fill="#999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" 
                      x="50%" y="50%" text-anchor="middle">${item.type || item.id}</text>
            </svg>
        `)}`;
    }
    
    // 画像読み込みエラー時の処理
    img.onerror = function() {
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="225">
                            <rect fill="#f0f0f0" width="400" height="225"/>
                            <text fill="#999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" 
                                  x="50%" y="50%" text-anchor="middle">${item.type || item.id}</text>
                        </svg>
                    `)}`;
                });
            return;
        }
        
        // その他のエラーの場合、プレースホルダーを表示
        this.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="225">
                <rect fill="#f0f0f0" width="400" height="225"/>
                <text fill="#999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" 
                      x="50%" y="50%" text-anchor="middle">${item.type || item.id}</text>
            </svg>
        `)}`;
    };
    
    thumbnail.appendChild(img);
    
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
                    img.src = data.thumbnail_url;
                }
            })
            .catch(err => {
                console.log('SoundCloud thumbnail fetch failed:', err);
            });
    }
    
    card.appendChild(thumbnail);
    
    // ホバー時に詳細パネルを表示
    card.addEventListener('mouseenter', () => {
        // グローバルなタイムアウトをクリア（他のカードからの移行時も含む）
        if (window.hidePanelTimeout) {
            clearTimeout(window.hidePanelTimeout);
            window.hidePanelTimeout = null;
        }
        showDetailPanel(item);
    });
    
    card.addEventListener('mouseleave', () => {
        // グローバルなタイムアウトを設定
        window.hidePanelTimeout = setTimeout(() => {
            const panel = document.getElementById('detailPanel');
            if (panel && !panel.matches(':hover')) {
                hideDetailPanel();
            }
            window.hidePanelTimeout = null;
        }, 200);
    });
    
    // クリック時の動作（複数のアセットタイプがある場合の優先順位: wav > midi > md > url）
    card.addEventListener('click', () => {
        executeAction(item);
    });
    
    return card;
}
