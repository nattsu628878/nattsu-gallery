<script lang="ts">
  import { onMount } from 'svelte';
  const base = import.meta.env.BASE_URL;
  const withBase = (path: string) => `${base}${path.replace(/^\/+/, '')}`;

  type Article = {
    id: string;
    title?: string;
    date?: string;
  };

  export let articles: Article[] = [];

  const sorted = [...articles].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const modeRoutes = ['opus/?view=grid', 'aboutme/', 'article/'] as const;

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
</script>

<div class="container">
  <header>
    <div class="header-row header-row-top">
      <h1 class="header-title">natʇsu</h1>
      <div class="mode-toggle" id="modeToggle">
        <button class="view-btn" on:click={() => goTo('opus/?view=grid')}>Opus</button>
        <button class="view-btn" on:click={() => goTo('aboutme/')}>About Me</button>
        <button class="view-btn active" on:click={() => goTo('article/')}>Article</button>
      </div>
    </div>
  </header>
  <main>
    <section class="article-home">
      <h2 class="article-home-title">Article</h2>
      <ul class="article-list">
        {#if sorted.length === 0}
          <li class="article-list-empty">No data</li>
        {:else}
          {#each sorted as article}
            <li class="article-list-item">
              <a class="article-list-link" href={withBase(`article/view?id=${encodeURIComponent(article.id)}`)}>
                {article.title || article.id}
              </a>
              <span class="article-list-meta">{article.date?.trim() || '—'}</span>
            </li>
          {/each}
        {/if}
      </ul>
    </section>
  </main>
</div>
