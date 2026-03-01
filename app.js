/**
 * メインアプリケーション
 * 各ビューを統合して管理
 */
import { renderSimple } from './js/simple-view.js';
import { renderGrid } from './js/grid-view.js';
import { renderTable } from './js/table-view.js';

let currentItems = [];
let currentVisibleContainer = null;

// ビューに応じてヘッダーコントロールの表示を切り替え
function updateHeaderForView(view) {
    const headerGrid = document.getElementById('headerGridControls');
    const headerTable = document.getElementById('headerTableControls');
    if (headerGrid) headerGrid.style.display = view === 'grid' ? 'flex' : 'none';
    if (headerTable) headerTable.style.display = view === 'table' ? 'flex' : 'none';
}

// アイテム一覧からタグのユニーク値を取得し、Table の絞り込み用 select を更新
function updateTagsFilterOptions(items) {
    const tags = [...new Set((items || []).flatMap(item => item.tags || []).filter(Boolean))].sort();
    const optionsHtml = '<option value="">All</option>' + tags.map(t => {
        const esc = String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<option value="${esc}">${esc}</option>`;
    }).join('');
    const filterTagTable = document.getElementById('filterTagTable');
    if (filterTagTable) {
        const current = filterTagTable.value;
        filterTagTable.innerHTML = optionsHtml;
        if (tags.includes(current)) filterTagTable.value = current;
    }
}

function getContainerForView(view) {
    const gallery = document.getElementById('gallery');
    const tableView = document.getElementById('tableView');
    const simpleView = document.getElementById('simpleView');
    if (view === 'table') return tableView;
    if (view === 'simple') return simpleView;
    return gallery;
}

function getDisplayForView(view) {
    if (view === 'table' || view === 'simple') return 'block';
    return 'grid';
}

function runExitAnimation(container) {
    return new Promise((resolve) => {
        if (!container) {
            resolve();
            return;
        }
        let done = false;
        function finish() {
            if (done) return;
            done = true;
            container.classList.remove('view-exit-active');
            container.style.display = 'none';
            resolve();
        }
        container.classList.add('view-exit-active');
        container.addEventListener('transitionend', finish, { once: true });
        setTimeout(finish, 250);
    });
}

function runEnterAnimation(container) {
    if (!container) return;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            container.classList.add('view-enter-active');
            const items = container.querySelectorAll('.media-card, tbody tr, .simple-item');
            const stagger = 0.03;
            items.forEach((el, i) => {
                el.style.animationDelay = `${i * stagger}s`;
            });
            container.classList.add('view-animate-items');
            const totalDuration = 250 + items.length * stagger * 1000 + 450;
            setTimeout(() => {
                container.classList.remove('view-enter', 'view-enter-active', 'view-animate-items');
                items.forEach(el => { el.style.animationDelay = ''; });
            }, totalDuration);
        });
    });
}

// ビューをレンダリング
async function renderView(view) {
    const gallery = document.getElementById('gallery');
    const tableView = document.getElementById('tableView');
    const simpleView = document.getElementById('simpleView');
    const targetContainer = getContainerForView(view);
    const display = getDisplayForView(view);

    if (currentVisibleContainer && currentVisibleContainer !== targetContainer) {
        await runExitAnimation(currentVisibleContainer);
    } else {
        if (gallery) gallery.style.display = 'none';
        if (tableView) tableView.style.display = 'none';
        if (simpleView) simpleView.style.display = 'none';
    }

    updateHeaderForView(view);
    targetContainer.style.display = display;
    targetContainer.classList.add('view-enter');

    try {
        if (view === 'table') {
            if (tableView) {
                const items = await fetchItems();
                currentItems = items;
                updateTagsFilterOptions(items);
                const sortOrder = document.getElementById('sortOrderTable')?.value || 'asc';
                const filterTag = document.getElementById('filterTagTable')?.value || '';
                await renderTable(tableView, { sortOrder, filterTag }, items);
            }
        } else if (view === 'simple') {
            if (simpleView) {
                await renderSimple(simpleView);
            }
        } else {
            if (gallery) {
                const items = await fetchItems();
                currentItems = items;
                await renderGrid(gallery, {}, items);
                applyGridCardShape();
            }
        }
        currentVisibleContainer = targetContainer;
        runEnterAnimation(targetContainer);
    } catch (error) {
        console.error('ビューのレンダリングエラー:', error);
        targetContainer.classList.remove('view-enter');
        targetContainer.style.display = display;
        targetContainer.innerHTML = `<p style="color: #f44336;">エラー: ${error.message}</p>`;
        currentVisibleContainer = targetContainer;
    }
}

async function fetchItems() {
    const response = await fetch('data/items.json');
    if (!response.ok) throw new Error(`データの読み込みに失敗しました: ${response.status} ${response.statusText}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('データが配列形式ではありません');
    return data;
}

// データを読み込んで表示
async function loadData() {
    try {
        const currentView = localStorage.getItem('currentView') || 'grid';
        await renderView(currentView);
        applySizeSetting();
    } catch (error) {
        console.error('loadData エラー:', error);
    }
}

// 画像サイズの適用のみ（背景色は削除）
function loadSettings() {
    const imageSize = localStorage.getItem('imageSize') || '200';
    const imageSizeInput = document.getElementById('imageSize');
    if (imageSizeInput) {
        imageSizeInput.value = imageSize;
        const imageSizeValue = document.getElementById('imageSizeValue');
        if (imageSizeValue) imageSizeValue.textContent = imageSize;
    }
    applySizeSetting();
    const gridCardShape = localStorage.getItem('gridCardShape') || 'fit';
    const gridCardShapeEl = document.getElementById('gridCardShape');
    if (gridCardShapeEl) gridCardShapeEl.value = gridCardShape;
}

function applyGridCardShape() {
    const gallery = document.getElementById('gallery');
    const shape = localStorage.getItem('gridCardShape') || 'fit';
    if (gallery) {
        gallery.classList.toggle('grid-card-square', shape === 'square');
    }
}

function applySizeSetting() {
    const imageSize = document.getElementById('imageSize')?.value || '200';
    document.documentElement.style.setProperty('--image-size', imageSize + 'px');
}

function setupSettings() {
    const imageSizeInput = document.getElementById('imageSize');
    if (imageSizeInput) {
        imageSizeInput.addEventListener('input', (e) => {
            const value = e.target.value;
            const imageSizeValue = document.getElementById('imageSizeValue');
            if (imageSizeValue) imageSizeValue.textContent = value;
            localStorage.setItem('imageSize', value);
            applySizeSetting();
        });
    }
    const gridCardShapeEl = document.getElementById('gridCardShape');
    if (gridCardShapeEl) {
        gridCardShapeEl.addEventListener('change', () => {
            const value = gridCardShapeEl.value || 'fit';
            localStorage.setItem('gridCardShape', value);
            applyGridCardShape();
        });
    }

    const sortOrderTable = document.getElementById('sortOrderTable');
    const filterTagTable = document.getElementById('filterTagTable');
    if (sortOrderTable) {
        sortOrderTable.addEventListener('change', () => {
            if (localStorage.getItem('currentView') === 'table') reRenderTable();
        });
    }
    if (filterTagTable) {
        filterTagTable.addEventListener('change', () => {
            if (localStorage.getItem('currentView') === 'table') reRenderTable();
        });
    }
}

// View Transitions APIでソート/フィルタ変更時のアイテム移動アニメーションを実行
function withViewTransition(updateFn) {
    if (typeof document.startViewTransition === 'function') {
        document.startViewTransition(updateFn);
    } else {
        updateFn();
    }
}

function reRenderGrid() {
    const gallery = document.getElementById('gallery');
    if (!gallery || currentItems.length === 0) return;
    withViewTransition(async () => {
        await renderGrid(gallery, {}, currentItems);
    });
}

function reRenderTable() {
    const tableView = document.getElementById('tableView');
    if (!tableView || currentItems.length === 0) return;
    const sortOrder = document.getElementById('sortOrderTable')?.value || 'asc';
    const filterTag = document.getElementById('filterTagTable')?.value || '';
    withViewTransition(async () => {
        await renderTable(tableView, { sortOrder, filterTag }, currentItems);
    });
}

function setupViewToggle() {
    const gridViewBtn = document.getElementById('gridViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const simpleViewBtn = document.getElementById('simpleViewBtn');

    const currentView = localStorage.getItem('currentView') || 'grid';

    [gridViewBtn, tableViewBtn, simpleViewBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    if (currentView === 'table' && tableViewBtn) tableViewBtn.classList.add('active');
    else if (currentView === 'simple' && simpleViewBtn) simpleViewBtn.classList.add('active');
    else if (gridViewBtn) gridViewBtn.classList.add('active');

    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', async () => {
            [gridViewBtn, tableViewBtn, simpleViewBtn].forEach(btn => { if (btn) btn.classList.remove('active'); });
            gridViewBtn.classList.add('active');
            localStorage.setItem('currentView', 'grid');
            await renderView('grid');
        });
    }
    if (tableViewBtn) {
        tableViewBtn.addEventListener('click', async () => {
            [gridViewBtn, tableViewBtn, simpleViewBtn].forEach(btn => { if (btn) btn.classList.remove('active'); });
            tableViewBtn.classList.add('active');
            localStorage.setItem('currentView', 'table');
            await renderView('table');
        });
    }
    if (simpleViewBtn) {
        simpleViewBtn.addEventListener('click', async () => {
            [gridViewBtn, tableViewBtn, simpleViewBtn].forEach(btn => { if (btn) btn.classList.remove('active'); });
            simpleViewBtn.classList.add('active');
            localStorage.setItem('currentView', 'simple');
            await renderView('simple');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupSettings();
    setupViewToggle();
    loadData();
});
