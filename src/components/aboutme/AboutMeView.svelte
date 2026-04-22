<script lang="ts">
  import { onMount } from 'svelte';

  const skills = [
    { src: 'https://skillicons.dev/icons?i=rust', alt: 'Rust' },
    { src: 'https://skillicons.dev/icons?i=js', alt: 'JavaScript' },
    { src: 'https://skillicons.dev/icons?i=ts', alt: 'TypeScript' },
    { src: 'https://skillicons.dev/icons?i=py', alt: 'Python' },
    { src: 'https://skillicons.dev/icons?i=tauri', alt: 'Tauri' },
    { src: 'https://skillicons.dev/icons?i=svelte', alt: 'Svelte' },
    { src: 'https://skillicons.dev/icons?i=astro', alt: 'Astro' },
    { src: 'https://skillicons.dev/icons?i=bevy', alt: 'Bevy' },
    { src: 'https://skillicons.dev/icons?i=vscode', alt: 'VS Code' },
    { src: 'https://skillicons.dev/icons?i=godot', alt: 'Godot' },
    { src: 'https://skillicons.dev/icons?i=unity', alt: 'Unity' },
    { src: 'https://skillicons.dev/icons?i=blender', alt: 'Blender' },
    { src: '/aboutme/logic-pro.webp', alt: 'Logic Pro' },
    { src: '/aboutme/ableton-live.webp', alt: 'Ableton Live' },
    { src: '/aboutme/renoise.webp', alt: 'Renoise' },
    { src: '/aboutme/final-cut-pro.webp', alt: 'Final Cut Pro' },
    { src: '/aboutme/motion.webp', alt: 'Motion' },
    { src: '/aboutme/touch-designer.webp', alt: 'TouchDesigner' },
    { src: 'https://skillicons.dev/icons?i=apple', alt: 'macOS' },
    { src: 'https://skillicons.dev/icons?i=debian', alt: 'Debian-based' },
    { src: 'https://skillicons.dev/icons?i=arch', alt: 'Arch-based' },
    { src: 'https://raw.githubusercontent.com/simple-icons/simple-icons/master/icons/zorin.svg', alt: 'Zorin OS' },
    { src: 'https://raw.githubusercontent.com/simple-icons/simple-icons/master/icons/steamdeck.svg', alt: 'Steam Deck' }
  ];

  const skillsLoop = [...skills, ...skills];
  const modeRoutes = ['/opus/?view=grid', '/aboutme/', '/article/'] as const;

  const goTo = (href: string) => {
    window.location.href = href;
  };

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      event.preventDefault();
      const currentIndex = 1;
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
        <button class="view-btn" on:click={() => goTo('/opus/?view=grid')}>Opus</button>
        <button class="view-btn active" on:click={() => goTo('/aboutme/')}>About Me</button>
        <button class="view-btn" on:click={() => goTo('/article/')}>Article</button>
      </div>
    </div>
  </header>
  <main>
    <section class="mode-placeholder">
      <h2>About Me</h2>
      <p>I am an engineering student in computer and information science, interested in music, sound, and game development.</p>

      <div class="about-links-section">
        <h3>Links</h3>
      </div>
      <div class="about-links">
        <div class="about-link-row">
          <img class="about-avatar" src="/aboutme/nattsu_real.webp" width="40" height="40" alt="プロフィール写真" />
          <a href="https://github.com/nattsu628878" target="_blank" rel="noopener noreferrer">GitHub: @nattsu628878</a>
        </div>
        <div class="about-link-row">
          <img class="about-avatar" src="/aboutme/nattsu_320_320_tt.webp" width="40" height="40" alt="X 用アイコン" />
          <a href="https://x.com/nattsu_628878" target="_blank" rel="noopener noreferrer">X: @nattsu_628878</a>
        </div>
        <div class="about-link-row">
          <img class="about-avatar" src="/aboutme/nattsu_320_320_tt.webp" width="40" height="40" alt="YouTube 用アイコン" />
          <a href="https://www.youtube.com/@nattsu6__8878" target="_blank" rel="noopener noreferrer">YouTube: @nattsu6__8878</a>
        </div>
      </div>

      <div class="about-projects">
        <h3>Projects</h3>
        <a class="project-card" href="https://nattsu628878.github.io/web-synth/" target="_blank" rel="noopener noreferrer">
          <span class="project-title">Web Synth</span>
          <span class="project-meta">Browser-based modular synth</span>
        </a>
      </div>

      <div class="about-skills">
        <div class="about-favorites-section">
          <h3>Favorites</h3>
        </div>
        <div class="skills-marquee">
          <div class="skills-track">
            {#each skillsLoop as skill, idx}
              <img
                class="skill-icon"
                src={skill.src}
                alt={idx < skills.length ? skill.alt : ''}
                aria-hidden={idx >= skills.length}
                loading="lazy"
              />
            {/each}
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
