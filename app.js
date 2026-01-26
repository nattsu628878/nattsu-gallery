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
    
    // オーバーレイテキスト（最小限の情報）
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const title = document.createElement('div');
    title.className = 'overlay-title';
    title.textContent = item.title;
    overlay.appendChild(title);
    
    const type = document.createElement('div');
    type.className = 'overlay-type';
    type.textContent = item.type;
    overlay.appendChild(type);
    
    thumbnail.appendChild(overlay);
    
    card.appendChild(thumbnail);
    
    return card;
}

let currentItems = [];

// テーブル行を生成
function createTableRow(item) {
    const row = document.createElement('tr');
    
    // サムネイル
    const thumbnailCell = document.createElement('td');
    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = item.thumbnail;
    thumbnailImg.alt = item.title;
    thumbnailImg.className = 'table-thumbnail';
    thumbnailImg.onerror = function() {
        this.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="45">
                <rect fill="#f0f0f0" width="80" height="45"/>
                <text fill="#999" font-family="sans-serif" font-size="10" dy="10.5" font-weight="bold" 
                      x="50%" y="50%" text-anchor="middle">${item.type}</text>
            </svg>
        `)}`;
    };
    thumbnailCell.appendChild(thumbnailImg);
    
    // タイトル
    const titleCell = document.createElement('td');
    titleCell.textContent = item.title;
    titleCell.className = 'table-title';
    
    // タイプ
    const typeCell = document.createElement('td');
    typeCell.textContent = item.type;
    typeCell.className = 'table-type';
    
    // 日付
    const dateCell = document.createElement('td');
    dateCell.textContent = item.date;
    dateCell.className = 'table-date';
    
    // タグ
    const tagsCell = document.createElement('td');
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'table-tags';
    item.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'table-tag';
        tagSpan.textContent = tag;
        tagsContainer.appendChild(tagSpan);
    });
    tagsCell.appendChild(tagsContainer);
    
    row.appendChild(thumbnailCell);
    row.appendChild(titleCell);
    row.appendChild(typeCell);
    row.appendChild(dateCell);
    row.appendChild(tagsCell);
    
    return row;
}

// データを読み込んで表示
async function loadData() {
    try {
        const response = await fetch('data/items.json');
        if (!response.ok) {
            throw new Error('データの読み込みに失敗しました');
        }
        
        currentItems = await response.json();
        
        // 現在のビューに応じて表示
        const currentView = localStorage.getItem('currentView') || 'grid';
        renderView(currentView);
        
        // データ読み込み後に設定を再適用
        const imageSize = document.getElementById('imageSize').value;
        const backgroundColor = document.getElementById('backgroundColor').value;
        const fontSize = document.getElementById('fontSize').value;
        applySettings(imageSize, backgroundColor, fontSize);
    } catch (error) {
        console.error('エラー:', error);
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `<p style="color: #f44336;">エラー: ${error.message}</p>`;
    }
}

// ビューをレンダリング
function renderView(view) {
    const gallery = document.getElementById('gallery');
    const tableView = document.getElementById('tableView');
    const tableBody = document.getElementById('tableBody');
    
    if (view === 'table') {
        gallery.style.display = 'none';
        tableView.style.display = 'block';
        
        // テーブルを更新
        tableBody.innerHTML = '';
        currentItems.forEach(item => {
            const row = createTableRow(item);
            tableBody.appendChild(row);
        });
    } else {
        gallery.style.display = 'grid';
        tableView.style.display = 'none';
        
        // ギャラリーを更新
        gallery.innerHTML = '';
        currentItems.forEach(item => {
            const card = createMediaCard(item);
            gallery.appendChild(card);
        });
    }
}

// 設定を読み込んで適用
function loadSettings() {
    const imageSize = localStorage.getItem('imageSize') || '200';
    const backgroundColor = localStorage.getItem('backgroundColor') || '#f5f5f5';
    const fontSize = localStorage.getItem('fontSize') || '1';
    
    // UI要素に設定値を反映
    document.getElementById('imageSize').value = imageSize;
    document.getElementById('imageSizeValue').textContent = imageSize;
    document.getElementById('backgroundColor').value = backgroundColor;
    document.getElementById('fontSize').value = fontSize;
    document.getElementById('fontSizeValue').textContent = fontSize;
    
    // 設定を適用
    applySettings(imageSize, backgroundColor, fontSize);
}

// 設定を適用
function applySettings(imageSize, backgroundColor, fontSize) {
    // 画像サイズを適用
    document.documentElement.style.setProperty('--image-size', imageSize + 'px');
    const gallery = document.querySelector('.gallery');
    if (gallery) {
        gallery.style.gridTemplateColumns = `repeat(auto-fill, minmax(${imageSize}px, 1fr))`;
    }
    
    // 背景色を適用
    document.body.style.backgroundColor = backgroundColor;
    
    // 文字サイズを適用（CSS変数を使用）
    document.documentElement.style.setProperty('--font-size-multiplier', fontSize);
}

// 設定変更イベント
function setupSettings() {
    const imageSizeInput = document.getElementById('imageSize');
    const backgroundColorInput = document.getElementById('backgroundColor');
    const fontSizeInput = document.getElementById('fontSize');
    
    imageSizeInput.addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('imageSizeValue').textContent = value;
        localStorage.setItem('imageSize', value);
        applySettings(value, backgroundColorInput.value, fontSizeInput.value);
    });
    
    backgroundColorInput.addEventListener('input', (e) => {
        const value = e.target.value;
        localStorage.setItem('backgroundColor', value);
        applySettings(imageSizeInput.value, value, fontSizeInput.value);
    });
    
    fontSizeInput.addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('fontSizeValue').textContent = value;
        localStorage.setItem('fontSize', value);
        applySettings(imageSizeInput.value, backgroundColorInput.value, value);
    });
}

// ビュー切り替えの設定
function setupViewToggle() {
    const gridViewBtn = document.getElementById('gridViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    
    const currentView = localStorage.getItem('currentView') || 'grid';
    if (currentView === 'table') {
        gridViewBtn.classList.remove('active');
        tableViewBtn.classList.add('active');
    }
    
    gridViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        localStorage.setItem('currentView', 'grid');
        renderView('grid');
    });
    
    tableViewBtn.addEventListener('click', () => {
        tableViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        localStorage.setItem('currentView', 'table');
        renderView('table');
    });
}

// ページ読み込み時にデータを読み込む
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupSettings();
    setupViewToggle();
    loadData();
});
