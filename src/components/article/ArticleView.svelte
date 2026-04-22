<script lang="ts">
  import { onMount } from 'svelte';
  const base = import.meta.env.BASE_URL;
  const withBase = (path: string) => `${base}${path.replace(/^\/+/, '')}`;

  type Article = {
    id: string;
    title?: string;
    html?: string;
    breadcrumb?: string;
  };

  export let articles: Article[] = [];
  export let initialId = '';
  const modeRoutes = ['opus/?view=grid', 'aboutme/', 'article/'] as const;

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const id = (initialId || params.get('id') || '').trim();
  const hierarchyPath = (params.get('path') || '').trim();
  const meta = articles.find((a) => a.id === id);
  const html = meta?.html || '';
  const openedFileName = (() => {
    if (!id) return '_home.md';
    if (hierarchyPath) return `${hierarchyPath}.md`;
    return `_home/${id}.md`;
  })();

  if (typeof document !== 'undefined') {
    document.title = 'Article - natʇsu';
  }

  const goTo = (href: string) => {
    window.location.href = withBase(href);
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    goTo('article/');
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
    <div class="article-back-row">
      <button type="button" class="view-btn" on:click={goBack} aria-label="戻る">←</button>
    </div>
    <article class="article-view">
      <p class="article-opened-file-name">{openedFileName}</p>
      {#if !id}
        <p class="article-view-error">id がありません。</p>
      {:else if !meta}
        <p class="article-view-error">記事が見つかりません。</p>
      {:else if !html}
        <p class="article-view-error">本文を読み込めませんでした。</p>
      {:else}
        <div class="article-prose">
          {@html html}
        </div>
      {/if}
    </article>
  </main>
</div>
