import { renderSimple } from '../views/simple-view.js';
import { renderGrid } from '../views/grid-view.js';
import { renderTable } from '../views/table-view.js';
import { filterItemsByType, getTypeFilterState } from '../features/filters/type-filter.js';

export const VALID_VIEWS = ['grid', 'table', 'simple'];

export function updateHeaderForView(view) {
    const headerGrid = document.getElementById('headerGridControls');
    const headerTable = document.getElementById('headerTableControls');
    if (headerGrid) headerGrid.style.display = view === 'grid' ? 'flex' : 'none';
    if (headerTable) headerTable.style.display = view === 'table' ? 'flex' : 'none';
}

function updateTagsFilterOptions(items) {
    const tags = [...new Set((items || []).flatMap(item => item.tags || []).filter(Boolean))].sort();
    const optionsHtml = '<option value="">All</option>' + tags.map((t) => {
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
                items.forEach((el) => { el.style.animationDelay = ''; });
            }, totalDuration);
        });
    });
}

async function fetchItems() {
    const response = await fetch('/pages/opus/data/items.json');
    if (!response.ok) throw new Error(`データの読み込みに失敗しました: ${response.status} ${response.statusText}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('データが配列形式ではありません');
    return data;
}

export function createOpusRenderer() {
    let currentItems = [];
    let currentVisibleContainer = null;

    async function renderOpusView(view, options = {}) {
        const { applyGridCardShape } = options;
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
                    const filtered = filterItemsByType(items, getTypeFilterState());
                    await renderTable(tableView, { sortOrder, filterTag }, filtered);
                }
            } else if (view === 'simple') {
                if (simpleView) {
                    const items = await fetchItems();
                    currentItems = items;
                    const filtered = filterItemsByType(items, getTypeFilterState());
                    await renderSimple(simpleView, {}, filtered);
                }
            } else if (gallery) {
                const items = await fetchItems();
                currentItems = items;
                const filtered = filterItemsByType(items, getTypeFilterState());
                await renderGrid(gallery, {}, filtered);
                if (applyGridCardShape) applyGridCardShape();
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

    async function reRenderTable() {
        const tableView = document.getElementById('tableView');
        if (!tableView || currentItems.length === 0) return;
        const sortOrder = document.getElementById('sortOrderTable')?.value || 'asc';
        const filterTag = document.getElementById('filterTagTable')?.value || '';
        const filtered = filterItemsByType(currentItems, getTypeFilterState());
        await renderTable(tableView, { sortOrder, filterTag }, filtered);
    }

    return { renderOpusView, reRenderTable };
}

