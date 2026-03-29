/**
 * Simple View - IDのみを表示する超簡易ビュー
 *
 * 受け付けるJSONスキーマ:
 * {
 *   "id": string (必須)
 * }
 */

/**
 * @param {HTMLElement} container
 * @param {{}} [options]
 * @param {Array|null} [items] - 渡せば fetch を省略（型フィルタ済み配列）
 */
export async function renderSimple(container, options = {}, items = null) {
    if (!container) {
        console.error('Simple View: containerが存在しません');
        return;
    }

    container.innerHTML = '<p class="loading-msg">Loading...</p>';
    container.style.display = 'block';
    container.className = 'simple-view';

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

        console.log('Simple View: データ取得成功', data.length, '件');

        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = '<p class="empty-msg">No data</p>';
            return;
        }

        const list = document.createElement('ul');
        list.className = 'simple-list';

        data.forEach(item => {
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

