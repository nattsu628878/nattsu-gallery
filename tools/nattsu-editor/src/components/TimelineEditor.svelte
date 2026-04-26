<script lang="ts">
  type TimelineItem = { id: string; date?: string; account?: string; content?: string; quoteTo?: string; assets?: { image?: string; video?: string } };
  const API = 'http://127.0.0.1:4321/nattsu-gallery/api/editor/timeline';
  const resolveAssetPath = (path?: string) => {
    if (!path) return '';
    if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
    return `http://127.0.0.1:4321/nattsu-gallery${path.startsWith('/') ? path : `/${path}`}`;
  };
  const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const generateIdFromDate = (dateValue: string, existingItems: TimelineItem[]) => {
    const baseId = dateValue || todayIso();
    const used = new Set(existingItems.map((item) => item.id));
    if (!used.has(baseId)) return baseId;
    let index = 2;
    while (used.has(`${baseId}-${index}`)) index += 1;
    return `${baseId}-${index}`;
  };
  const ACCOUNT_OPTIONS = [
    { value: 'nattsu', label: 'natʇsu' },
    { value: 'emo', label: '翠懐' },
    { value: 'tech', label: 'halcyon::詞音' }
  ] as const;

  let items: TimelineItem[] = [];
  let selectedId = '';
  let status = '';
  let statusError = false;
  let id = '';
  let date = todayIso();
  let account = 'nattsu';
  let content = '';
  let quoteTo = '';
  let selectingQuote = false;
  let imageBase64 = '';
  let imageFilename = '';
  let previewUrl = '';
  let imageInput: HTMLInputElement | undefined;
  let videoBase64 = '';
  let videoFilename = '';
  let videoPreview = '';
  let videoInput: HTMLInputElement | undefined;
  let sourceImageUrl = '';
  let rotateQuarterTurns = 0;

  async function loadItems() {
    const res = await fetch(API);
    const data = await res.json();
    items = Array.isArray(data) ? data : [];
    if (!selectedId && items.length > 0) selectItem(items[0]);
    if (!selectedId && items.length === 0) resetForm();
  }
  const clearFileInput = () => {
    if (imageInput) imageInput.value = '';
    if (videoInput) videoInput.value = '';
  };
  function selectItem(item: TimelineItem) {
    selectedId = item.id;
    id = item.id;
    date = item.date?.trim() ? item.date : todayIso();
    account = item.account || 'nattsu';
    content = item.content || '';
    quoteTo = item.quoteTo || '';
    imageBase64 = '';
    imageFilename = '';
    videoBase64 = '';
    videoFilename = '';
    clearFileInput();
    previewUrl = resolveAssetPath(item.assets?.image || '');
    videoPreview = resolveAssetPath(item.assets?.video || '');
  }
  function resetForm() {
    selectedId = '';
    date = todayIso();
    id = generateIdFromDate(date, items);
    account = 'nattsu';
    content = '';
    quoteTo = '';
    imageBase64 = '';
    imageFilename = '';
    videoBase64 = '';
    videoFilename = '';
    previewUrl = '';
    videoPreview = '';
    sourceImageUrl = '';
    rotateQuarterTurns = 0;
    clearFileInput();
  }
  function createDraft() {
    resetForm();
    selectedId = '__new__';
  }
  function onListItemClick(item: TimelineItem) {
    if (!selectingQuote) {
      selectItem(item);
      return;
    }
    if (!selectedId) {
      status = '先に引用元ではなく、編集する投稿を選択してください';
      statusError = true;
      selectingQuote = false;
      return;
    }
    if (item.id === id) {
      status = '自分自身は引用できません';
      statusError = true;
      selectingQuote = false;
      return;
    }
    quoteTo = item.id;
    selectingQuote = false;
    status = '';
    statusError = false;
  }
  function onDateChangeForNewItem(nextDate: string) {
    date = nextDate;
    if (!selectedId || selectedId === '__new__') id = generateIdFromDate(nextDate, items);
  }
  async function readFileAsBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  async function getImageSize(src: string) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('画像サイズの読み込みに失敗しました'));
      image.src = src;
    });
  }
  async function applyImageEdits() {
    if (!sourceImageUrl) return;
    const sourceImage = new Image();
    await new Promise<void>((resolve, reject) => {
      sourceImage.onload = () => resolve();
      sourceImage.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      sourceImage.src = sourceImageUrl;
    });

    const rotated = ((rotateQuarterTurns % 4) + 4) % 4;
    const outputWidth = rotated % 2 === 0 ? sourceImage.naturalWidth : sourceImage.naturalHeight;
    const outputHeight = rotated % 2 === 0 ? sourceImage.naturalHeight : sourceImage.naturalWidth;
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (rotated === 1) {
      ctx.translate(outputWidth, 0);
      ctx.rotate(Math.PI / 2);
    } else if (rotated === 2) {
      ctx.translate(outputWidth, outputHeight);
      ctx.rotate(Math.PI);
    } else if (rotated === 3) {
      ctx.translate(0, outputHeight);
      ctx.rotate(-Math.PI / 2);
    }
    ctx.drawImage(sourceImage, 0, 0);
    ctx.restore();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), 'image/png'));
    if (!blob) return;
    const file = new File([blob], imageFilename || `${id || 'image'}.png`, { type: 'image/png' });
    imageBase64 = await readFileAsBase64(file);
    previewUrl = URL.createObjectURL(blob);
    sourceImageUrl = previewUrl;
    rotateQuarterTurns = 0;
  }
  async function onPickImage(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    imageFilename = file.name;
    previewUrl = URL.createObjectURL(file);
    sourceImageUrl = previewUrl;
    await getImageSize(previewUrl);
    rotateQuarterTurns = 0;
    imageBase64 = await readFileAsBase64(file);
  }
  async function onPickVideo(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    videoFilename = file.name;
    videoPreview = URL.createObjectURL(file);
    videoBase64 = await readFileAsBase64(file);
  }
  async function saveOrder() {
    await fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) });
  }
  async function move(index: number, delta: number) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    items = next;
    await saveOrder();
  }
  const moveById = (targetId: string, delta: number) => {
    const index = items.findIndex((item) => item.id === targetId);
    if (index >= 0) move(index, delta);
  };
  $: quoteCandidates = items
    .filter((item) => item.id !== id)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  async function saveItem() {
    status = '';
    statusError = false;
    if (!id.trim()) { status = 'ID が必要です'; statusError = true; return; }
    const payload: {
      item: TimelineItem;
      image?: { filename: string; data: string };
      videoFile?: { filename: string; data: string };
    } = {
      item: {
        id: id.trim(),
        date: date || undefined,
        account: account || 'nattsu',
        content: content.trim() || undefined,
        quoteTo: quoteTo.trim() || undefined
      }
    };
    if (imageBase64 && imageFilename) payload.image = { filename: imageFilename, data: imageBase64 };
    if (videoBase64 && videoFilename) payload.videoFile = { filename: videoFilename, data: videoBase64 };
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { status = data.error || '保存に失敗しました'; statusError = true; return; }
    status = '';
    await loadItems();
    const updated = items.find((item) => item.id === id.trim());
    if (updated) selectItem(updated);
  }
  async function deleteItem() {
    if (!id.trim()) return;
    if (!window.confirm(`削除: ${id.trim()} ?`)) return;
    const res = await fetch(`${API}?id=${encodeURIComponent(id.trim())}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { status = data.error || '削除に失敗しました'; statusError = true; return; }
    status = '';
    statusError = false;
    await loadItems();
    resetForm();
  }
  loadItems();
</script>

<div class="editor-wrap">
  <aside class="list-pane">
    <div class="row">
      <h2 class="list-heading">Items</h2>
      <button type="button" class="oe-btn-icon" on:click={createDraft}>+</button>
    </div>
    <ul>
      {#each items as item}
        <li>
          <div class="item-row">
            <div class="item-main">
              {#if item.assets?.video}
                <video class="item-preview" src={resolveAssetPath(item.assets.video)} muted playsinline preload="metadata"></video>
              {:else if item.assets?.image}
                <img class="item-preview" src={resolveAssetPath(item.assets.image)} alt="" />
              {:else}
                <div class="item-preview item-preview--empty"></div>
              {/if}
              <button type="button" class:selected={selectedId === item.id} on:click={() => onListItemClick(item)}>{item.id}</button>
            </div>
            <div class="order-btns">
              <button type="button" class="oe-order" on:click={() => moveById(item.id, -1)}>↑</button>
              <button type="button" class="oe-order" on:click={() => moveById(item.id, 1)}>↓</button>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  </aside>
  {#if selectedId}
  <section class="form-pane">
    <div class="grid">
      <label class="field-label" for="te-id">ID</label><input id="te-id" class="field-input" bind:value={id} />
      <label class="field-label" for="te-date">Date</label><input id="te-date" class="field-input" type="date" value={date} on:input={(event) => onDateChangeForNewItem((event.currentTarget as HTMLInputElement).value)} />
      <label class="field-label" for="te-account">Account</label><div id="te-account" class="toggle-group">{#each ACCOUNT_OPTIONS as itemAccount}<button type="button" class={`toggle-btn ${account === itemAccount.value ? 'is-on' : ''}`} on:click={() => (account = itemAccount.value)}>{itemAccount.label}</button>{/each}</div>
      <label class="field-label" for="te-content">Content</label><textarea id="te-content" class="field-input field-textarea" bind:value={content}></textarea>
      <label class="field-label" for="te-quote-current">Quote</label><div class="stack-field"><div class="toggle-group"><button type="button" class={`toggle-btn ${selectingQuote ? 'is-on' : ''}`} on:click={() => (selectingQuote = !selectingQuote)}>{selectingQuote ? '引用先を選択中' : '引用する'}</button><button type="button" class="toggle-btn" on:click={() => { quoteTo = ''; selectingQuote = false; }}>引用解除</button></div><input id="te-quote-current" class="field-input" value={quoteTo || '(なし)'} readonly /></div>
      <label class="field-label" for="te-image">Image</label><input id="te-image" class="field-file" type="file" accept="image/*" bind:this={imageInput} on:change={onPickImage} />
      <label class="field-label" for="te-video">Video</label><input id="te-video" class="field-file" type="file" accept="video/*" bind:this={videoInput} on:change={onPickVideo} />
    </div>
    {#if sourceImageUrl}
      <div class="image-tools">
        <div class="tool-row">
          <button type="button" class="oe-btn-icon" on:click={() => (rotateQuarterTurns = (rotateQuarterTurns + 1) % 4)}>↻</button>
          <span class="tool-label">回転: {rotateQuarterTurns * 90}°</span>
          <button type="button" class="oe-btn-primary" on:click={applyImageEdits}>画像編集を適用</button>
        </div>
      </div>
    {/if}
    {#if previewUrl}<img class="preview" src={previewUrl} alt="preview" />{/if}
    {#if videoPreview}<video class="preview" src={videoPreview} controls playsinline><track kind="captions" srclang="ja" label="captions" /></video>{/if}
    <div class="actions"><button type="button" class="oe-btn-primary" on:click={saveItem}>Save</button><button type="button" class="oe-btn-danger" on:click={deleteItem}>Delete</button></div>
    {#if status}<p class="oe-status {statusError ? 'oe-is-err' : 'oe-is-ok'}">{status}</p>{/if}
  </section>
  {/if}
</div>

<style>
  .editor-wrap { display:grid; grid-template-columns:260px 1fr; gap:12px; align-items:start; }
  .list-pane,.form-pane { border:1px solid #e0e0e0; border-radius:6px; padding:12px; background:#fff; min-width:0; }
  .list-heading { font-size:.8rem; font-weight:600; color:var(--accent,#628878); margin:0; }
  .row { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .oe-btn-icon { min-width:28px; height:28px; border:1px solid #ddd; background:#fff; border-radius:3px; cursor:pointer; }
  ul { list-style:none; padding:0; margin:0; max-height:70vh; overflow:auto; border:1px solid #eee; border-radius:4px; }
  li { border-bottom:1px solid #f0f0f0; }
  .item-row { display:grid; grid-template-columns:1fr auto; gap:6px; align-items:center; }
  .item-main { display:flex; align-items:center; gap:6px; min-width:0; }
  .item-preview { width:34px; height:34px; object-fit:cover; border-radius:4px; border:1px solid #e4e4e4; flex-shrink:0; background:#fafafa; }
  .item-preview--empty { background:#f3f3f3; }
  .item-main > button { width:100%; text-align:left; padding:7px 9px; border:0; background:transparent; cursor:pointer; font-size:.8rem; }
  .item-main > button.selected { background:rgba(98,136,120,.18); color:#4d6b5f; font-weight:600; }
  .order-btns { display:flex; gap:2px; padding-right:4px; }
  .oe-order { width:28px; height:26px; border:1px solid #ddd; background:#fff; border-radius:3px; cursor:pointer; }
  .grid { display:grid; grid-template-columns:5.2rem 1fr; gap:9px 10px; align-items:center; }
  .field-label { font-size:.72rem; color:#666; font-weight:500; }
  .field-input { width:100%; border:1px solid #ddd; border-radius:3px; padding:.35rem .5rem; font-size:.86rem; background:#fff; color:#333; }
  .field-textarea { min-height:6.2rem; resize:vertical; }
  .field-file { font-size:.8rem; width:100%; }
  .stack-field { display:flex; flex-direction:column; gap:0.35rem; }
  .toggle-group { display:flex; flex-wrap:wrap; gap:0.3rem; }
  .toggle-btn {
    height: var(--header-btn-height, 28px);
    padding: 0 var(--header-btn-padding-x, 0.6rem);
    border: 1px solid #ddd;
    background: #fff;
    color: #666;
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    line-height: 1;
  }
  .toggle-btn:hover { border-color: var(--accent, #628878); color: var(--accent, #628878); }
  .toggle-btn.is-on { background: var(--accent, #628878); color: #fff; border-color: var(--accent, #628878); }
  .preview { max-width:min(520px,100%); max-height:320px; margin-top:12px; border-radius:6px; border:1px solid #eee; }
  .image-tools { margin-top:12px; padding:10px; border:1px solid #eee; border-radius:6px; background:#fcfcfc; }
  .tool-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .tool-label { font-size:.75rem; color:#555; }
  .actions { margin-top:14px; display:flex; gap:8px; }
  .oe-btn-primary { height:28px; padding:0 1rem; border:1px solid #628878; background:#628878; color:#fff; border-radius:3px; cursor:pointer; }
  .oe-btn-danger { height:28px; padding:0 .9rem; border:1px solid #ddd; background:#fff; color:#b00020; border-radius:3px; cursor:pointer; }
  .oe-status { margin:10px 0 0; font-size:.8rem; padding:.4rem .55rem; border-radius:4px; }
  .oe-is-ok { color:#2e5a45; background:rgba(98,136,120,.12); }
  .oe-is-err { color:#b00020; background:#ffebee; }
  @media (max-width:700px) { .editor-wrap { grid-template-columns:1fr; } }
</style>
