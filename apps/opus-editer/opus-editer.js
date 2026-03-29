/** Opus Editer */
(function () {
  const API = '/api';
  let currentMode = 'picture';
  let existingItems = [];
  let pictureData = null;
  let movieFileData = null;
  let movieFileObjectUrlForPreview = null;

  const form = document.getElementById('detailForm');
  const idInput = document.getElementById('id');
  const idHint = document.getElementById('idHint');
  const statusEl = document.getElementById('status');
  const itemsTableBody = document.getElementById('itemsTableBody');
  const detailPanelTitle = document.getElementById('detailPanelTitle');
  const addRowBtn = document.getElementById('addRowBtn');
  let selectedIndex = null;
  let isNewRow = false;
  let isSyncingFromItem = false;
  const pictureDrop = document.getElementById('pictureDrop');
  const pictureFile = document.getElementById('pictureFile');
  const picturePreview = document.getElementById('picturePreview');
  const movieUrl = document.getElementById('movieUrl');
  const movieFile = document.getElementById('movieFile');
  const moviePreviewEl = document.getElementById('moviePreview');

  try {
    const oldDrafts = localStorage.getItem('writer_drafts');
    if (oldDrafts && !localStorage.getItem('opus_editer_drafts')) {
      localStorage.setItem('opus_editer_drafts', oldDrafts);
    }
  } catch (_) {}

  function setDateToday() {
    const d = new Date();
    document.getElementById('date').value = d.toISOString().slice(0, 10);
  }

  function suggestId() {
    const d = new Date();
    const base = d.toISOString().slice(0, 10);
    const used = existingItems.filter((i) => i.id === base || i.id.startsWith(base + '-'));
    if (used.length === 0) return base;
    const suffixes = used.map((i) => (i.id === base ? 1 : parseInt(i.id.slice(base.length + 1), 10))).filter((n) => !isNaN(n));
    const max = Math.max(1, ...suffixes);
    return base + '-' + (max + 1);
  }

  function fillSuggestedId() {
    idInput.value = suggestId();
    checkIdDuplicate(idInput.value);
  }

  function showPanel(mode) {
    document.querySelectorAll('.panel').forEach((el) => { el.style.display = 'none'; });
    const panel = document.getElementById('panel-' + mode);
    if (panel) panel.style.display = 'block';
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    currentMode = mode;
    if (mode === 'movie') updateMoviePreview();
  }

  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      showPanel(btn.dataset.mode);
      currentMode = btn.dataset.mode;
      if (selectedIndex !== null && existingItems[selectedIndex]) {
        existingItems[selectedIndex].type = btn.dataset.mode;
        markRowUnsaved(selectedIndex);
      }
    });
  });

  const tagsContainer = document.getElementById('tagsContainer');
  const tagsInput = document.getElementById('tagsInput');

  function getAllTags() {
    const set = new Set();
    existingItems.forEach((i) => {
      if (Array.isArray(i.tags)) i.tags.forEach((t) => set.add(String(t).trim()));
    });
    selectedTags.forEach((t) => set.add(String(t).trim()));
    return Array.from(set).filter(Boolean).sort();
  }

  function escapeAttr(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML.replace(/"/g, '&quot;');
  }

  function escapeUrlAttr(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function renderTagChips(selectedSet) {
    const tags = getAllTags();
    tagsContainer.innerHTML = tags.map((tag) => {
      const safe = escapeHtml(tag);
      const attr = escapeAttr(tag);
      return `<span class="tag-chip" data-tag="${attr}" role="button" tabindex="0">${safe}</span>`;
    }).join('');
    tagsContainer.querySelectorAll('.tag-chip').forEach((el) => {
      const tag = el.dataset.tag;
      if (selectedSet && selectedSet.has(tag)) el.classList.add('selected');
      el.addEventListener('click', () => {
        if (!selectedSet) return;
        if (selectedSet.has(tag)) {
          selectedSet.delete(tag);
          el.classList.remove('selected');
        } else {
          selectedSet.add(tag);
          el.classList.add('selected');
        }
        syncDetailFormToItem();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });
  }

  let selectedTags = new Set();

  if (tagsInput) {
    tagsInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const raw = (tagsInput.value || '').trim();
      if (!raw) return;
      const toAdd = raw.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
      toAdd.forEach((t) => selectedTags.add(t));
      tagsInput.value = '';
      renderTagChips(selectedTags);
      syncDetailFormToItem();
    });
  }

  async function loadExistingItems() {
    try {
      const res = await fetch(API + '/items');
      existingItems = await res.json();
      if (!Array.isArray(existingItems)) existingItems = [];
      renderTable();
      renderTagChips(selectedTags);
      fillSuggestedId();
      if (statusEl) statusEl.textContent = '';
    } catch (e) {
      if (itemsTableBody) itemsTableBody.innerHTML = '<tr><td colspan="7" class="status error">接続エラー</td></tr>';
      fillSuggestedId();
    }
  }

  function normalizeDetailMode(item) {
    if (item.type === 'picture' || item.type === 'movie') return item.type;
    return 'picture';
  }

  function syncDetailFormFromItem(item) {
    if (!item) return;
    isSyncingFromItem = true;
    const mode = normalizeDetailMode(item);
    currentMode = mode;
    idInput.value = item.id || '';
    document.getElementById('title').value = (item.title || '').trim();
    document.getElementById('date').value = (item.date || '').trim() || '';
    selectedTags.clear();
    if (Array.isArray(item.tags) && item.tags.length) item.tags.forEach((t) => selectedTags.add(String(t).trim()));
    renderTagChips(selectedTags);
    showPanel(mode);
    checkIdDuplicate(idInput.value);
    isSyncingFromItem = false;
  }

  function markRowUnsaved(index) {
    const item = existingItems[index];
    if (!item) return;
    item._unsaved = true;
    if (!itemsTableBody) return;
    const tr = itemsTableBody.querySelector(`tr.data-row[data-index="${index}"]`);
    if (tr) tr.classList.add('unsaved');
  }

  function syncDetailFormToItem() {
    if (selectedIndex === null || isSyncingFromItem) return;
    const item = existingItems[selectedIndex];
    if (!item) return;
    item.id = (idInput.value || '').trim();
    item.title = (document.getElementById('title').value || '').trim() || undefined;
    item.date = (document.getElementById('date').value || '').trim() || undefined;
    const tagsArr = getTagsArray();
    item.tags = tagsArr && tagsArr.length ? tagsArr : undefined;
    markRowUnsaved(selectedIndex);
  }

  function renderTypeSelect(item, i) {
    const typeVal = item.type === 'picture' || item.type === 'movie' ? item.type : item.type === 'write' ? 'write' : 'picture';
    if (typeVal === 'write') {
      return `<td class="cell-type-legacy">
        <span class="legacy-badge">記事(旧)</span>
        <select class="cell-input cell-type" data-field="type" data-index="${i}">
          <option value="" disabled selected>—</option>
          <option value="picture">画像</option>
          <option value="movie">動画</option>
        </select>
      </td>`;
    }
    return `<td>
      <select class="cell-input cell-type" data-field="type" data-index="${i}">
        <option value="picture"${typeVal === 'picture' ? ' selected' : ''}>画像</option>
        <option value="movie"${typeVal === 'movie' ? ' selected' : ''}>動画</option>
      </select>
    </td>`;
  }

  function renderTable() {
    if (!itemsTableBody) return;
    if (existingItems.length === 0) {
      itemsTableBody.innerHTML = '<tr><td colspan="7"></td></tr>';
      return;
    }
    const n = existingItems.length;
    let drafts = [];
    try {
      drafts = getDrafts();
    } catch (_) {}
    itemsTableBody.innerHTML = existingItems.map((item, i) => {
      const typeVal = item.type === 'picture' || item.type === 'movie' ? item.type : item.type === 'write' ? 'write' : 'picture';
      const tagsStr = Array.isArray(item.tags) ? item.tags.join(', ') : '';
      const selected = selectedIndex === i ? ' selected' : '';
      const hasDraft = drafts.some((d) => d.id === item.id && (d.type || 'picture') === typeVal);
      const draftClass = hasDraft ? ' has-draft' : '';
      const unsavedClass = item._unsaved ? ' unsaved' : '';
      const upDisabled = i <= 0 ? ' disabled' : '';
      const downDisabled = i >= n - 1 ? ' disabled' : '';
      const orderCell = `
        <td class="col-order">
          <div class="layer-order-btns">
            <button type="button" class="layer-order-btn" data-direction="up" data-index="${i}"${upDisabled}>↑</button>
            <button type="button" class="layer-order-btn" data-direction="down" data-index="${i}"${downDisabled}>↓</button>
          </div>
        </td>
      `;
      return `
        <tr class="data-row${selected}${draftClass}${unsavedClass}" data-index="${i}">
          ${orderCell}
          <td><input type="text" class="cell-input cell-id" value="${escapeAttr(item.id || '')}" data-field="id"></td>
          <td><input type="text" class="cell-input cell-title" value="${escapeAttr((item.title || '').trim())}" data-field="title"></td>
          ${renderTypeSelect(item, i)}
          <td><input type="date" class="cell-input cell-date" value="${escapeAttr((item.date || '').trim())}" data-field="date"></td>
          <td><input type="text" class="cell-input cell-tags" value="${escapeAttr(tagsStr)}" data-field="tags"></td>
          <td><button type="button" class="row-delete-btn" data-index="${i}">×</button></td>
        </tr>
      `;
    }).join('');

    itemsTableBody.querySelectorAll('.data-row').forEach((tr) => {
      const i = parseInt(tr.dataset.index, 10);
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.cell-input') || e.target.closest('.row-delete-btn') || e.target.closest('.layer-order-btns')) return;
        selectRow(i);
      });
    });
    itemsTableBody.querySelectorAll('.layer-order-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        const i = parseInt(btn.dataset.index, 10);
        if (btn.dataset.direction === 'up') moveRowUp(i);
        else moveRowDown(i);
      });
    });
    itemsTableBody.querySelectorAll('.cell-input').forEach((input) => {
      const tr = input.closest('tr');
      const i = parseInt(tr.dataset.index, 10);
      const field = input.dataset.field;
      const apply = () => {
        const item = existingItems[i];
        if (!item) return;
        if (field === 'id') item.id = (input.value || '').trim();
        else if (field === 'title') item.title = (input.value || '').trim() || undefined;
        else if (field === 'type') {
          const v = input.value;
          if (!v) return;
          item.type = v;
        } else if (field === 'date') item.date = (input.value || '').trim() || undefined;
        else if (field === 'tags') {
          const arr = (input.value || '').split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
          item.tags = arr.length ? arr : undefined;
        }
        markRowUnsaved(i);
        if (selectedIndex === i) syncDetailFormFromItem(item);
      };
      input.addEventListener('change', apply);
      input.addEventListener('blur', apply);
    });
    itemsTableBody.querySelectorAll('.row-delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.index, 10);
        const item = existingItems[i];
        if (item && item.id) deleteItem(item.id);
      });
    });
  }

  function selectRow(i) {
    if (i < 0 || i >= existingItems.length) return;
    selectedIndex = i;
    isNewRow = false;
    const item = existingItems[i];
    document.getElementById('detailRowIndex').value = String(i);
    detailPanelTitle.textContent = item.id || '';
    form.style.display = 'block';
    syncDetailFormFromItem(item);
    loadItemContentForEdit(item);
    renderTable();
  }

  function setPicturePreviewVisible(show, src) {
    if (!picturePreview) return;
    if (show && src) {
      picturePreview.src = src;
      picturePreview.style.display = 'block';
    } else {
      picturePreview.style.display = 'none';
      picturePreview.src = '';
    }
  }

  async function loadItemContentForEdit(item) {
    const mode = normalizeDetailMode(item);
    if (mode === 'picture') {
      pictureData = null;
      setPicturePreviewVisible(false);
      if (item.type === 'picture' && item.assets && item.assets.image) {
        const imgPath = item.assets.image.replace(/^\//, '');
        try {
          const imgRes = await fetch('/' + imgPath);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              const filename = item.assets.image.split('/').pop() || item.id + '.jpg';
              pictureData = { filename, data: base64 };
              setPicturePreviewVisible(true, reader.result);
            };
            reader.readAsDataURL(blob);
          }
        } catch (_) {}
      }
    } else {
      pictureData = null;
      setPicturePreviewVisible(false);
    }
    movieUrl.value = mode === 'movie' ? (item.url || '').trim() : '';
    movieFileData = null;
    if (movieFileObjectUrlForPreview) {
      URL.revokeObjectURL(movieFileObjectUrlForPreview);
      movieFileObjectUrlForPreview = null;
    }
    if (movieFile) movieFile.value = '';
    if (mode === 'movie') updateMoviePreview();
    else if (moviePreviewEl) moviePreviewEl.innerHTML = '';
  }

  function showDetailEmpty() {
    selectedIndex = null;
    isNewRow = false;
    detailPanelTitle.textContent = '';
    form.style.display = 'none';
  }

  function moveRowUp(i) {
    if (i <= 0) return;
    const selectedId = selectedIndex != null ? existingItems[selectedIndex]?.id : null;
    [existingItems[i - 1], existingItems[i]] = [existingItems[i], existingItems[i - 1]];
    selectedIndex = selectedId != null ? existingItems.findIndex((it) => it.id === selectedId) : null;
    saveItemsOrder();
  }

  function moveRowDown(i) {
    if (i >= existingItems.length - 1) return;
    const selectedId = selectedIndex != null ? existingItems[selectedIndex]?.id : null;
    [existingItems[i], existingItems[i + 1]] = [existingItems[i + 1], existingItems[i]];
    selectedIndex = selectedId != null ? existingItems.findIndex((it) => it.id === selectedId) : null;
    saveItemsOrder();
  }

  async function saveItemsOrder() {
    try {
      const res = await fetch(API + '/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existingItems),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        statusEl.textContent = data.error || 'エラー';
        statusEl.className = 'status error';
        return;
      }
      renderTable();
      statusEl.textContent = '';
      statusEl.className = 'status success';
    } catch (err) {
      statusEl.textContent = '接続エラー';
      statusEl.className = 'status error';
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function deleteItem(id) {
    if (!id || !confirm('削除: ' + id + ' ?')) return;
    const selectedId = selectedIndex !== null ? existingItems[selectedIndex]?.id : null;
    const backup = existingItems.slice();
    existingItems = existingItems.filter((i) => i.id !== id);
    if (selectedId === id) showDetailEmpty();
    else if (selectedIndex !== null && selectedIndex >= existingItems.length) selectedIndex = Math.max(0, existingItems.length - 1);
    renderTable();
    renderTagChips(selectedTags);
    fillSuggestedId();
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'status';
    }
    try {
      const res = await fetch(API + '/items/' + encodeURIComponent(id), { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        existingItems = backup;
        if (selectedIndex !== null && selectedIndex >= existingItems.length) selectedIndex = Math.max(0, existingItems.length - 1);
        renderTable();
        renderTagChips(selectedTags);
        fillSuggestedId();
        if (selectedId != null) {
          const idx = existingItems.findIndex((i) => i.id === selectedId);
          if (idx >= 0) selectRow(idx);
        }
        if (statusEl) {
          statusEl.textContent = data.error || 'エラー';
          statusEl.className = 'status error';
        }
        return;
      }
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'status success';
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = '接続エラー';
        statusEl.className = 'status error';
      }
    }
  }

  function checkIdDuplicate(id) {
    const trimmed = (id || '').trim();
    if (!trimmed) {
      if (idHint) { idHint.textContent = ''; idHint.className = 'hint'; }
      return;
    }
    const exists = existingItems.some((i, idx) => idx !== selectedIndex && i.id === trimmed);
    if (idHint) {
      idHint.textContent = exists ? '重複' : '';
      idHint.className = 'hint' + (exists ? ' error' : '');
    }
  }

  idInput.addEventListener('input', () => { checkIdDuplicate(idInput.value); syncDetailFormToItem(); });
  idInput.addEventListener('blur', () => checkIdDuplicate(idInput.value));
  const titleEl = document.getElementById('title');
  const dateEl = document.getElementById('date');
  if (titleEl) { titleEl.addEventListener('input', syncDetailFormToItem); titleEl.addEventListener('change', syncDetailFormToItem); }
  if (dateEl) { dateEl.addEventListener('input', syncDetailFormToItem); dateEl.addEventListener('change', syncDetailFormToItem); }

  pictureDrop.addEventListener('click', () => pictureFile.click());
  pictureDrop.addEventListener('dragover', (e) => { e.preventDefault(); pictureDrop.classList.add('dragover'); });
  pictureDrop.addEventListener('dragleave', () => pictureDrop.classList.remove('dragover'));
  pictureDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    pictureDrop.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) setPictureFile(file);
  });
  pictureFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) setPictureFile(file);
    if (selectedIndex !== null) markRowUnsaved(selectedIndex);
  });

  function setPictureFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      pictureData = { filename: file.name || 'image.png', data: reader.result.split(',')[1] };
      setPicturePreviewVisible(true, reader.result);
    };
    reader.readAsDataURL(file);
  }

  function extractYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?#/]+)/);
    return m ? m[1] : null;
  }

  function isDirectVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /^https?:\/\//i.test(url) && /\.(mp4|webm|ogg)(\?|#|$)/i.test(url.split('?')[0]);
  }

  function updateMoviePreview() {
    if (!moviePreviewEl) return;
    if (movieFileData && movieFileObjectUrlForPreview) {
      moviePreviewEl.innerHTML = '<video src="' + escapeUrlAttr(movieFileObjectUrlForPreview) + '" controls playsinline class="movie-preview-video"></video>';
      return;
    }
    const url = (movieUrl.value || '').trim();
    if (url) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        moviePreviewEl.innerHTML = '<iframe class="movie-preview-iframe" src="https://www.youtube.com/embed/' + escapeHtml(videoId) + '?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
        return;
      }
      if (isDirectVideoUrl(url)) {
        moviePreviewEl.innerHTML = '<video class="movie-preview-video" src="' + escapeUrlAttr(url) + '" controls playsinline crossorigin="anonymous"></video>';
        return;
      }
      moviePreviewEl.innerHTML = '';
      return;
    }
    moviePreviewEl.innerHTML = '';
  }

  movieFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      movieFileData = null;
      if (movieFileObjectUrlForPreview) {
        URL.revokeObjectURL(movieFileObjectUrlForPreview);
        movieFileObjectUrlForPreview = null;
      }
      updateMoviePreview();
      if (selectedIndex !== null) markRowUnsaved(selectedIndex);
      return;
    }
    if (movieFileObjectUrlForPreview) URL.revokeObjectURL(movieFileObjectUrlForPreview);
    movieFileObjectUrlForPreview = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      movieFileData = { filename: file.name, data: reader.result.split(',')[1] };
      movieUrl.value = '';
      updateMoviePreview();
      if (selectedIndex !== null) markRowUnsaved(selectedIndex);
    };
    reader.readAsDataURL(file);
  });
  movieUrl.addEventListener('input', () => {
    if (movieUrl.value.trim()) {
      movieFileData = null;
      if (movieFileObjectUrlForPreview) {
        URL.revokeObjectURL(movieFileObjectUrlForPreview);
        movieFileObjectUrlForPreview = null;
      }
      if (movieFile) movieFile.value = '';
    }
    updateMoviePreview();
    if (selectedIndex !== null) markRowUnsaved(selectedIndex);
  });

  function getTagsArray() {
    if (!selectedTags.size) return undefined;
    return Array.from(selectedTags);
  }

  const DRAFT_KEY = 'opus_editer_drafts';

  function getDrafts() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function setDrafts(arr) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(arr));
  }

  function collectFormForDraft() {
    const id = idInput.value.trim();
    if (!id) return null;
    const draft = {
      id,
      type: currentMode,
      title: document.getElementById('title').value.trim() || undefined,
      date: document.getElementById('date').value || undefined,
      tags: getTagsArray(),
      savedAt: new Date().toISOString(),
    };
    if (currentMode === 'picture') {
      if (pictureData) draft.image = { ...pictureData };
    } else {
      draft.url = movieUrl.value.trim() || undefined;
      if (movieFileData) draft.videoFile = { ...movieFileData };
    }
    return draft;
  }

  function saveDraft() {
    const draft = collectFormForDraft();
    if (!draft) {
      statusEl.textContent = 'ID 必須';
      statusEl.className = 'status error';
      return;
    }
    const drafts = getDrafts();
    const existingIndex = drafts.findIndex((d) => d.id === draft.id && d.type === draft.type);
    if (existingIndex >= 0) drafts.splice(existingIndex, 1);
    drafts.unshift(draft);
    setDrafts(drafts);
    renderTable();
    statusEl.textContent = '';
    statusEl.className = 'status success';
  }

  function loadDraft(draft) {
    if (!draft) return;
    const item = {
      id: draft.id || '',
      title: (draft.title || '').trim(),
      date: draft.date || '',
      tags: Array.isArray(draft.tags) ? draft.tags.slice() : [],
      type: draft.type === 'picture' || draft.type === 'movie' ? draft.type : 'picture',
      _unsaved: true,
    };
    existingItems.push(item);
    selectedIndex = existingItems.length - 1;
    isNewRow = true;
    document.getElementById('detailRowIndex').value = String(selectedIndex);
    detailPanelTitle.textContent = draft.id || '';
    form.style.display = 'block';
    syncDetailFormFromItem(item);

    if (draft.type === 'picture') {
      if (draft.image && draft.image.data) {
        pictureData = { filename: draft.image.filename, data: draft.image.data };
        setPicturePreviewVisible(true, 'data:image/*;base64,' + draft.image.data);
      } else {
        pictureData = null;
        setPicturePreviewVisible(false);
      }
    } else {
      movieUrl.value = draft.url || '';
      movieFileData = null;
      if (movieFileObjectUrlForPreview) {
        URL.revokeObjectURL(movieFileObjectUrlForPreview);
        movieFileObjectUrlForPreview = null;
      }
      if (draft.videoFile && draft.videoFile.data) {
        movieFileData = { filename: draft.videoFile.filename, data: draft.videoFile.data };
        const bin = atob(draft.videoFile.data);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const blob = new Blob([buf], { type: 'video/mp4' });
        movieFileObjectUrlForPreview = URL.createObjectURL(blob);
      }
      updateMoviePreview();
    }
    statusEl.textContent = '';
    statusEl.className = 'status success';
    checkIdDuplicate(idInput.value);
    renderTable();
  }

  const draftSaveBtnEl = document.getElementById('draftSaveBtn');
  if (draftSaveBtnEl) draftSaveBtnEl.addEventListener('click', saveDraft);

  function buildPayload(opts) {
    const id = idInput.value.trim();
    if (!id) return { error: 'ID 必須' };
    const item = selectedIndex !== null ? existingItems[selectedIndex] : null;
    if (item && item.type === 'write') {
      return { error: '種別を変更' };
    }
    const payload = {
      type: currentMode,
      id,
      title: document.getElementById('title').value.trim() || undefined,
      date: document.getElementById('date').value || undefined,
      tags: getTagsArray(),
      update: opts && opts.update === true,
    };
    if (currentMode === 'picture') {
      if (!pictureData) return { error: '画像なし' };
      payload.image = pictureData;
    } else {
      if (movieFileData) payload.videoFile = movieFileData;
      else if (movieUrl.value.trim()) payload.url = movieUrl.value.trim();
      else return { error: '動画なし' };
    }
    return payload;
  }

  async function submitEntry(payload, clearFormOnSuccess) {
    statusEl.textContent = '';
    statusEl.className = 'status';
    try {
      const res = await fetch(API + '/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        statusEl.textContent = data.error || res.statusText || 'エラー';
        statusEl.className = 'status error';
        return;
      }
      if (data.updated) {
        statusEl.textContent = '更新';
      } else if (clearFormOnSuccess) {
        statusEl.textContent = data.item ? data.item.id : '保存';
      } else {
        statusEl.textContent = '保存';
      }
      statusEl.className = 'status success';
      const listRes = await fetch(API + '/items');
      if (listRes.ok) {
        const list = await listRes.json().catch(() => []);
        if (Array.isArray(list)) existingItems = list;
      } else if (data.item && !payload.update) {
        existingItems.push(data.item);
      } else if (data.item && payload.update) {
        const idx = existingItems.findIndex((i) => i.id === data.item.id);
        if (idx >= 0) existingItems[idx] = data.item;
        else existingItems.push(data.item);
      }
      renderTable();
      if (data.item && Array.isArray(data.item.tags)) {
        data.item.tags.forEach((t) => selectedTags.add(t));
      }
      renderTagChips(selectedTags);
      if (clearFormOnSuccess) {
        fillSuggestedId();
        setDateToday();
        if (currentMode === 'picture') {
          pictureData = null;
          setPicturePreviewVisible(false);
          pictureFile.value = '';
        } else {
          movieFileData = null;
          if (movieFileObjectUrlForPreview) {
            URL.revokeObjectURL(movieFileObjectUrlForPreview);
            movieFileObjectUrlForPreview = null;
          }
          movieUrl.value = '';
          movieFile.value = '';
          updateMoviePreview();
        }
      }
    } catch (err) {
      statusEl.textContent = '接続エラー';
      statusEl.className = 'status error';
    }
  }

  if (addRowBtn) {
    addRowBtn.addEventListener('click', () => {
      const newItem = {
        id: suggestId(),
        title: '',
        type: 'picture',
        date: new Date().toISOString().slice(0, 10),
        tags: [],
        _unsaved: true,
      };
      existingItems.push(newItem);
      selectedIndex = existingItems.length - 1;
      isNewRow = true;
      document.getElementById('detailRowIndex').value = String(selectedIndex);
      detailPanelTitle.textContent = newItem.id || '';
      form.style.display = 'block';
      syncDetailFormFromItem(newItem);
      pictureData = null;
      setPicturePreviewVisible(false);
      movieUrl.value = '';
      movieFileData = null;
      if (movieFileObjectUrlForPreview) { URL.revokeObjectURL(movieFileObjectUrlForPreview); movieFileObjectUrlForPreview = null; }
      if (movieFile) movieFile.value = '';
      updateMoviePreview();
      renderTable();
    });
  }

  const detailSaveBtn = document.getElementById('detailSaveBtn');
  if (detailSaveBtn) {
    detailSaveBtn.addEventListener('click', async () => {
      const id = idInput.value.trim();
      if (!id) {
        statusEl.textContent = 'ID 必須';
        statusEl.className = 'status error';
        return;
      }
      const payload = buildPayload({ update: !isNewRow });
      if (payload.error) {
        statusEl.textContent = payload.error;
        statusEl.className = 'status error';
        return;
      }
      if (isNewRow && existingItems.filter((i) => i.id === id).length > 1) {
        statusEl.textContent = '重複';
        statusEl.className = 'status error';
        return;
      }
      await submitEntry(payload, false);
      isNewRow = false;
      const listRes = await fetch(API + '/items');
      if (listRes.ok) {
        const list = await listRes.json().catch(() => []);
        if (Array.isArray(list)) existingItems = list;
      }
      renderTable();
      if (selectedIndex !== null && selectedIndex < existingItems.length) syncDetailFormFromItem(existingItems[selectedIndex]);
    });
  }

  const detailDeleteBtn = document.getElementById('detailDeleteBtn');
  if (detailDeleteBtn) {
    detailDeleteBtn.addEventListener('click', () => {
      if (selectedIndex === null) return;
      const item = existingItems[selectedIndex];
      if (item && item.id) deleteItem(item.id);
      else { existingItems.splice(selectedIndex, 1); showDetailEmpty(); renderTable(); }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (document.getElementById('detailSaveBtn')) document.getElementById('detailSaveBtn').click();
    });
  }

  setDateToday();
  loadExistingItems();
  showDetailEmpty();

  const origShowPanel = showPanel;
  showPanel = function (mode) {
    origShowPanel(mode);
    renderTagChips(selectedTags);
    if (mode === 'movie') updateMoviePreview();
  };
})();
