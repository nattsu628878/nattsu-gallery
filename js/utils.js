/**
 * ユーティリティ関数
 */

// YouTube動画IDを抽出
export function extractVideoId(url) {
    if (!url) return null;
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// サムネイルURLを取得する共通関数（後方互換性のため残す）
export function getThumbnailUrl(item) {
    // assets.imageを優先
    if (item.assets && item.assets.image) {
        return item.assets.image;
    }
    
    // 後方互換性: item.thumbnailがあれば使用
    return item.thumbnail || '';
}

// アイテムのクリックアクションを実行
// 複数のアセットタイプがある場合の優先順位:
// 1. wav (音声ファイル)
// 2. midi (MIDIファイル)
// 3. md (Markdown説明文)
// 4. url (外部リンク)
export function executeAction(item) {
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
            window.open(`article.html?file=${encodeURIComponent(item.assets.md)}`, '_blank');
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
