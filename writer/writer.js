/**
 * Writer フロント - 記事・画像・動画を追加して items.json を自動生成
 * ローカルサーバー (cd writer && node server.js) と一緒に使用
 */
(function () {
  const API = '/api';
  let currentMode = 'write';
  let existingItems = [];
  let articleAttachments = []; // { filename, data (base64) }
  let writeTopImageData = null; // 記事のトップ画像（カード用）{ filename, data }
  let pictureData = null; // { filename, data }
  let movieFileData = null; // { filename, data }
  let movieFileObjectUrlForPreview = null; // 動画ファイルの Object URL（プレビュー用）

  const form = document.getElementById('detailForm');
  const idInput = document.getElementById('id');
  const idHint = document.getElementById('idHint');
  const markdownEl = document.getElementById('markdown');
  const previewEl = document.getElementById('preview');
  const statusEl = document.getElementById('status');
  const itemsTableBody = document.getElementById('itemsTableBody');
  const detailPanel = document.getElementById('detailPanel');
  const detailPanelTitle = document.getElementById('detailPanelTitle');
  const detailPanelHint = document.getElementById('detailPanelHint');
  const addRowBtn = document.getElementById('addRowBtn');
  let selectedIndex = null; // 選択中の行インデックス（詳細パネルに表示）
  let isNewRow = false;    // 新規追加行でまだ保存していない
  let isSyncingFromItem = false; // フォームへアイテムを反映中（変更検知をスキップ）
  const fileImages = document.getElementById('fileImages');
  const pictureDrop = document.getElementById('pictureDrop');
  const pictureFile = document.getElementById('pictureFile');
  const picturePreview = document.getElementById('picturePreview');
  const movieUrl = document.getElementById('movieUrl');
  const movieFile = document.getElementById('movieFile');
  const writeTopImageDrop = document.getElementById('writeTopImageDrop');
  const writeTopImageFile = document.getElementById('writeTopImageFile');
  const writeTopImagePreview = document.getElementById('writeTopImagePreview');
  const moviePreviewEl = document.getElementById('moviePreview');

  function setDateToday() {
    const d = new Date();
    document.getElementById('date').value = d.toISOString().slice(0, 10);
  }

  function suggestId() {
    const d = new Date();
    const base = d.toISOString().slice(0, 10);
    const used = existingItems.filter((i) => i.id === base || i.id.startsWith(base + '-'));
    if (used.length === 0) return base;
    const suffixes = used.map((i) => i.id === base ? 1 : parseInt(i.id.slice(base.length + 1), 10)).filter((n) => !isNaN(n));
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

  const tagsHint = document.getElementById('tagsHint');
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

  function renderTagChips(selectedSet) {
    const tags = getAllTags();
    tagsHint.textContent = tags.length === 0
      ? '既存のタグがありません。下の入力欄で新しいタグを追加するか、アイテムを追加するとタグが表示されます。'
      : 'クリックで選択／解除。下の入力欄で新しいタグを追加できます。';
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
      if (itemsTableBody) itemsTableBody.innerHTML = '<tr><td colspan="7" class="hint error">サーバーに接続できません。cd writer && node server.js を実行していますか？</td></tr>';
      if (tagsHint) tagsHint.textContent = 'タグを読み込めませんでした。';
      fillSuggestedId();
    }
  }

  function getTypeLabel(type) {
    return type === 'write' ? '記事' : type === 'picture' ? '画像' : '動画';
  }

  function syncDetailFormFromItem(item) {
    if (!item) return;
    isSyncingFromItem = true;
    const mode = item.type === 'write' || item.type === 'picture' || item.type === 'movie' ? item.type : 'write';
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

  /** 行を未保存状態にし、テーブルの見た目を更新 */
  function markRowUnsaved(index) {
    const item = existingItems[index];
    if (!item) return;
    item._unsaved = true;
    if (!itemsTableBody) return;
    const tr = itemsTableBody.querySelector(`tr.data-row[data-index="${index}"]`);
    if (tr) tr.classList.add('unsaved');
  }

  /** 詳細フォームの内容を選択中アイテムに反映し、未保存にする */
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

  function renderTable() {
    if (!itemsTableBody) return;
    if (existingItems.length === 0) {
      itemsTableBody.innerHTML = '<tr><td colspan="7" class="hint">アイテムがありません。「新規追加」で追加できます。</td></tr>';
      return;
    }
    const n = existingItems.length;
    let drafts = [];
    try {
      drafts = getDrafts();
    } catch (_) {}
    itemsTableBody.innerHTML = existingItems.map((item, i) => {
      const typeVal = item.type === 'write' || item.type === 'picture' || item.type === 'movie' ? item.type : 'write';
      const tagsStr = Array.isArray(item.tags) ? item.tags.join(', ') : '';
      const selected = selectedIndex === i ? ' selected' : '';
      const hasDraft = drafts.some((d) => d.id === item.id && (d.type || 'write') === typeVal);
      const draftClass = hasDraft ? ' has-draft' : '';
      const unsavedClass = item._unsaved ? ' unsaved' : '';
      const upDisabled = i <= 0 ? ' disabled' : '';
      const downDisabled = i >= n - 1 ? ' disabled' : '';
      const orderCell = `
        <td class="col-order">
          <div class="layer-order-btns">
            <button type="button" class="layer-order-btn" data-direction="up" data-index="${i}"${upDisabled} title="上へ">↑</button>
            <button type="button" class="layer-order-btn" data-direction="down" data-index="${i}"${downDisabled} title="下へ">↓</button>
          </div>
        </td>
      `;
      return `
        <tr class="data-row${selected}${draftClass}${unsavedClass}" data-index="${i}">
          ${orderCell}
          <td><input type="text" class="cell-input cell-id" value="${escapeAttr(item.id || '')}" data-field="id"></td>
          <td><input type="text" class="cell-input cell-title" value="${escapeAttr((item.title || '').trim())}" data-field="title"></td>
          <td>
            <select class="cell-input cell-type" data-field="type">
              <option value="write"${typeVal === 'write' ? ' selected' : ''}>記事</option>
              <option value="picture"${typeVal === 'picture' ? ' selected' : ''}>画像</option>
              <option value="movie"${typeVal === 'movie' ? ' selected' : ''}>動画</option>
            </select>
          </td>
          <td><input type="date" class="cell-input cell-date" value="${escapeAttr((item.date || '').trim())}" data-field="date"></td>
          <td><input type="text" class="cell-input cell-tags" value="${escapeAttr(tagsStr)}" data-field="tags" placeholder="カンマ区切り"></td>
          <td><button type="button" class="row-delete-btn" data-index="${i}" title="削除">×</button></td>
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
        else if (field === 'type') item.type = input.value;
        else if (field === 'date') item.date = (input.value || '').trim() || undefined;
        else         if (field === 'tags') {
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
    detailPanelTitle.textContent = item.id ? '詳細設定: ' + item.id : '新規アイテム';
    detailPanelHint.textContent = '内容を編集して「保存」で反映します。';
    form.style.display = 'block';
    syncDetailFormFromItem(item);
    loadItemContentForEdit(item);
    renderTable();
  }

  /** 種別に応じたコンテンツ（本文・画像・動画URL）を読み込む */
  async function loadItemContentForEdit(item) {
    const mode = item.type === 'write' || item.type === 'picture' || item.type === 'movie' ? item.type : 'write';
    if (mode === 'write') {
      articleAttachments = [];
      writeTopImageData = null;
      writeTopImagePreview.style.display = 'none';
      writeTopImagePreview.src = '';
      if (writeTopImageDrop) writeTopImageDrop.querySelector('.drop-text').textContent = 'クリックまたはドラッグで選択';
      try {
        const mdRes = await fetch('/assets/' + encodeURIComponent(item.id) + '.md');
        markdownEl.value = mdRes.ok ? await mdRes.text() : '';
      } catch (_) {
        markdownEl.value = '';
      }
      updatePreview();
      if (item.assets && item.assets.image) {
        const imgPath = item.assets.image.replace(/^\//, '');
        try {
          const imgRes = await fetch('/' + imgPath);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result;
              const base64 = dataUrl.split(',')[1];
              writeTopImageData = { filename: (item.id + '-card.jpg'), data: base64 };
              writeTopImagePreview.src = dataUrl;
              writeTopImagePreview.style.display = 'block';
              if (writeTopImageDrop) writeTopImageDrop.querySelector('.drop-text').textContent = '画像を変更する';
            };
            reader.readAsDataURL(blob);
          }
        } catch (_) {}
      }
    } else if (mode === 'picture') {
      pictureData = null;
      picturePreview.style.display = 'none';
      picturePreview.src = '';
      if (item.assets && item.assets.image) {
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
              picturePreview.src = reader.result;
              picturePreview.style.display = 'block';
              if (pictureDrop) pictureDrop.querySelector('.drop-text').textContent = '画像を変更する';
            };
            reader.readAsDataURL(blob);
          }
        } catch (_) {}
      }
    } else {
      movieUrl.value = (item.url || '').trim();
      movieFileData = null;
      if (movieFileObjectUrlForPreview) {
        URL.revokeObjectURL(movieFileObjectUrlForPreview);
        movieFileObjectUrlForPreview = null;
      }
      updateMoviePreview();
    }
  }

  function showDetailEmpty() {
    selectedIndex = null;
    isNewRow = false;
    detailPanelTitle.textContent = '行を選択してください';
    detailPanelHint.textContent = '一覧で行をクリックするか「新規追加」で編集できます。';
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
        statusEl.textContent = data.error || res.statusText || '並べ替えの保存に失敗しました';
        statusEl.className = 'status error';
        return;
      }
      renderTable();
      statusEl.textContent = '並び順を保存しました。';
      statusEl.className = 'status success';
    } catch (err) {
      statusEl.textContent = '接続エラー: ' + err.message;
      statusEl.className = 'status error';
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** 既存アイテムを削除する（楽観的更新で即座にUIに反映） */
  async function deleteItem(id) {
    if (!id || !confirm('「' + id + '」を削除してよろしいですか？\n関連するファイル（Markdown・画像など）も削除されます。')) return;
    const selectedId = selectedIndex !== null ? existingItems[selectedIndex]?.id : null;
    const backup = existingItems.slice();
    existingItems = existingItems.filter((i) => i.id !== id);
    if (selectedId === id) showDetailEmpty();
    else if (selectedIndex !== null && selectedIndex >= existingItems.length) selectedIndex = Math.max(0, existingItems.length - 1);
    renderTable();
    renderTagChips(selectedTags);
    fillSuggestedId();
    if (statusEl) {
      statusEl.textContent = '削除中...';
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
          statusEl.textContent = data.error || res.statusText || '削除に失敗しました';
          statusEl.className = 'status error';
        }
        return;
      }
      if (statusEl) {
        statusEl.textContent = '削除しました。';
        statusEl.className = 'status success';
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = '接続エラー: ' + err.message;
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
      idHint.textContent = exists ? 'この ID は既に使われています' : '';
      idHint.className = 'hint' + (exists ? ' error' : '');
    }
  }

  idInput.addEventListener('input', () => { checkIdDuplicate(idInput.value); syncDetailFormToItem(); });
  idInput.addEventListener('blur', () => checkIdDuplicate(idInput.value));
  const titleEl = document.getElementById('title');
  const dateEl = document.getElementById('date');
  if (titleEl) { titleEl.addEventListener('input', syncDetailFormToItem); titleEl.addEventListener('change', syncDetailFormToItem); }
  if (dateEl) { dateEl.addEventListener('input', syncDetailFormToItem); dateEl.addEventListener('change', syncDetailFormToItem); }

  function updatePreview() {
    const raw = markdownEl.value || '';
    if (typeof marked !== 'undefined') {
      previewEl.innerHTML = marked.parse(raw);
    } else {
      previewEl.textContent = raw || '（プレビュー）';
    }
  }
  markdownEl.addEventListener('input', () => { updatePreview(); if (selectedIndex !== null) markRowUnsaved(selectedIndex); });

  // 記事: トップ画像（カード用）
  writeTopImageDrop.addEventListener('click', () => writeTopImageFile.click());
  writeTopImageDrop.addEventListener('dragover', (e) => { e.preventDefault(); writeTopImageDrop.classList.add('dragover'); });
  writeTopImageDrop.addEventListener('dragleave', () => writeTopImageDrop.classList.remove('dragover'));
  writeTopImageDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    writeTopImageDrop.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) setWriteTopImage(file);
  });
  writeTopImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) setWriteTopImage(file);
    if (selectedIndex !== null) markRowUnsaved(selectedIndex);
  });

  function setWriteTopImage(file) {
    const reader = new FileReader();
    reader.onload = () => {
      writeTopImageData = { filename: file.name || 'top.png', data: reader.result.split(',')[1] };
      writeTopImagePreview.src = reader.result;
      writeTopImagePreview.style.display = 'block';
      writeTopImageDrop.querySelector('.drop-text').textContent = '画像を変更する';
    };
    reader.readAsDataURL(file);
  }

  document.querySelector('[data-action="paste-image"]').addEventListener('click', () => fileImages.click());
  fileImages.addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = 'img-' + Date.now() + '-' + i + (file.name ? '.' + file.name.split('.').pop() : '.png');
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result.split(',')[1];
        articleAttachments.push({ filename: name, data });
        const pos = markdownEl.selectionStart;
        const before = markdownEl.value.slice(0, pos);
        const after = markdownEl.value.slice(pos);
        markdownEl.value = before + '\n![](/assets/' + name + ')\n' + after;
        updatePreview();
        if (selectedIndex !== null) markRowUnsaved(selectedIndex);
      };
      reader.readAsDataURL(file);
    }
    fileImages.value = '';
  });

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
      picturePreview.src = reader.result;
      picturePreview.style.display = 'block';
      pictureDrop.querySelector('.drop-text').textContent = '画像を変更する';
    };
    reader.readAsDataURL(file);
  }

  function extractYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?#\/]+)/);
    return m ? m[1] : null;
  }

  function updateMoviePreview() {
    if (!moviePreviewEl) return;
    if (movieFileData && movieFileObjectUrlForPreview) {
      moviePreviewEl.innerHTML = '<video src="' + escapeHtml(movieFileObjectUrlForPreview) + '" controls playsinline></video>';
      return;
    }
    const url = movieUrl.value.trim();
    if (url) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        moviePreviewEl.innerHTML = '<iframe src="https://www.youtube.com/embed/' + escapeHtml(videoId) + '?rel=0" allowfullscreen></iframe>';
        return;
      }
      moviePreviewEl.innerHTML = '<p class="movie-preview-placeholder">URL を入力するとプレビューが表示されます（YouTube 対応）</p>';
      return;
    }
    if (movieFileObjectUrlForPreview) {
      URL.revokeObjectURL(movieFileObjectUrlForPreview);
      movieFileObjectUrlForPreview = null;
    }
    moviePreviewEl.innerHTML = '<p class="movie-preview-placeholder">URL を入力するか、動画ファイルを選択してください</p>';
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
    }
    updateMoviePreview();
    if (selectedIndex !== null) markRowUnsaved(selectedIndex);
  });

  function getTagsArray() {
    if (!selectedTags.size) return undefined;
    return Array.from(selectedTags);
  }

  const DRAFT_KEY = 'writer_drafts';

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
    if (currentMode === 'write') {
      draft.markdown = markdownEl.value || '';
      draft.attachments = articleAttachments.slice();
      if (writeTopImageData) draft.topImage = { ...writeTopImageData };
    } else if (currentMode === 'picture') {
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
      statusEl.textContent = 'ID を入力してください';
      statusEl.className = 'status error';
      return;
    }
    const drafts = getDrafts();
    const existingIndex = drafts.findIndex((d) => d.id === draft.id && d.type === draft.type);
    if (existingIndex >= 0) drafts.splice(existingIndex, 1);
    drafts.unshift(draft);
    setDrafts(drafts);
    renderDraftsList();
    renderTable();
    statusEl.textContent = '仮保存しました。';
    statusEl.className = 'status success';
  }

  function renderDraftsList() {
    const listEl = document.getElementById('draftsList');
    const sectionEl = document.getElementById('draftsSection');
    if (!listEl || !sectionEl) return;
    const drafts = getDrafts();
    if (drafts.length === 0) {
      listEl.innerHTML = '<p class="hint">下書きはありません。</p>';
      return;
    }
    listEl.innerHTML = drafts.map((d, i) => {
      const label = d.type === 'write' ? '記事' : d.type === 'picture' ? '画像' : '動画';
      const meta = d.savedAt ? new Date(d.savedAt).toLocaleString('ja-JP') : '';
      const safeId = escapeHtml(d.id);
      const safeMeta = escapeHtml(meta);
      return `
        <div class="draft-item" data-index="${i}">
          <span class="draft-item-info">${safeId} <span class="draft-item-meta">(${label}) ${safeMeta}</span></span>
          <span class="draft-item-actions">
            <button type="button" class="btn btn-secondary draft-load-btn">読み込む</button>
            <button type="button" class="btn btn-secondary draft-remove-btn">del</button>
          </span>
        </div>
      `;
    }).join('');
    listEl.querySelectorAll('.draft-load-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => loadDraft(drafts[i]));
    });
    listEl.querySelectorAll('.draft-remove-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const list = getDrafts();
        list.splice(i, 1);
        setDrafts(list);
        renderTable();
      });
    });
  }

  function loadDraft(draft) {
    if (!draft) return;
    const item = {
      id: draft.id || '',
      title: (draft.title || '').trim(),
      date: draft.date || '',
      tags: Array.isArray(draft.tags) ? draft.tags.slice() : [],
      type: draft.type === 'write' || draft.type === 'picture' || draft.type === 'movie' ? draft.type : 'write',
      _unsaved: true,
    };
    existingItems.push(item);
    selectedIndex = existingItems.length - 1;
    isNewRow = true;
    document.getElementById('detailRowIndex').value = String(selectedIndex);
    detailPanelTitle.textContent = '下書き: ' + (draft.id || '');
    detailPanelHint.textContent = '内容を編集して「保存」で追加します。';
    form.style.display = 'block';
    syncDetailFormFromItem(item);

    if (draft.type === 'write') {
      markdownEl.value = draft.markdown || '';
      articleAttachments = Array.isArray(draft.attachments) ? draft.attachments.slice() : [];
      if (draft.topImage && draft.topImage.data) {
        writeTopImageData = { filename: draft.topImage.filename, data: draft.topImage.data };
        writeTopImagePreview.src = 'data:image/;base64,' + draft.topImage.data;
        writeTopImagePreview.style.display = 'block';
        if (writeTopImageDrop) writeTopImageDrop.querySelector('.drop-text').textContent = '画像を変更する';
      } else {
        writeTopImageData = null;
        writeTopImagePreview.style.display = 'none';
        writeTopImagePreview.src = '';
        if (writeTopImageDrop) writeTopImageDrop.querySelector('.drop-text').textContent = 'クリックまたはドラッグで選択';
      }
      updatePreview();
    } else if (draft.type === 'picture') {
      if (draft.image && draft.image.data) {
        pictureData = { filename: draft.image.filename, data: draft.image.data };
        picturePreview.src = 'data:image/;base64,' + draft.image.data;
        picturePreview.style.display = 'block';
        if (pictureDrop) pictureDrop.querySelector('.drop-text').textContent = '画像を変更する';
      } else {
        pictureData = null;
        picturePreview.style.display = 'none';
        picturePreview.src = '';
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
    statusEl.textContent = '下書きを読み込みました。保存で追加できます。';
    statusEl.className = 'status success';
    checkIdDuplicate(idInput.value);
    renderTable();
  }

  const draftSaveBtnEl = document.getElementById('draftSaveBtn');
  if (draftSaveBtnEl) draftSaveBtnEl.addEventListener('click', saveDraft);

  function buildPayload(opts) {
    const id = idInput.value.trim();
    if (!id) return { error: 'ID を入力してください' };
    const payload = {
      type: currentMode,
      id,
      title: document.getElementById('title').value.trim() || undefined,
      date: document.getElementById('date').value || undefined,
      tags: getTagsArray(),
      update: opts && opts.update === true,
    };
    if (currentMode === 'write') {
      payload.markdown = markdownEl.value || '';
      payload.attachments = articleAttachments;
      if (writeTopImageData) payload.topImage = writeTopImageData;
    } else if (currentMode === 'picture') {
      if (!pictureData) return { error: '画像を選択してください' };
      payload.image = pictureData;
    } else {
      if (movieFileData) payload.videoFile = movieFileData;
      else if (movieUrl.value.trim()) payload.url = movieUrl.value.trim();
      else return { error: '動画の URL またはファイルを指定してください' };
    }
    return payload;
  }

  async function submitEntry(payload, clearFormOnSuccess) {
    statusEl.textContent = '保存中...';
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
        statusEl.textContent = '投稿を更新しました。続きを書けます。';
      } else if (clearFormOnSuccess) {
        statusEl.textContent = '保存しました。' + (data.item ? data.item.id : '');
      } else {
        statusEl.textContent = '投稿しました。続きを書けます。';
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
        if (currentMode === 'write') {
          articleAttachments = [];
          writeTopImageData = null;
          writeTopImagePreview.style.display = 'none';
          writeTopImagePreview.src = '';
          writeTopImageDrop.querySelector('.drop-text').textContent = 'クリックまたはドラッグで選択';
          writeTopImageFile.value = '';
        } else if (currentMode === 'picture') {
          pictureData = null;
          picturePreview.style.display = 'none';
          picturePreview.src = '';
          pictureDrop.querySelector('.drop-text').textContent = 'クリックまたはドラッグで選択';
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
      statusEl.textContent = '接続エラー: ' + err.message;
      statusEl.className = 'status error';
    }
  }

  if (addRowBtn) {
    addRowBtn.addEventListener('click', () => {
      const newItem = {
        id: suggestId(),
        title: '',
        type: 'write',
        date: new Date().toISOString().slice(0, 10),
        tags: [],
        _unsaved: true,
      };
      existingItems.push(newItem);
      selectedIndex = existingItems.length - 1;
      isNewRow = true;
      document.getElementById('detailRowIndex').value = String(selectedIndex);
      detailPanelTitle.textContent = '新規アイテム';
      detailPanelHint.textContent = '内容を入力して「保存」で追加します。';
      form.style.display = 'block';
      syncDetailFormFromItem(newItem);
      markdownEl.value = '';
      articleAttachments = [];
      writeTopImageData = null;
      if (writeTopImagePreview) { writeTopImagePreview.style.display = 'none'; writeTopImagePreview.src = ''; }
      if (writeTopImageDrop) writeTopImageDrop.querySelector('.drop-text').textContent = 'クリックまたはドラッグで選択';
      pictureData = null;
      if (picturePreview) { picturePreview.style.display = 'none'; picturePreview.src = ''; }
      if (pictureDrop) pictureDrop.querySelector('.drop-text').textContent = 'クリックまたはドラッグで選択';
      movieUrl.value = '';
      movieFileData = null;
      if (movieFileObjectUrlForPreview) { URL.revokeObjectURL(movieFileObjectUrlForPreview); movieFileObjectUrlForPreview = null; }
      updatePreview();
      updateMoviePreview();
      renderTable();
    });
  }

  const detailSaveBtn = document.getElementById('detailSaveBtn');
  if (detailSaveBtn) {
    detailSaveBtn.addEventListener('click', async () => {
      const id = idInput.value.trim();
      if (!id) {
        statusEl.textContent = 'ID を入力してください';
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
        statusEl.textContent = 'この ID は既に使われています';
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
  updatePreview();
  showDetailEmpty();

  const origShowPanel = showPanel;
  showPanel = function (mode) {
    origShowPanel(mode);
    renderTagChips(selectedTags);
    if (mode === 'movie') updateMoviePreview();
  };
})();
