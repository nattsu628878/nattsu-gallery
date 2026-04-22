<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  type Item = {
    id: string;
    title?: string;
    type?: string;
    date?: string;
    tags?: string[];
    url?: string;
    thumbnail?: string;
    assets?: {
      image?: string;
      wav?: string;
      midi?: string;
    };
  };

  export let items: Item[] = [];

  const ITEMS_PER_ROW = 5;
  const VIEWS = ['grid', 'table', 'simple'] as const;
  type ViewType = (typeof VIEWS)[number];

  let currentView: ViewType = 'grid';
  let sortOrder: 'asc' | 'desc' = 'asc';
  let filterTag = '';
  let showMovie = true;
  let showPicture = true;
  let showHeaderOptions = false;
  let prefersReducedMotion = false;

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('view');
    const stored = window.localStorage.getItem('currentView');
    if (q && VIEWS.includes(q as ViewType)) currentView = q as ViewType;
    else if (stored && VIEWS.includes(stored as ViewType)) currentView = stored as ViewType;
  }

  onMount(() => {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    showHeaderOptions = true;
  });

  $: filteredByType = items.filter((item) => {
    if (item.type === 'movie' && !showMovie) return false;
    if (item.type === 'picture' && !showPicture) return false;
    return true;
  });

  $: allTags = Array.from(
    new Set(filteredByType.flatMap((item) => (Array.isArray(item.tags) ? item.tags : [])))
  ).sort((a, b) => a.localeCompare(b));

  $: tableItems = [...filteredByType]
    .filter((item) => !filterTag || (item.tags ?? []).includes(filterTag))
    .sort((a, b) => {
      const da = a.date ?? '';
      const db = b.date ?? '';
      const cmp = da.localeCompare(db);
      return sortOrder === 'desc' ? -cmp : cmp;
    });

  $: shuffled = shuffle(filteredByType);
  $: gridRows = chunk(shuffled, ITEMS_PER_ROW);

  function shuffle<T>(arr: T[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function chunk<T>(arr: T[], size: number) {
    const rows: T[][] = [];
    for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
    return rows;
  }

  function setView(view: ViewType) {
    currentView = view;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('currentView', view);
      const params = new URLSearchParams(window.location.search);
      params.set('view', view);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }

  function extractVideoId(url?: string) {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#/]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  function getThumbnailUrl(item: Item) {
    if (item.assets?.image) return item.assets.image;
    if (item.thumbnail) return item.thumbnail;
    if (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be'))) {
      const videoId = extractVideoId(item.url);
      if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    if (item.url) return item.url;
    return '';
  }

  function onImageError(event: Event, item: Item) {
    const target = event.target as HTMLImageElement;
    if (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be'))) {
      const videoId = extractVideoId(item.url);
      if (videoId && target.src.includes('maxresdefault')) {
        target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        return;
      }
    }
    target.src = `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect fill="#f0f0f0" width="400" height="225"/><text fill="#999" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".35em">-</text></svg>'
    )}`;
  }

  function executeAction(item: Item) {
    if (item.type === 'picture') {
      const imgUrl = item.assets?.image || item.thumbnail;
      if (imgUrl) {
        window.open(imgUrl, '_blank');
        return;
      }
    }
    if (item.assets?.wav) {
      window.open(`audioplayer.html?file=${encodeURIComponent(item.assets.wav)}`, '_blank');
      return;
    }
    if (item.assets?.midi) {
      window.open(`midi.html?file=${encodeURIComponent(item.assets.midi)}`, '_blank');
      return;
    }
    if (item.url) window.open(item.url, '_blank');
  }

  const goTo = (href: string) => {
    window.location.href = href;
  };
</script>

<div class="container">
  <header>
    <div class="header-row header-row-top">
      <h1 class="header-title">natʇsu</h1>
      <div class="mode-toggle">
        <button class="view-btn active" on:click={() => goTo('/opus/?view=grid')}>Opus</button>
        <button class="view-btn" on:click={() => goTo('/aboutme/')}>About Me</button>
        <button class="view-btn" on:click={() => goTo('/article/')}>Article</button>
      </div>
    </div>
    {#if showHeaderOptions}
      <div
        class="header-row header-row-bottom"
        in:fly={{ x: 20, duration: prefersReducedMotion ? 0 : 460, opacity: 0 }}
      >
        <div class="header-controls">
          {#if currentView === 'grid'}
            <div class="setting-item type-filter-group">
              <span class="type-filter-label">Type</span>
              <button
                type="button"
                class={`filter-toggle ${showMovie ? 'filter-toggle--on' : 'filter-toggle--off'}`}
                on:click={() => (showMovie = !showMovie)}
                aria-pressed={showMovie}
              >Video</button>
              <button
                type="button"
                class={`filter-toggle ${showPicture ? 'filter-toggle--on' : 'filter-toggle--off'}`}
                on:click={() => (showPicture = !showPicture)}
                aria-pressed={showPicture}
              >Image</button>
            </div>
          {/if}
          {#if currentView === 'table'}
            <div class="header-view-controls">
              <div class="setting-item">
                <label for="sortOrderTable">Sort</label>
                <select id="sortOrderTable" bind:value={sortOrder}>
                  <option value="asc">Date</option>
                  <option value="desc">Date (rev)</option>
                </select>
              </div>
              <div class="setting-item">
                <label for="filterTagTable">Tag</label>
                <select id="filterTagTable" bind:value={filterTag}>
                  <option value="">All</option>
                  {#each allTags as tag}
                    <option value={tag}>{tag}</option>
                  {/each}
                </select>
              </div>
            </div>
          {/if}
          <div class="view-toggle">
            <button class={`view-btn ${currentView === 'grid' ? 'active' : ''}`} on:click={() => setView('grid')}>Grid</button>
            <button class={`view-btn ${currentView === 'table' ? 'active' : ''}`} on:click={() => setView('table')}>Table</button>
            <button class={`view-btn ${currentView === 'simple' ? 'active' : ''}`} on:click={() => setView('simple')}>Simple</button>
          </div>
        </div>
      </div>
    {/if}
  </header>

  <main>
    {#if currentView === 'grid'}
      <section class="mode-section">
        <div class="gallery">
          {#if gridRows.length === 0}
            <p class="empty-msg">No data</p>
          {:else}
            {#each gridRows as row}
              <div class="grid-row">
                <div class="grid-row-track">
                  {#each row as item}
                    <div class="media-card" data-id={item.id} on:click={() => executeAction(item)}>
                      <div class="thumbnail">
                        <img src={getThumbnailUrl(item)} alt={item.title || item.id} loading="lazy" on:error={(e) => onImageError(e, item)} />
                      </div>
                      <div class="grid-card-title">{item.title || item.id}</div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </section>
    {:else if currentView === 'table'}
      <section class="table-view">
        {#if tableItems.length === 0}
          <p class="empty-msg">No data</p>
        {:else}
          <table>
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Title</th>
                <th>Date</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {#each tableItems as item}
                <tr data-id={item.id} on:click={() => executeAction(item)}>
                  <td>
                    <img class="table-thumbnail" src={getThumbnailUrl(item)} alt={item.title || item.id} loading="lazy" on:error={(e) => onImageError(e, item)} />
                  </td>
                  <td class="table-title">{item.title || item.id}</td>
                  <td class="table-date">{item.date || '-'}</td>
                  <td>
                    <div class="table-tags">
                      {#if item.tags && item.tags.length > 0}
                        {#each [...item.tags].sort((a, b) => a.localeCompare(b)) as tag}
                          <span class="table-tag">{tag}</span>
                        {/each}
                      {:else}
                        -
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </section>
    {:else}
      <section class="simple-view">
        {#if filteredByType.length === 0}
          <p class="empty-msg">No data</p>
        {:else}
          <ul class="simple-list">
            {#each filteredByType as item}
              <li class="simple-item">{item.id}</li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  </main>
</div>
