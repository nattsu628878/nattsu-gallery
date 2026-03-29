(function () {
  const API = '/api/article';
  let articles = [];
  let selectedId = null;
  let isNew = false;

  const tbody = document.getElementById('articleTableBody');
  const detailForm = document.getElementById('detailForm');
  const detailTitle = document.getElementById('detailPanelTitle');
  const aeId = document.getElementById('aeId');
  const aeTitle = document.getElementById('aeTitle');
  const aeDate = document.getElementById('aeDate');
  const aeTags = document.getElementById('aeTags');
  const aeFile = document.getElementById('aeFile');
  const aeMarkdown = document.getElementById('aeMarkdown');
  const aeStatus = document.getElementById('aeStatus');
  const addRowBtn = document.getElementById('addRowBtn');
  const aeSaveBtn = document.getElementById('aeSaveBtn');
  const aeDeleteBtn = document.getElementById('aeDeleteBtn');

  function todayDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function suggestId() {
    const base = todayDate();
    const used = articles.filter((a) => a.id === base || a.id.startsWith(base + '-'));
    if (used.length === 0) return base;
    const nums = used.map((a) => (a.id === base ? 1 : parseInt(a.id.slice(base.length + 1), 10))).filter((n) => !isNaN(n));
    const max = Math.max(0, ...nums);
    return base + '-' + (max + 1);
  }

  async function loadList() {
    try {
      const res = await fetch(API + '/articles');
      if (!res.ok) throw new Error(res.statusText);
      articles = await res.json();
      if (!Array.isArray(articles)) articles = [];
      renderTable();
      aeStatus.textContent = '';
      aeStatus.className = 'status';
    } catch (e) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="4">接続エラー（opus-editer で npm start）</td></tr>';
      aeStatus.textContent = '接続エラー';
      aeStatus.className = 'status error';
    }
  }

  function renderTable() {
    if (!tbody) return;
    if (articles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">（なし）</td></tr>';
      return;
    }
    const sorted = [...articles].sort((a, b) => {
      const da = (a.date || '').trim();
      const db = (b.date || '').trim();
      return db.localeCompare(da);
    });
    tbody.innerHTML = sorted
      .map((a) => {
        const sel = selectedId === a.id ? ' class="selected"' : '';
        return `<tr data-id="${escapeAttr(a.id)}"${sel}><td>${escapeHtml(a.id)}</td><td>${escapeHtml(a.title || '')}</td><td>${escapeHtml(a.date || '')}</td><td>${escapeHtml(a.file || '')}</td></tr>`;
      })
      .join('');
    tbody.querySelectorAll('tr[data-id]').forEach((tr) => {
      tr.addEventListener('click', () => selectRow(tr.getAttribute('data-id')));
    });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/"/g, '&quot;');
  }

  async function selectRow(id) {
    if (!id) return;
    selectedId = id;
    isNew = false;
    const item = articles.find((a) => a.id === id);
    if (!item) return;
    detailForm.style.display = 'block';
    detailTitle.textContent = item.id;
    aeId.value = item.id;
    aeId.readOnly = true;
    aeTitle.value = item.title || '';
    aeDate.value = (item.date || '').trim();
    aeTags.value = Array.isArray(item.tags) ? item.tags.join(', ') : '';
    aeFile.value = item.file || '';
    aeMarkdown.value = '';
    aeStatus.textContent = '';
    aeStatus.className = 'status';
    renderTable();
    const path = '/pages/article/assets/' + encodeURIComponent(item.file);
    try {
      const res = await fetch(path, { cache: 'no-store' });
      aeMarkdown.value = res.ok ? await res.text() : '';
    } catch (_) {
      aeMarkdown.value = '';
    }
  }

  function openNew() {
    selectedId = null;
    isNew = true;
    if (aeFile) delete aeFile.dataset.touched;
    detailForm.style.display = 'block';
    detailTitle.textContent = '新規';
    aeId.value = suggestId();
    aeId.readOnly = false;
    aeTitle.value = '';
    aeDate.value = todayDate();
    aeTags.value = '';
    aeFile.value = aeId.value + '.md';
    aeMarkdown.value = '# Title\n\n';
    aeStatus.textContent = '';
    aeStatus.className = 'status';
    renderTable();
  }

  async function save() {
    const id = (aeId.value || '').trim();
    if (!id) {
      aeStatus.textContent = 'ID 必須';
      aeStatus.className = 'status error';
      return;
    }
    const payload = {
      id,
      title: (aeTitle.value || '').trim() || id,
      date: (aeDate.value || '').trim() || undefined,
      tags: (aeTags.value || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      file: (aeFile.value || '').trim() || id + '.md',
      markdown: aeMarkdown.value || '',
      update: !isNew,
    };
    aeStatus.textContent = '';
    aeStatus.className = 'status';
    try {
      const res = await fetch(API + '/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        aeStatus.textContent = data.error || 'エラー';
        aeStatus.className = 'status error';
        return;
      }
      aeStatus.textContent = '保存';
      aeStatus.className = 'status success';
      await loadList();
      await selectRow(data.article.id);
      isNew = false;
    } catch (e) {
      aeStatus.textContent = '接続エラー';
      aeStatus.className = 'status error';
    }
  }

  async function remove() {
    const id = (aeId.value || '').trim();
    if (!id || isNew) return;
    if (!confirm('削除: ' + id + ' ?')) return;
    try {
      const res = await fetch(API + '/' + encodeURIComponent(id), { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        aeStatus.textContent = data.error || 'エラー';
        aeStatus.className = 'status error';
        return;
      }
      selectedId = null;
      detailForm.style.display = 'none';
      detailTitle.textContent = '';
      await loadList();
    } catch (e) {
      aeStatus.textContent = '接続エラー';
      aeStatus.className = 'status error';
    }
  }

  aeId.addEventListener('input', () => {
    if (isNew && aeFile) {
      const id = (aeId.value || '').trim();
      if (id && !aeFile.dataset.touched) aeFile.value = id + '.md';
    }
  });
  aeFile.addEventListener('input', () => {
    aeFile.dataset.touched = '1';
  });

  if (addRowBtn) addRowBtn.addEventListener('click', openNew);
  if (aeSaveBtn) aeSaveBtn.addEventListener('click', save);
  if (aeDeleteBtn) aeDeleteBtn.addEventListener('click', remove);

  loadList();
})();
