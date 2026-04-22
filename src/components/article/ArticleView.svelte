<script lang="ts">
  import { marked } from 'marked';

  type Article = {
    id: string;
    title?: string;
    file?: string;
  };

  export let articles: Article[] = [];
  export let markdownByFile: Record<string, string> = {};

  const params = new URLSearchParams(window.location.search);
  const id = (params.get('id') || '').trim();
  const meta = articles.find((a) => a.id === id);
  const title = meta?.title || meta?.id || 'Article';
  const markdown = meta?.file ? markdownByFile[meta.file] ?? '' : '';
  const html = markdown ? marked.parse(markdown) : '';

  if (meta) {
    document.title = `${title} - natʇsu`;
  }

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
    <nav class="article-breadcrumb">
      <a href="/article/">Article</a><span class="article-breadcrumb-sep">/</span><span>{title}</span>
    </nav>
    <article class="article-view">
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
