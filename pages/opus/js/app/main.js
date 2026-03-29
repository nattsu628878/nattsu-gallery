import { createOpusRenderer, VALID_VIEWS } from '../opus/opus-mode.js';
import { applyGridCardShape, loadOpusSettings, setupOpusSettings } from '../features/settings/opus-settings.js';
import { setupTypeFilter } from '../features/filters/type-filter.js';

let currentView = 'grid';

const opus = createOpusRenderer();

function getInitialView() {
    const params = new URLSearchParams(window.location.search);
    const viewFromQuery = params.get('view');
    const viewFromStorage = localStorage.getItem('currentView');
    if (VALID_VIEWS.includes(viewFromQuery)) return viewFromQuery;
    if (VALID_VIEWS.includes(viewFromStorage)) return viewFromStorage;
    return 'grid';
}

function updateViewButtons() {
    const gridViewBtn = document.getElementById('gridViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const simpleViewBtn = document.getElementById('simpleViewBtn');
    [gridViewBtn, tableViewBtn, simpleViewBtn].forEach((btn) => { if (btn) btn.classList.remove('active'); });
    if (currentView === 'table' && tableViewBtn) tableViewBtn.classList.add('active');
    else if (currentView === 'simple' && simpleViewBtn) simpleViewBtn.classList.add('active');
    else if (gridViewBtn) gridViewBtn.classList.add('active');
}

function syncViewQueryState(view) {
    const params = new URLSearchParams(window.location.search);
    params.set('view', view);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', next);
}

async function renderOpusView() {
    updateViewButtons();
    syncViewQueryState(currentView);
    await opus.renderOpusView(currentView, { applyGridCardShape });
}

function setupViewToggle() {
    const gridViewBtn = document.getElementById('gridViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const simpleViewBtn = document.getElementById('simpleViewBtn');
    updateViewButtons();

    const onViewClick = async (view) => {
        currentView = view;
        localStorage.setItem('currentView', currentView);
        await renderOpusView();
    };

    if (gridViewBtn) gridViewBtn.addEventListener('click', async () => onViewClick('grid'));
    if (tableViewBtn) tableViewBtn.addEventListener('click', async () => onViewClick('table'));
    if (simpleViewBtn) simpleViewBtn.addEventListener('click', async () => onViewClick('simple'));
}

function setupModeToggle() {
    const modeOpusBtn = document.getElementById('modeOpusBtn');
    const modeAboutBtn = document.getElementById('modeAboutBtn');
    const modeNtBtn = document.getElementById('modeNtBtn');
    if (modeOpusBtn) modeOpusBtn.addEventListener('click', async () => renderOpusView());
    if (modeAboutBtn) modeAboutBtn.addEventListener('click', () => { window.location.href = '/pages/aboutme/'; });
    if (modeNtBtn) modeNtBtn.addEventListener('click', () => { window.location.href = '/pages/nt/'; });
}

let hasAnimatedHeaderRow = false;

function animateOpusHeaderRowIn(force = false) {
    const headerRow = document.getElementById('opusHeaderRow');
    if (!headerRow) return;
    if (hasAnimatedHeaderRow && !force) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        headerRow.classList.remove('is-hidden');
        hasAnimatedHeaderRow = true;
        return;
    }
    headerRow.classList.add('is-hidden');
    // reflowで初期状態を確定してから解除し、遷移経路に関わらずトランジションを発火させる
    void headerRow.offsetWidth;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            headerRow.classList.remove('is-hidden');
            hasAnimatedHeaderRow = true;
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    animateOpusHeaderRowIn();
    currentView = getInitialView();
    loadOpusSettings();
    setupOpusSettings(async () => {
        if (currentView === 'table') await opus.reRenderTable();
    });
    setupViewToggle();
    setupModeToggle();
    setupTypeFilter(async () => {
        await renderOpusView();
    });
    await renderOpusView();
});

window.addEventListener('pageshow', () => {
    // 通常遷移・bfcache復帰どちらでも再生可能にする
    animateOpusHeaderRowIn(true);
});

