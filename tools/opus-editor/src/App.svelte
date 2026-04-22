<script lang="ts">
  import OpusEditor from './OpusEditor.svelte';

  const GALLERY = (import.meta.env.VITE_GALLERY_BASE || '/nattsu-gallery').replace(/\/$/, '');
  const ASTRO_ORIGIN = import.meta.env.VITE_ASTRO_ORIGIN || 'http://127.0.0.1:4321';
  const opusPageUrl = `${ASTRO_ORIGIN}${GALLERY}/opus/`;
</script>

<div class="oe-shell">
  <header class="oe-header">
    <div class="oe-header-row">
      <h1 class="oe-header-title">Opus Editor</h1>
      <a class="view-btn" href={opusPageUrl} target="_blank" rel="noopener noreferrer">Open Opus</a>
    </div>
  </header>
  <div class="oe-container">
    <OpusEditor />
  </div>
</div>
