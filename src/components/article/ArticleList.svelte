<script lang="ts">
  import { onMount } from 'svelte';
  const base = import.meta.env.BASE_URL;
  const withBase = (path: string) => `${base}${path.replace(/^\/+/, '')}`;

  export let homeHtml = '';
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
      {#if !homeHtml}
        <p class="article-list-empty">`_home.md` が見つかりません。</p>
      {:else}
        <article class="article-view">
          <p class="article-opened-file-name">_home.md</p>
          <div class="article-prose">
            {@html homeHtml}
          </div>
        </article>
      {/if}
    </section>
  </main>
</div>
