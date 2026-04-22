<script lang="ts">
  type Article = {
    id: string;
    title?: string;
    date?: string;
  };

  export let articles: Article[] = [];

  const sorted = [...articles].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  const goTo = (href: string) => {
    window.location.href = href;
  };
</script>

<div class="container">
  <header>
    <div class="header-row header-row-top">
      <h1 class="header-title">natʇsu</h1>
      <div class="mode-toggle" id="modeToggle">
        <button class="view-btn" on:click={() => goTo('/opus/?view=grid')}>Opus</button>
        <button class="view-btn" on:click={() => goTo('/aboutme/')}>About Me</button>
        <button class="view-btn active" on:click={() => goTo('/article/')}>Article</button>
      </div>
    </div>
  </header>
  <main>
    <section class="article-home">
      <h2 class="article-home-title">Article</h2>
      <ul class="article-list">
        {#if sorted.length === 0}
          <li class="article-list-empty">（記事なし）</li>
        {:else}
          {#each sorted as article}
            <li class="article-list-item">
              <a class="article-list-link" href={`/article/view?id=${encodeURIComponent(article.id)}`}>
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
