const STORAGE_KEY = 'opusTypeFilter';

/** @typedef {{ movie: boolean, picture: boolean }} TypeFilterState */

const DEFAULT_STATE = { movie: true, picture: true };

function parseStoredState(raw) {
    if (!raw) return { ...DEFAULT_STATE };
    try {
        const o = JSON.parse(raw);
        return {
            movie: o.movie !== false,
            picture: o.picture !== false,
        };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

/** @returns {TypeFilterState} */
export function getTypeFilterState() {
    return parseStoredState(localStorage.getItem(STORAGE_KEY));
}

/** @param {Partial<TypeFilterState>} next */
export function saveTypeFilterState(next) {
    const merged = { ...getTypeFilterState(), ...next };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

/**
 * @param {object} item
 * @returns {'movie'|'picture'}
 */
export function getItemKind(item) {
    const t = item && item.type;
    if (t === 'movie') return 'movie';
    return 'picture';
}

/**
 * @param {object[]} items
 * @param {TypeFilterState} state
 */
export function filterItemsByType(items, state) {
    const allowed = new Set();
    if (state.movie) allowed.add('movie');
    if (state.picture) allowed.add('picture');
    if (allowed.size === 0) return [];
    return items.filter((item) => allowed.has(getItemKind(item)));
}

export function syncTypeFilterButtons() {
    const state = getTypeFilterState();
    document.querySelectorAll('[data-type-filter]').forEach((btn) => {
        const key = btn.getAttribute('data-type-filter');
        if (key !== 'movie' && key !== 'picture') return;
        const on = state[key];
        btn.classList.toggle('filter-toggle--on', on);
        btn.classList.toggle('filter-toggle--off', !on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

/**
 * @param {() => void} onChange
 */
export function setupTypeFilter(onChange) {
    document.querySelectorAll('[data-type-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-type-filter');
            if (key !== 'movie' && key !== 'picture') return;
            const state = getTypeFilterState();
            const next = { ...state, [key]: !state[key] };
            saveTypeFilterState(next);
            syncTypeFilterButtons();
            onChange();
        });
    });
    syncTypeFilterButtons();
}
