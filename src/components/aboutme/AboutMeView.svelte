<script lang="ts">
  import { onMount } from 'svelte';
  const base = import.meta.env.BASE_URL;
  const withBase = (path: string) => `${base}${path.replace(/^\/+/, '')}`;

  const favorites = [
    { src: 'https://skillicons.dev/icons?i=rust', alt: 'Rust' },
    { src: 'https://skillicons.dev/icons?i=ts', alt: 'TypeScript' },
    { src: 'https://skillicons.dev/icons?i=py', alt: 'Python' },
    { src: 'https://skillicons.dev/icons?i=tauri', alt: 'Tauri' },
    { src: 'https://skillicons.dev/icons?i=svelte', alt: 'Svelte' },
    { src: 'https://skillicons.dev/icons?i=astro', alt: 'Astro' },
    { src: 'https://skillicons.dev/icons?i=bevy', alt: 'Bevy' },
    { src: 'https://skillicons.dev/icons?i=godot', alt: 'Godot' },
    { src: 'https://skillicons.dev/icons?i=blender', alt: 'Blender' },
    { src: withBase('aboutme/logic-pro.webp'), alt: 'Logic Pro' },
    { src: withBase('aboutme/ableton-live.webp'), alt: 'Ableton Live' },
    { src: withBase('aboutme/renoise.webp'), alt: 'Renoise' },
    { src: withBase('aboutme/lilypond.webp'), alt: 'LilyPond' },
    { src: withBase('aboutme/final-cut-pro.webp'), alt: 'Final Cut Pro' },
    { src: withBase('aboutme/motion.webp'), alt: 'Motion' },
    { src: withBase('aboutme/touch-designer.webp'), alt: 'TouchDesigner' },
    { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nixos/nixos-original.svg', alt: 'Nix' },
    { src: 'https://skillicons.dev/icons?i=arch', alt: 'ArchLinux' },
    { src: 'https://skillicons.dev/icons?i=apple', alt: 'macOS' },
    { src: withBase('aboutme/steamdeck-color.svg'), alt: 'Steam Deck' }
  ];

  const projects = [
    {
      title: 'nattsu-explorer',
      description: 'Nationwide interactive map & GPS photo viewer',
      tags: ['Map', 'Photo', 'Astro'],
      status: 'Completed',
      href: 'https://nattsu628878.github.io/nattsu-explorer/',
      repoHref: 'https://github.com/nattsu628878/nattsu-explorer'
    },
    {
      title: 'nattsu-gallery',
      description: 'Personal portfolio, creative archive & project hub',
      tags: ['Portfolio', 'Astro', 'Svelte'],
      status: 'Active',
      href: 'https://nattsu628878.github.io/nattsu-gallery/',
      repoHref: 'https://github.com/nattsu628878/nattsu-gallery'
    },
    {
      title: 'synth-builder',
      description: 'Node-based synth design playground & DSP instrument',
      tags: ['Rust', 'Bevy', 'Audio'],
      status: 'In Progress',
      href: '#',
      repoHref: 'https://github.com/nattsu628878/synth-builder'
    },
    {
      title: 'web-synth',
      description: 'Browser-based modular synthesizer',
      tags: ['Web Audio', 'Synth'],
      status: 'Completed',
      href: 'https://nattsu628878.github.io/web-synth/',
      repoHref: 'https://github.com/nattsu628878/web-synth'
    },
    {
      title: 'web-rhythm',
      description: 'Browser-based rhythm machine and metronome',
      tags: ['Web Audio', 'Rhythm'],
      status: 'Completed',
      href: 'https://nattsu628878.github.io/web-rhythm/',
      repoHref: 'https://github.com/nattsu628878/web-rhythm'
    },
    {
      title: 'music-visualizer',
      description: 'Real-time audio & MIDI visualization engine',
      tags: ['Visual', 'Audio'],
      status: 'In Progress',
      href: '#',
      repoHref: 'https://github.com/nattsu628878/music-visualizer'
    },
    {
      title: 'arch-dashboard',
      description: 'Systemd & resource management dashboard for Arch Linux',
      tags: ['Arch Linux', 'System'],
      status: 'Active',
      href: '#',
      repoHref: 'https://github.com/nattsu628878/arch-dashboard'
    },
    {
      title: 'ear-transcription-vst',
      description: 'Ear training & audio transcription VST plugin',
      tags: ['VST', 'DSP', 'Rust'],
      status: 'In Progress',
      href: '#',
      repoHref: 'https://github.com/nattsu628878/ear-transcription-vst'
    },
    {
      title: 'sound-effect-studio',
      description: 'Create and layer game-ready sound effects',
      tags: ['SFX', 'Game Sound'],
      status: 'Concept',
      href: '#',
      repoHref: ''
    }
  ];

  const statusClass = (status: string) =>
    `status-${status.trim().toLowerCase().replace(/\s+/g, '-')}`;
  const hasExternalLink = (url: string) => Boolean(url && url !== '#');

  const modeRoutes = ['opus/?view=grid', 'article/', 'timeline/', 'aboutme/'] as const;

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
      const currentIndex = 3;
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
        <button class="view-btn" on:click={() => goTo('article/')}>Article</button>
        <button class="view-btn" on:click={() => goTo('timeline/')}>Time Line</button>
        <button class="view-btn active" on:click={() => goTo('aboutme/')}>About Me</button>
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
          <img class="about-avatar" src={withBase('aboutme/nattsu_real.webp')} width="40" height="40" alt="プロフィール写真" />
          <a href="https://github.com/nattsu628878" target="_blank" rel="noopener noreferrer">
            <svg class="social-inline-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.387c.6.111.82-.261.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61c-.546-1.387-1.333-1.756-1.333-1.756c-1.089-.745.083-.729.083-.729c1.205.085 1.84 1.237 1.84 1.237c1.07 1.835 2.809 1.305 3.495.998c.108-.775.418-1.305.762-1.605c-2.665-.305-5.467-1.332-5.467-5.93c0-1.31.467-2.38 1.235-3.22c-.124-.303-.535-1.524.117-3.176c0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0 1 12 5.799c1.02.005 2.047.138 3.007.404c2.29-1.552 3.297-1.23 3.297-1.23c.653 1.653.242 2.874.118 3.176c.77.84 1.233 1.91 1.233 3.22c0 4.609-2.807 5.622-5.48 5.921c.43.372.823 1.102.823 2.222c0 1.606-.015 2.898-.015 3.293c0 .318.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z"
              />
            </svg>
            GitHub: @nattsu628878
          </a>
        </div>
        <div class="about-link-row">
          <img class="about-avatar" src={withBase('aboutme/nattsu_320_320_tt.webp')} width="40" height="40" alt="X 用アイコン" />
          <a href="https://x.com/nattsu_628878" target="_blank" rel="noopener noreferrer">
            <svg class="social-inline-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M18.901 1.153h3.68l-8.04 9.188L24 22.847h-7.406l-5.8-7.584l-6.637 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zm-1.29 19.493h2.04L6.486 3.24H4.297z"
              />
            </svg>
            X: @nattsu_628878
          </a>
        </div>
        <div class="about-link-row">
          <img class="about-avatar" src={withBase('aboutme/nattsu_320_320_tt.webp')} width="40" height="40" alt="YouTube 用アイコン" />
          <a href="https://www.youtube.com/@nattsu6__8878" target="_blank" rel="noopener noreferrer">
            <svg class="social-inline-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M23.498 6.186a2.99 2.99 0 0 0-2.105-2.117C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.393.57A2.99 2.99 0 0 0 .502 6.186C0 8.09 0 12 0 12s0 3.91.502 5.814a2.99 2.99 0 0 0 2.105 2.117C4.495 20.5 12 20.5 12 20.5s7.505 0 9.393-.57a2.99 2.99 0 0 0 2.105-2.117C24 15.91 24 12 24 12s0-3.91-.502-5.814M9.6 15.568V8.432L15.818 12z"
              />
            </svg>
            YouTube: @nattsu6__8878
          </a>
        </div>
      </div>

      <div class="about-activity-section">
        <h3>GitHub Activity</h3>
        <a href="https://github.com/nattsu628878" target="_blank" rel="noopener noreferrer" class="activity-graph-link">
          <img
            class="activity-graph"
            src="https://ghchart.rshah.org/628878/nattsu628878"
            alt="nattsu628878のGitHub contributionグラフ"
            loading="lazy"
            width="732"
            height="112"
          />
        </a>
      </div>

      <div class="about-projects">
        <h3>Projects</h3>
        <div class="projects-grid">
          {#each projects as project}
            <div class="project-card">
              <div class="project-top">
                <span class="project-title">{project.title}</span>
                <span class={`project-status ${statusClass(project.status)}`}>{project.status}</span>
              </div>
              <span class="project-meta">{project.description}</span>
              <div class="project-footer">
                <div class="project-tags" aria-label="Project tags">
                  {#each project.tags as tag}
                    <span class="project-tag">{tag}</span>
                  {/each}
                </div>
                <div class="project-links" aria-label="Project links">
                  {#if hasExternalLink(project.href)}
                    <a class="project-link" href={project.href} target="_blank" rel="noopener noreferrer">Project</a>
                  {/if}
                  {#if hasExternalLink(project.repoHref)}
                    <a class="project-link" href={project.repoHref} target="_blank" rel="noopener noreferrer">GitHub</a>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="about-skills">
        <div class="about-favorites-section">
          <h3>Favorites</h3>
          <br>
        </div>
        <div class="skills-marquee">
          <div class="skills-track skills-track--a">
            {#each favorites as skill}
              <img
                class="skill-icon"
                src={skill.src}
                alt={skill.alt}
                loading="lazy"
              />
            {/each}
          </div>
          <div class="skills-track skills-track--b" aria-hidden="true">
            {#each favorites as skill}
              <img
                class="skill-icon"
                src={skill.src}
                alt=""
                loading="lazy"
              />
            {/each}
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
