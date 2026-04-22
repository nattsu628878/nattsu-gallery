<script lang="ts">
  type OpusItem = {
    id: string;
    title?: string;
    type: 'picture' | 'movie';
    date?: string;
    tags?: string[];
    url?: string;
    assets?: { image?: string };
  };

  const GALLERY = (import.meta.env.VITE_GALLERY_BASE || '/nattsu-gallery').replace(/\/$/, '');
  const API = `${GALLERY}/api/editor/opus`;

  function todayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const withBase = (path: string) => {
    if (!path) return '';
    if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${GALLERY}${p}`;
  };
  const resolveAssetPath = (path?: string) => {
    if (!path) return '';
    if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
    return withBase(path);
  };
  const extractYouTubeVideoId = (value?: string) => {
    if (!value) return '';
    const m = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?#/]+)/);
    return m?.[1] || '';
  };
  const isDirectVideoUrl = (value?: string) => {
    if (!value) return false;
    return /^(https?:\/\/|\/|blob:|data:)/i.test(value) && /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(value);
  };

  let items: OpusItem[] = [];
  let selectedId = '';
  let status = '';
  let statusError = false;
  let showSavedOnly = false;

  let id = '';
  let title = '';
  let type: 'picture' | 'movie' = 'picture';
  let date = todayIso();
  let tags = '';
  let url = '';
  let imageBase64 = '';
  let imageFilename = '';
  let previewUrl = '';
  let videoBase64 = '';
  let videoFilename = '';
  let videoPreview = '';

  let imageInput: HTMLInputElement | undefined;
  let videoInput: HTMLInputElement | undefined;

  async function loadItems() {
    const res = await fetch(API);
    const data = await res.json();
    items = Array.isArray(data) ? data : [];
    if (!selectedId && items.length > 0) selectItem(items[0]);
  }

  $: visibleItems = showSavedOnly ? items.filter((item) => !item.id.startsWith('_draft_')) : items;

  function clearFileInputs() {
    if (imageInput) imageInput.value = '';
    if (videoInput) videoInput.value = '';
  }

  function selectItem(item: OpusItem) {
    selectedId = item.id;
    id = item.id;
    title = item.title || '';
    type = item.type || 'picture';
    date = item.date?.trim() ? item.date! : todayIso();
    tags = Array.isArray(item.tags) ? item.tags.join(', ') : '';
    url = item.url || '';
    imageBase64 = '';
    imageFilename = '';
    clearFileInputs();
    previewUrl = resolveAssetPath(item.assets?.image || '');
    videoBase64 = '';
    videoFilename = '';
    const resolvedMovieUrl = resolveAssetPath(item.url || '');
    videoPreview = item.type === 'movie' && isDirectVideoUrl(resolvedMovieUrl) ? resolvedMovieUrl : '';
  }

  function resetForm() {
    selectedId = '';
    id = '';
    title = '';
    type = 'picture';
    date = todayIso();
    tags = '';
    url = '';
    imageBase64 = '';
    imageFilename = '';
    clearFileInputs();
    previewUrl = '';
    videoBase64 = '';
    videoFilename = '';
    videoPreview = '';
  }

  async function readFileAsBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function onPickImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    imageFilename = file.name;
    previewUrl = URL.createObjectURL(file);
    imageBase64 = await readFileAsBase64(file);
  }

  async function onPickVideo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    videoFilename = file.name;
    videoPreview = URL.createObjectURL(file);
    videoBase64 = await readFileAsBase64(file);
    url = '';
  }

  $: movieSource = videoPreview || resolveAssetPath(url.trim());
  $: youtubeId = extractYouTubeVideoId(movieSource);

  async function saveOrder() {
    await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
  }

  async function move(index: number, delta: number) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const tmp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = tmp;
    items = next;
    await saveOrder();
  }

  function moveById(targetId: string, delta: number) {
    const index = items.findIndex((item) => item.id === targetId);
    if (index < 0) return;
    move(index, delta);
  }

  async function saveItem() {
    status = '';
    statusError = false;
    if (!id.trim()) {
      status = 'ID が必要です';
      statusError = true;
      return;
    }
    const payload: {
      item: OpusItem;
      image?: { filename: string; data: string };
      videoFile?: { filename: string; data: string };
    } = {
      item: {
        id: id.trim(),
        title: title.trim() || undefined,
        type,
        date: date || undefined,
        tags: tags.split(',').map((v) => v.trim()).filter(Boolean),
        url: type === 'movie' ? url.trim() || undefined : undefined,
        assets: undefined
      }
    };
    if (type === 'picture' && imageBase64 && imageFilename) {
      payload.image = { filename: imageFilename, data: imageBase64 };
    }
    if (type === 'movie' && videoBase64 && videoFilename) {
      payload.videoFile = { filename: videoFilename, data: videoBase64 };
    }
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      status = data.error || '保存に失敗しました';
      statusError = true;
      return;
    }
    status = '保存しました';
    await loadItems();
    const updated = items.find((item) => item.id === id.trim());
    if (updated) selectItem(updated);
  }

  async function deleteItem() {
    if (!id.trim()) return;
    const yes = window.confirm(`削除: ${id.trim()} ?`);
    if (!yes) return;
    const res = await fetch(`${API}?id=${encodeURIComponent(id.trim())}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      status = data.error || '削除に失敗しました';
      statusError = true;
      return;
    }
    status = '削除しました';
    statusError = false;
    await loadItems();
    resetForm();
  }

  loadItems();
</script>

<div class="editor-wrap">
  <aside class="list-pane" aria-label="登録アイテム">
    <div class="row">
      <h2 class="list-heading">Items</h2>
      <button type="button" class="oe-btn-icon" on:click={resetForm} title="新規">+</button>
    </div>
    <label class="toggle"
      ><input type="checkbox" bind:checked={showSavedOnly} /> saved only</label
    >
    <ul>
      {#each visibleItems as item}
        <li>
          <div class="item-row">
            <button
              type="button"
              class:selected={selectedId === item.id}
              on:click={() => selectItem(item)}
            >
              {item.id}
            </button>
            <div class="order-btns">
              <button type="button" class="oe-order" on:click={() => moveById(item.id, -1)} aria-label="上へ"
                >↑</button
              >
              <button type="button" class="oe-order" on:click={() => moveById(item.id, 1)} aria-label="下へ"
                >↓</button
              >
            </div>
          </div>
        </li>
      {/each}
    </ul>
  </aside>
  <section class="form-pane" aria-label="編集">
    <div class="grid">
      <label class="field-label" for="oe-id">ID</label>
      <input id="oe-id" class="field-input" bind:value={id} autocomplete="off" spellcheck="false" />
      <label class="field-label" for="oe-title">Title</label>
      <input id="oe-title" class="field-input" bind:value={title} />
      <label class="field-label" for="oe-type">Type</label>
      <select id="oe-type" class="field-input field-select" bind:value={type}>
        <option value="picture">picture</option>
        <option value="movie">movie</option>
      </select>
      <label class="field-label" for="oe-date">Date</label>
      <input id="oe-date" class="field-input" type="date" bind:value={date} />
      <label class="field-label" for="oe-tags">Tags</label>
      <input
        id="oe-tags"
        class="field-input"
        bind:value={tags}
        placeholder="foo, bar"
        autocomplete="off"
      />
      {#if type === 'picture'}
        <label class="field-label" for="oe-image">Image</label>
        <input
          id="oe-image"
          class="field-file"
          type="file"
          accept="image/*"
          bind:this={imageInput}
          on:change={onPickImage}
        />
      {:else}
        <label class="field-label" for="oe-url">URL</label>
        <input id="oe-url" class="field-input" bind:value={url} placeholder="https://…" />
        <label class="field-label" for="oe-vid">File</label>
        <input
          id="oe-vid"
          class="field-file"
          type="file"
          accept="video/*"
          bind:this={videoInput}
          on:change={onPickVideo}
        />
      {/if}
    </div>
    {#if previewUrl && type === 'picture'}
      <img class="preview" src={previewUrl} alt="preview" />
    {/if}
    {#if type === 'movie' && youtubeId}
      <iframe
        class="preview"
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
        title="YouTube preview"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    {:else if type === 'movie' && movieSource}
      <video class="preview" src={movieSource} controls playsinline>
        <track kind="captions" srclang="ja" label="captions" />
      </video>
    {/if}
    <div class="actions">
      <button type="button" class="oe-btn-primary" on:click={saveItem}>Save</button>
      <button type="button" class="oe-btn-danger" on:click={deleteItem}>Delete</button>
    </div>
    {#if status}
      <p class="oe-status {statusError ? 'oe-is-err' : 'oe-is-ok'}">{status}</p>
    {/if}
  </section>
</div>

<style>
  .editor-wrap {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 12px;
    align-items: start;
  }
  .list-heading {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--accent, #628878);
    margin: 0;
    letter-spacing: 0.02em;
  }
  .list-pane,
  .form-pane {
    border: 1px solid var(--oe-border, #e0e0e0);
    border-radius: var(--oe-radius, 6px);
    padding: 12px;
    background: #fff;
    min-width: 0;
  }
  .form-pane {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    gap: 8px;
  }
  .oe-btn-icon {
    min-width: var(--header-btn-height, 28px);
    height: var(--header-btn-height, 28px);
    padding: 0 0.5rem;
    border: 1px solid #ddd;
    background: #fff;
    color: var(--accent-dark, #4d6b5f);
    font-size: 1.1rem;
    line-height: 1;
    font-weight: 600;
    cursor: pointer;
    border-radius: 3px;
  }
  .oe-btn-icon:hover {
    border-color: var(--accent, #628878);
    color: var(--accent, #628878);
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 70vh;
    overflow: auto;
    border: 1px solid #eee;
    border-radius: 4px;
  }
  li {
    border-bottom: 1px solid #f0f0f0;
  }
  li:last-child {
    border-bottom: none;
  }
  .item-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px;
    align-items: center;
  }
  .item-row > button {
    width: 100%;
    text-align: left;
    padding: 7px 9px;
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: 0.8rem;
    color: #333;
  }
  .item-row > button:hover {
    background: var(--accent-bg, rgba(98, 136, 120, 0.12));
  }
  .item-row > button.selected {
    background: var(--accent-bg, rgba(98, 136, 120, 0.18));
    color: var(--accent-dark, #4d6b5f);
    font-weight: 600;
  }
  .toggle {
    display: block;
    margin: 0 0 8px;
    font-size: 0.72rem;
    color: #666;
  }
  .order-btns {
    display: flex;
    gap: 2px;
    padding-right: 4px;
  }
  .oe-order {
    width: 28px;
    height: 26px;
    padding: 0;
    text-align: center;
    border: 1px solid #ddd;
    background: #fff;
    color: #666;
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 3px;
  }
  .oe-order:hover {
    border-color: var(--accent, #628878);
    color: var(--accent, #628878);
  }
  .grid {
    display: grid;
    grid-template-columns: 5.2rem 1fr;
    gap: 9px 10px;
    align-items: center;
  }
  .field-label {
    font-size: 0.72rem;
    color: #666;
    font-weight: 500;
    min-width: 0;
  }
  .field-input {
    min-width: 0;
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0.35rem 0.5rem;
    font-size: 0.86rem;
    background: #fff;
    color: #333;
  }
  .field-input:hover {
    border-color: #ccc;
  }
  .field-input:focus {
    outline: 2px solid var(--accent-bg, rgba(98, 136, 120, 0.35));
    border-color: var(--accent, #628878);
  }
  .field-select {
    cursor: pointer;
  }
  .field-file {
    font-size: 0.8rem;
    width: 100%;
    min-width: 0;
  }
  .preview {
    max-width: min(520px, 100%);
    max-height: 320px;
    margin-top: 12px;
    border-radius: 6px;
    border: 1px solid #eee;
  }
  .actions {
    margin-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .oe-btn-primary {
    height: var(--header-btn-height, 28px);
    padding: 0 1rem;
    border: 1px solid var(--accent, #628878);
    background: var(--accent, #628878);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 3px;
  }
  .oe-btn-primary:hover {
    background: var(--accent-dark, #4d6b5f);
    border-color: var(--accent-dark, #4d6b5f);
  }
  .oe-btn-primary:focus-visible {
    outline: 2px solid var(--accent, #628878);
    outline-offset: 2px;
  }
  .oe-btn-danger {
    height: var(--header-btn-height, 28px);
    padding: 0 0.9rem;
    border: 1px solid #ddd;
    background: #fff;
    color: #b00020;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 3px;
  }
  .oe-btn-danger:hover {
    border-color: #b00020;
    background: #fff5f5;
  }
  .oe-status {
    margin: 10px 0 0;
    font-size: 0.8rem;
    padding: 0.4rem 0.55rem;
    border-radius: 4px;
  }
  .oe-is-ok {
    color: #2e5a45;
    background: var(--accent-bg, rgba(98, 136, 120, 0.12));
  }
  .oe-is-err {
    color: #b00020;
    background: #ffebee;
  }
  @media (max-width: 700px) {
    .editor-wrap {
      grid-template-columns: 1fr;
    }
    ul {
      max-height: 40vh;
    }
  }
</style>
