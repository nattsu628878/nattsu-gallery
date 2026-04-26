<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  type TriState = 'include' | 'exclude' | 'off';
  type TimelineItem = {
    id: string;
    date?: string;
    account?: string;
    content?: string;
    quoteTo?: string;
    order?: number;
    assets?: {
      image?: string;
      video?: string;
    };
  };

  export let items: TimelineItem[] = [];

  const base =
    ((import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/');
  const withBase = (path: string) => `${base}${path.replace(/^\/+/, '')}`;
  const modeRoutes = ['opus/?view=grid', 'article/', 'timeline/', 'aboutme/'] as const;
  const accountProfiles: Record<string, { label: string; avatar: string }> = {
    nattsu: { label: 'natʇsu', avatar: withBase('timeline/nattsu_320_320_tt.webp') },
    emo: { label: '翠懐', avatar: withBase('timeline/emo.webp') },
    tech: { label: 'halcyon::詞音', avatar: withBase('timeline/tech.webp') }
  };
  let accountFilterStates: Record<string, TriState> = {};
  let showHeaderOptions = false;
  let prefersReducedMotion = false;
  const resolveSitePath = (path?: string) => {
    if (!path) return '';
    if (/^https?:\/\//.test(path) || path.startsWith('data:')) return path;
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    if (path === normalizedBase || path.startsWith(normalizedBase)) return path;
    return withBase(path);
  };

  const goTo = (href: string) => {
    window.location.href = withBase(href);
  };

  const getAccountAvatar = (account?: string) => {
    const key = account || 'nattsu';
    return accountProfiles[key]?.avatar || accountProfiles.nattsu.avatar;
  };
  const getAccountLabel = (account?: string) => {
    const key = account || 'nattsu';
    return accountProfiles[key]?.label || key;
  };

  onMount(() => {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    showHeaderOptions = true;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      event.preventDefault();
      const currentIndex = 2;
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + delta + modeRoutes.length) % modeRoutes.length;
      goTo(modeRoutes[nextIndex]);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  $: allAccounts = ['nattsu', 'emo', 'tech'].filter((account) =>
    items.some((item) => (item.account || 'nattsu') === account)
  );
  $: if (allAccounts.length === 0) allAccounts = ['nattsu', 'emo', 'tech'];
  $: {
    const next: Record<string, TriState> = {};
    for (const account of allAccounts) next[account] = accountFilterStates[account] ?? 'off';
    accountFilterStates = next;
  }
  $: includedAccounts = allAccounts.filter((account) => accountFilterStates[account] === 'include');
  $: excludedAccounts = allAccounts.filter((account) => accountFilterStates[account] === 'exclude');
  $: isAccountAllOn = includedAccounts.length === 0 && excludedAccounts.length === 0;
  $: filteredItems = items.filter((item) => {
    const account = item.account || 'nattsu';
    if (isAccountAllOn) return true;
    if (includedAccounts.length > 0 && !includedAccounts.includes(account)) return false;
    if (excludedAccounts.includes(account)) return false;
    return true;
  });
  $: timelineItems = [...filteredItems].sort((a, b) => {
    const c = (b.date ?? '').localeCompare(a.date ?? '');
    if (c !== 0) return c;
    const oa = a.order ?? 0;
    const ob = b.order ?? 0;
    if (oa !== ob) return ob - oa;
    return a.id.localeCompare(b.id);
  });
  $: timelineItemMap = new Map(items.map((item) => [item.id, item] as const));

  const cycleAccountState = (account: string) => {
    const current = accountFilterStates[account] ?? 'off';
    const next: TriState =
      current === 'off' ? 'include' : current === 'include' ? 'exclude' : 'off';
    accountFilterStates = { ...accountFilterStates, [account]: next };
  };

  const resetAccountFilters = () => {
    const next: Record<string, TriState> = {};
    for (const account of allAccounts) next[account] = 'off';
    accountFilterStates = next;
  };
  const getQuotedItem = (item: TimelineItem) => {
    const targetId = item.quoteTo?.trim();
    if (!targetId) return null;
    return timelineItemMap.get(targetId) || null;
  };
</script>

<div class="container">
  <header>
    <div class="header-row header-row-top">
      <h1 class="header-title">natʇsu</h1>
      <div class="mode-toggle" id="modeToggle">
        <button class="view-btn" on:click={() => goTo('opus/?view=grid')}>Opus</button>
        <button class="view-btn" on:click={() => goTo('article/')}>Article</button>
        <button class="view-btn active" on:click={() => goTo('timeline/')}>Time Line</button>
        <button class="view-btn" on:click={() => goTo('aboutme/')}>About Me</button>
      </div>
    </div>
    <div class="header-row-bottom-wrap" class:is-open={showHeaderOptions}>
      {#if showHeaderOptions}
        <div
          class="header-row header-row-bottom"
          in:fly={{ x: 20, duration: prefersReducedMotion ? 0 : 460, opacity: 0 }}
        >
          <div class="setting-item type-filter-group">
            <span class="type-filter-label">Account</span>
            <button
              type="button"
              class={`filter-toggle ${isAccountAllOn ? 'filter-toggle--on' : 'filter-toggle--off'}`}
              on:click={resetAccountFilters}
              aria-pressed={isAccountAllOn}
            >
              ALL
            </button>
            {#each allAccounts as account}
              <button
                type="button"
                class={`filter-toggle ${
                  accountFilterStates[account] === 'include'
                    ? 'filter-toggle--on'
                    : accountFilterStates[account] === 'exclude'
                      ? 'filter-toggle--exclude'
                      : 'filter-toggle--off'
                }`}
                on:click={() => cycleAccountState(account)}
                aria-pressed={accountFilterStates[account] !== 'off'}
              >
                {getAccountLabel(account)}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </header>

  <main>
    <section class="timeline-section">
      {#if timelineItems.length === 0}
        <p class="timeline-empty">No posts yet.</p>
      {:else}
        <div class="timeline-list">
          {#each timelineItems as item (item.id)}
            <article class="timeline-card">
              <img class="timeline-avatar" src={getAccountAvatar(item.account)} width="44" height="44" alt="プロフィール画像" />
              <div class="timeline-body">
                <div class="timeline-meta">
                  <span class="timeline-name">{getAccountLabel(item.account)}</span>
                  <span class="timeline-date">{item.date || '-'}</span>
                </div>
                <p class="timeline-content">{item.content || ''}</p>
                {#if item.quoteTo}
                  {@const quoted = getQuotedItem(item)}
                  <div class="timeline-quote">
                    {#if quoted}
                      <div class="timeline-quote-meta">
                        <span>{getAccountLabel(quoted.account)}</span>
                        <span>{quoted.date || '-'}</span>
                      </div>
                      <p class="timeline-quote-content">{quoted.content || ''}</p>
                    {:else}
                      <p class="timeline-quote-content">引用元: {item.quoteTo}（見つかりません）</p>
                    {/if}
                  </div>
                {/if}
                {#if item.assets?.image}
                  <img
                    class="timeline-image"
                    src={resolveSitePath(item.assets.image)}
                    alt="投稿画像"
                    loading="lazy"
                  />
                {/if}
                {#if item.assets?.video}
                  <video class="timeline-image" src={resolveSitePath(item.assets.video)} controls playsinline>
                    <track kind="captions" srclang="ja" label="captions" />
                  </video>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </main>
</div>
