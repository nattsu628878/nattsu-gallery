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
// 複数のアセットタイプがある場合の優先順位:
// 1. picture: 画像を新しいタブで表示
// 2. wav (音声ファイル)
// 3. midi (MIDIファイル)
// 4. md (Markdown説明文)
// 5. url (外部リンク)
export function executeAction(item) {
    // 画像1枚: 画像URLを新しいタブで開く
    if (item.type === 'picture') {
        const imgUrl = item.assets?.image || item.thumbnail;
        if (imgUrl) {
            window.open(imgUrl, '_blank');
            return;
        }
    }

    if (item.assets) {
        // 優先順位: wav > midi > md
        if (item.assets.wav) {
            window.open(`audioplayer.html?file=${encodeURIComponent(item.assets.wav)}`, '_blank');
            return;
        }
        if (item.assets.midi) {
            window.open(`midi.html?file=${encodeURIComponent(item.assets.midi)}`, '_blank');
            return;
        }
        if (item.assets.md) {
            let url = `article.html?file=${encodeURIComponent(item.assets.md)}`;
            if (item.title) {
                url += `&title=${encodeURIComponent(item.title)}`;
            }
            window.open(url, '_blank');
            return;
        }
    }

    // それ以外はurlを開く
    if (item.url) {
        window.open(item.url, '_blank');
    }
}

// 詳細パネルを表示
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
    
    // summaryまたはassets.mdから表示（assets.mdがある場合はファイルを読み込む）
    if (item.assets && item.assets.md) {
        fetch(item.assets.md)
            .then(response => response.text())
            .then(markdown => {
                // Markdownの最初の数行を取得（見出しを除く）
                const lines = markdown.split('\n').filter(line => {
                    line = line.trim();
                    return line && !line.startsWith('#') && line.length > 0;
                });
                const preview = lines.slice(0, 3).join(' ').substring(0, 200) + '...';
                summaryEl.textContent = preview;
                summaryEl.style.display = 'block';
            })
            .catch(err => {
                console.log('Markdown summary fetch failed:', err);
                summaryEl.style.display = 'none';
            });
    } else if (item.summary) {
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
