<script lang="ts">
  import { onMount } from 'svelte';

  type TimelineItem = {
    id: string;
    date?: string;
    content?: string;
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

  onMount(() => {
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

  $: timelineItems = [...items].sort((a, b) => {
    const c = (b.date ?? '').localeCompare(a.date ?? '');
    if (c !== 0) return c;
    const oa = a.order ?? 0;
    const ob = b.order ?? 0;
    if (oa !== ob) return ob - oa;
    return a.id.localeCompare(b.id);
  });
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
  </header>

  <main>
    <section class="timeline-section">
      {#if timelineItems.length === 0}
        <p class="timeline-empty">No data</p>
      {:else}
        <div class="timeline-list">
          {#each timelineItems as item (item.id)}
            <article class="timeline-card">
              <div class="timeline-body">
                <p class="timeline-content">{item.content || ''}</p>
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
