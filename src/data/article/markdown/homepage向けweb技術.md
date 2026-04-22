https://chatgpt.com/share/694e463b-6528-8010-a2e4-772114d7f886

Astro + Svelte

https://docs.astro.build/ja/getting-started/

アイランドアーキテクチャというものがあるらしい。
> Astroは**アイランドアーキテクチャ**と呼ばれる新しいフロントエンドアーキテクチャパターンを提唱し、普及させました。アイランドアーキテクチャでは、ページの大部分を高速な静的HTMLとしてレンダリングし、インタラクティブ性やパーソナライズが必要な箇所に小さなJavaScriptの”アイランド”を追加します（たとえば、画像カルーセルなど）。これにより、多くのモダンJavaScriptフレームワークで問題となる巨大なJavaScriptペイロードによるレスポンス低下を防げます。

md-first設計
webは静的で読むもの。そこに動的アプリが付随。

Astro
	個人ブログなので、あくまで静的、
Svelteを島として追加
	開発のデモとかはsvelteで、

基本構造
```
src/
├─ pages/              # URLになるページ（Astro）
│   ├─ index.astro
│   └─ demos.astro
│
├─ components/
│   ├─ svelte/         # Svelteコンポーネント（島）
│   │   └─ Counter.svelte
│   └─ astro/          # Astro専用コンポーネント
│       └─ Layout.astro
│
├─ content/            # md / mdx（記事・設計書）
│   └─ posts/
│       └─ design.md
│
├─ layouts/            # ページ共通レイアウト
│   └─ BaseLayout.astro
│
└─ styles/
    └─ global.css

```

デモ付き
```
src/
├─ pages/
│   ├─ index.astro
│   └─ demos/
│       ├─ spectrum.astro
│       ├─ waveform.astro
│       └─ synth.astro
│
├─ components/
│   ├─ svelte/
│   │   ├─ audio/
│   │   │   ├─ Oscillator.svelte
│   │   │   └─ AudioContext.svelte
│   │   ├─ viz/
│   │   │   ├─ Waveform.svelte
│   │   │   └─ Spectrum.svelte
│   │   └─ ui/
│   │       └─ Knob.svelte
│   └─ astro/
│       └─ DemoFrame.astro
│
├─ content/
│   └─ research/
│       └─ dsp.md

```