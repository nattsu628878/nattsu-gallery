// YouTube動画IDを抽出
function extractVideoId(url) {
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

// メディアカードを生成
function createMediaCard(item) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.setAttribute('data-type', item.type);
    
    // サムネイル
    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail';
    const img = document.createElement('img');
    img.src = item.thumbnail;
    img.alt = item.title;
    img.onerror = function() {
        // 画像が読み込めない場合のプレースホルダー
        this.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="225">
                <rect fill="#f0f0f0" width="400" height="225"/>
                <text fill="#999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" 
                      x="50%" y="50%" text-anchor="middle">${item.type}</text>
            </svg>
        `)}`;
    };
    thumbnail.appendChild(img);
    
    // コンテンツ
    const content = document.createElement('div');
    content.className = 'content';
    
    // タイトル
    const title = document.createElement('h3');
    title.textContent = item.title;
    content.appendChild(title);
    
    // サマリー
    const summary = document.createElement('p');
    summary.className = 'summary';
    summary.textContent = item.summary;
    content.appendChild(summary);
    
    // メタ情報
    const meta = document.createElement('div');
    meta.className = 'meta';
    const type = document.createElement('span');
    type.className = 'type';
    type.textContent = item.type;
    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = item.date;
    meta.appendChild(type);
    meta.appendChild(date);
    content.appendChild(meta);
    
    // タグ
    const tags = document.createElement('div');
    tags.className = 'tags';
    item.tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tags.appendChild(tagEl);
    });
    content.appendChild(tags);
    
    // type別の追加表示
    if (item.type === 'movie' && item.assets.video) {
        const videoId = extractVideoId(item.assets.video);
        if (videoId) {
            const videoEmbed = document.createElement('div');
            videoEmbed.className = 'video-embed';
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            videoEmbed.appendChild(iframe);
            content.appendChild(videoEmbed);
        } else {
            const link = document.createElement('a');
            link.href = item.assets.video;
            link.target = '_blank';
            link.className = 'external-link';
            link.textContent = '▶ YouTubeで視聴';
            content.appendChild(link);
        }
    }
    
    if (item.type === 'music' && item.assets.audio) {
        const audioPlayer = document.createElement('div');
        audioPlayer.className = 'audio-player';
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = item.assets.audio;
        audio.textContent = 'お使いのブラウザは音声再生に対応していません。';
        audioPlayer.appendChild(audio);
        content.appendChild(audioPlayer);
    }
    
    if (item.type === 'write' && item.assets.content) {
        const link = document.createElement('a');
        // Markdownファイルの場合はarticle.htmlで表示
        if (item.assets.content.endsWith('.md')) {
            link.href = `article.html?file=${encodeURIComponent(item.assets.content)}`;
        } else {
            link.href = item.assets.content;
        }
        link.className = 'external-link';
        link.textContent = '📄 記事を読む';
        content.appendChild(link);
    }
    
    if (item.type === 'software') {
        const links = document.createElement('div');
        links.className = 'software-links';
        if (item.assets.repo) {
            const repoLink = document.createElement('a');
            repoLink.href = item.assets.repo;
            repoLink.target = '_blank';
            repoLink.className = 'external-link';
            repoLink.textContent = '🔗 GitHub';
            links.appendChild(repoLink);
        }
        if (item.assets.demo) {
            const demoLink = document.createElement('a');
            demoLink.href = item.assets.demo;
            demoLink.target = '_blank';
            demoLink.className = 'external-link';
            demoLink.textContent = '🌐 Demo';
            links.appendChild(demoLink);
        }
        if (links.children.length > 0) {
            content.appendChild(links);
        }
    }
    
    if (item.type === 'hardware' && item.assets.description) {
        const desc = document.createElement('p');
        desc.className = 'hardware-description';
        desc.textContent = item.assets.description;
        content.appendChild(desc);
    }
    
    card.appendChild(thumbnail);
    card.appendChild(content);
    
    return card;
}

// データを読み込んで表示
async function loadData() {
    try {
        const response = await fetch('data/items.json');
        if (!response.ok) {
            throw new Error('データの読み込みに失敗しました');
        }
        
        const items = await response.json();
        
        // 統計情報を更新
        const stats = document.getElementById('stats');
        const statItems = stats.querySelectorAll('.stat-value');
        statItems[0].textContent = items.length;
        statItems[1].textContent = new Set(items.map(item => item.type)).size;
        
        // ギャラリーを更新
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = '';
        
        items.forEach(item => {
            const card = createMediaCard(item);
            gallery.appendChild(card);
        });
    } catch (error) {
        console.error('エラー:', error);
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `<p style="color: #f44336;">エラー: ${error.message}</p>`;
    }
}

// ページ読み込み時にデータを読み込む
document.addEventListener('DOMContentLoaded', loadData);
