export function loadOpusSettings() {
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

export function applyGridCardShape() {
    const gallery = document.getElementById('gallery');
    const shape = localStorage.getItem('gridCardShape') || 'fit';
    if (gallery) {
        gallery.classList.toggle('grid-card-square', shape === 'square');
    }
}

function applySizeSetting() {
    const imageSize = document.getElementById('imageSize')?.value || '200';
    document.documentElement.style.setProperty('--image-size', `${imageSize}px`);
}

export function setupOpusSettings(onTableNeedsRefresh) {
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
    if (sortOrderTable) sortOrderTable.addEventListener('change', onTableNeedsRefresh);
    if (filterTagTable) filterTagTable.addEventListener('change', onTableNeedsRefresh);
}

