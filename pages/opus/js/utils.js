/**
 * ユーティリティ関数
 */

// YouTube動画IDを抽出
export function extractVideoId(url) {
    if (!url) return null;

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#\/]+)/  // YouTube Shorts
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

// URLからサムネイルURLを取得（YouTube / SoundCloud は同期で返せるもののみ）
export function getThumbnailFromUrl(url) {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractVideoId(url);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
    }
    if (url.includes('soundcloud.com')) {
        return null; // 非同期で oEmbed 取得するため
    }
    return url;
}

// アイテムからサムネイルURLを取得（優先順: assets.image > thumbnail > url）
export function getThumbnailUrlForItem(item) {
    if (item.assets && item.assets.image) return item.assets.image;
    if (item.thumbnail) return item.thumbnail;
    if (item.url) {
        const fromUrl = getThumbnailFromUrl(item.url);
        if (fromUrl) return fromUrl;
    }
    return '';
}

// 後方互換: getThumbnailUrl は getThumbnailUrlForItem の短い別名
export function getThumbnailUrl(item) {
    return getThumbnailUrlForItem(item);
}

// view-transition-name 用に ID をサニタイズ（CSS識別子として有効な形式に）
export function getViewTransitionName(id) {
    return 'item-' + String(id).replace(/[^a-zA-Z0-9-_]/g, '-');
}

// アイテムのクリックアクションを実行
// 優先: picture 画像 → wav / midi → url
export function executeAction(item) {
    if (item.type === 'picture') {
        const imgUrl = item.assets?.image || item.thumbnail;
        if (imgUrl) {
            window.open(imgUrl, '_blank');
            return;
        }
    }

    if (item.assets) {
        if (item.assets.wav) {
            window.open(`audioplayer.html?file=${encodeURIComponent(item.assets.wav)}`, '_blank');
            return;
        }
        if (item.assets.midi) {
            window.open(`midi.html?file=${encodeURIComponent(item.assets.midi)}`, '_blank');
            return;
        }
    }

    if (item.url) {
        window.open(item.url, '_blank');
    }
}

// 詳細パネルを表示（既存のUI向け）
export function showDetailPanel(item) {
    const panel = document.getElementById('detailPanel');
    if (!panel) return;

    const titleEl = panel.querySelector('.detail-title');
    const typeEl = panel.querySelector('.detail-type');
    const summaryEl = panel.querySelector('.detail-summary');
    const dateEl = panel.querySelector('.detail-date');
    const tagsEl = panel.querySelector('.detail-tags');

    titleEl.textContent = item.title || item.id;
    typeEl.textContent = item.type || '';
    typeEl.className = 'detail-type';

    if (item.summary) {
        summaryEl.textContent = item.summary;
        summaryEl.style.display = 'block';
    } else {
        summaryEl.style.display = 'none';
    }

    if (item.date) {
        dateEl.textContent = item.date;
        dateEl.style.display = 'block';
    } else {
        dateEl.style.display = 'none';
    }

    if (item.tags && item.tags.length > 0) {
        tagsEl.innerHTML = '';
        item.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'detail-tag';
            tagSpan.textContent = tag;
            tagsEl.appendChild(tagSpan);
        });
        tagsEl.style.display = 'flex';
    } else {
        tagsEl.style.display = 'none';
    }

    panel.classList.add('active');

    // パネルにホバーした時も表示を維持
    // 既存のイベントリスナーを削除してから追加（重複を防ぐ）
    const existingEnterHandler = panel._mouseEnterHandler;
    const existingLeaveHandler = panel._mouseLeaveHandler;

    if (existingEnterHandler) {
        panel.removeEventListener('mouseenter', existingEnterHandler);
    }
    if (existingLeaveHandler) {
        panel.removeEventListener('mouseleave', existingLeaveHandler);
    }

    panel._mouseEnterHandler = () => {
        if (window.hidePanelTimeout) {
            clearTimeout(window.hidePanelTimeout);
            window.hidePanelTimeout = null;
        }
    };

    panel._mouseLeaveHandler = () => {
        window.hidePanelTimeout = setTimeout(() => {
            hideDetailPanel();
            window.hidePanelTimeout = null;
        }, 200);
    };

    panel.addEventListener('mouseenter', panel._mouseEnterHandler);
    panel.addEventListener('mouseleave', panel._mouseLeaveHandler);
}

// 詳細パネルを非表示
export function hideDetailPanel() {
    const panel = document.getElementById('detailPanel');
    if (panel) {
        panel.classList.remove('active');
    }
}

