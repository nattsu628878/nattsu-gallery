/**
 * Simple View - IDのみを表示する超簡易ビュー
 * 
 * 受け付けるJSONスキーマ:
 * {
 *   "id": string (必須)
 * }
 */

export async function renderSimple(container) {
    if (!container) {
        console.error('Simple View: containerが存在しません');
        return;
    }
    
    container.innerHTML = '<p class="loading-msg">Loading...</p>';
    container.style.display = 'block';
    container.className = 'simple-view';
    
    try {
        // items.jsonからデータを取得
        const response = await fetch('data/items.json');
        if (!response.ok) {
            throw new Error(`データの読み込みに失敗しました: ${response.status} ${response.statusText}`);
        }
        
        const items = await response.json();
        
        if (!Array.isArray(items)) {
            throw new Error('データが配列形式ではありません');
        }
        
        console.log('Simple View: データ取得成功', items.length, '件');
        
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<p class="empty-msg">No data</p>';
            return;
        }
        
        const list = document.createElement('ul');
        list.className = 'simple-list';
        
        items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'simple-item';
            listItem.textContent = item.id;
            list.appendChild(listItem);
        });
        
        container.appendChild(list);
    } catch (error) {
        console.error('Simple View エラー:', error);
        container.innerHTML = `<p style="color: #f44336;">エラー: ${error.message}</p>`;
    }
}
