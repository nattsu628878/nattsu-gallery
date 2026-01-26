このファイルは、AI開発アシスタントであるあなたと、ユーザーであるnattsuによる開発履歴です。

## 🔰 利用ガイド
- **このファイルを最初に読み、全体像を把握してください。**
- **質問と回答の要約は、回答の最後の段階で、下部の「履歴」セクションの最も上部に追記してください。**
- **履歴には簡易タイトル・質問・回答・考慮点を記入してください。**
- **会話終了ごとに次のステップに進むための考慮点を整理しましょう。**

---

# 🏷 タイトル

マルチメディア活動記録ギャラリー（nattsu-gallery）

---

# 📖 概要

nattsuの活動（文章、映像、画像、音楽、開発アプリなど）を一覧できるマルチメディアデータベース。GitHub Pagesで公開する静的サイト。

**目的：** 発信よりも**記録・整理・再発見**に重心を置く。Notion Database的だが、自分の思想・美意識に寄せたUI。

---

# 🧭 全体のワークフロー
1. データスキーマを確定（type / tags / assets構造）
2. 仮データ10件でJSONを書く
3. Tableビューだけ作る（デフォルトビュー）
4. 検索・フィルタ実装
5. Gridビュー追加
6. 余力があれば Node / Space ビュー
7. GitHub Pagesへのデプロイ設定

---

# 🛠 実装メモ

## 使用予定の技術
- フロントエンド: React + Vite / Next.js（静的エクスポート） / Vue + Vite
- ビューライブラリ: D3.js / vis.js（ノードビュー用）
- スタイリング: Tailwind CSS / CSS Modules
- データ管理: JSONファイル（GitHubリポジトリ内）
- メディアストレージ: GitHubリポジトリ内のassetsフォルダ / GitHub Releases / 外部CDN（Cloudinary等） / Dropbox（パブリックリンク）

## データ構造案

### 統一データフォーマット（確定版）

**重要原則：**
- メタデータは1つ、実体は外部 or 分離
- `type`と`tags`を分離（UI分岐と意味づけを混ぜない）
- サムネイルは全データ必須

```json
{
  "id": "2025-01-electric-heartstrings",
  "title": "Electric Heartstrings",
  "type": "music",
  "tags": ["piano", "mv"],
  "date": "2025-01-12",
  "thumbnail": "/thumbs/electric-heartstrings.jpg",
  "summary": "電線を五線譜に見立てた楽曲",
  "assets": {
    "audio": "https://dl.dropboxusercontent.com/...",
    "video": null,
    "repo": null
  }
}
```

### メディア種別（type - 必須・排他的）
- `picture` - 画像
- `movie` - 映像
- `music` - 音楽
- `write` - 文章
- `software` - ソフトウェア
- `hardware` - ハードウェア

### データ配置戦略

| データ | 置き場所 |
|--------|----------|
| メタデータ | GitHub（`content.json`または`content/*.md`） |
| サムネイル | GitHub（軽量） |
| 動画 | **YouTube**（確定） |
| 音楽 | Dropbox / SoundCloud / 自前CDN |
| アプリ | GitHub Releases / 外部URL |

**GitHub Pagesは「索引装置」として機能**

## UI/UX設計

### 基本UI思想
- **ミニマル**: 情報密度は高いが、装飾は少ない
- **一覧性重視**: 「一覧性」＞「作品単体の演出」

### ビュー構成

| ビュー | 役割 | 優先度 |
|--------|------|--------|
| Table（デフォルト） | 全体把握・管理用 | 最優先 |
| Grid / Gallery | 視覚メディア中心 | 高 |
| Node / Space | 概念的・探索的 | 低（後回し可） |

### コンテンツ表現ルール

1. **サムネイルは全データ必須** → すべて「カード」として扱える
2. **typeによる表示拡張**（UI分岐はtypeのみ、タグではUIを変えない）

| type | 追加UI |
|------|--------|
| picture | 画像プレビュー |
| movie | 再生 or 外部リンク |
| music | audio再生バー |
| write | ハイライトテキスト |
| software | GitHub / Demoリンク |
| hardware | 写真 + 説明 |

### データベース挙動（Notion的）

共通フォーマットを持つ**単一データベース**を前提。

可能な操作：
- 🔍 **検索**（全文 or 一部フィールド）
- ↕️ **並び替え**（日付 / 種別 / タイトル / タグ）
- 🎯 **絞り込み**（type / tag）

## 実装済み項目
- [ ] プロジェクト初期化
- [ ] データスキーマ確定
- [ ] 仮データ10件作成
- [ ] Tableビュー実装
- [ ] 検索・並び替え・絞り込み機能
- [ ] Grid/Galleryビュー
- [ ] メディアタイプ別表示コンポーネント
- [ ] Node/Spaceビュー（後回し）
- [ ] GitHub Pagesデプロイ設定

---

# 📚 履歴

## 文章をMarkdownで管理する機能の追加

### 💬 質問

文章はhtmlではなく、mdで管理したいな

### 🧠 回答

**Markdownファイルで文章を管理できるように実装しました：**

**実装内容：**

1. **Markdownファイルの作成**
   - `content/write-sample.md`: サンプルMarkdownファイル
   - HTMLファイルからMarkdownに変換

2. **Markdown表示機能**
   - `article.html`: 記事表示ページ（MarkdownをHTMLに変換）
   - `marked.js`（CDN）を使用してMarkdownをHTMLに変換
   - URLパラメータでMarkdownファイルを指定

3. **データ構造の更新**
   - `data/items.json`: 文章の`assets.content`を`.md`ファイルに変更
   - `app.js`: Markdownファイルの場合は`article.html`で表示するように更新

4. **機能**
   - Markdownファイルを読み込んでHTMLに変換
   - タイトルを自動抽出（最初の`#`から）
   - スタイリング済みの記事表示ページ

**使用方法：**
```markdown
# 記事タイトル

本文内容...

## セクション

- リスト項目
- リスト項目
```

**ファイル配置：**
- 文章: `content/*.md`（Markdown形式）
- 表示: `article.html?file=/content/write-sample.md`

### 💡 考慮点

- **Markdownパーサー**: `marked.js`をCDNから読み込み（軽量）
- **GitHub上での編集**: MarkdownファイルはGitHub上で直接編集可能
- **拡張性**: 将来的にMarkdownの拡張記法（数式、図表等）にも対応可能
- **パフォーマンス**: クライアントサイドで変換するため、ビルド不要

---

## Vanilla JavaScriptによるシンプルな実装

### 💬 質問

astroを使用した場合のテストプロジェクトは別に保存しておいて、astroを使用しないシンプルな実装もしてみてください。

### 🧠 回答

**Astroプロジェクトを別ディレクトリに保存し、Vanilla JavaScript版を実装しました：**

**プロジェクト構成：**
- **Astro版**: `../nattsu-gallery-astro/` に保存（テストプロジェクト）
- **Vanilla JS版**: 現在のディレクトリ（シンプルな実装）

**Vanilla JavaScript版の実装内容：**

1. **ファイル構成**
   - `index.html`: メインページ
   - `styles.css`: スタイルシート
   - `app.js`: JavaScript（データ読み込みと表示）
   - `data/items.json`: メタデータ
   - `content/*.html`: 文章コンテンツ
   - `thumbnails/`: サムネイル画像

2. **機能**
   - JSONファイルからデータを読み込み
   - 動的にメディアカードを生成
   - type別の追加UI（動画埋め込み、音声プレーヤー、リンク等）
   - サムネイル必須（画像がない場合はプレースホルダー表示）

3. **技術スタック**
   - HTML5 + CSS3 + Vanilla JavaScript
   - フレームワーク不要
   - 静的ファイルのみで動作

4. **起動方法**
   ```bash
   # Python HTTPサーバー
   python3 -m http.server 8000
   
   # または Node.js http-server
   npx http-server -p 8000
   ```

**Astro版との比較：**
- **Astro版**: ビルドが必要、TypeScript対応、コンポーネントベース
- **Vanilla JS版**: ビルド不要、シンプル、直接HTMLで動作

### 💡 考慮点

- **GitHub Pages対応**: 両方とも静的サイトとして公開可能
- **開発のしやすさ**: Astro版は型安全性、Vanilla JS版はシンプルさ
- **パフォーマンス**: どちらも静的ファイル配信で高速
- **拡張性**: Astro版は機能追加が容易、Vanilla JS版は軽量

---

## Astroを使用した超簡易データベースの実装

### 💬 質問

サムネイルは必ず。サムネイルはgithub上に保存。動画、音楽はリンクで管理。文章はgithub上にmdで保存。astroを使うか検討。

astroを使用した、超簡易的なデータベースを実装して確認したい。それぞれのtypeのデータを１つづつ作成してみて、表示させてみる。

### 🧠 回答

**Astroプロジェクトを初期化し、超簡易データベースを実装しました：**

**実装内容：**

1. **プロジェクト構造**
   - Astro + TypeScriptでセットアップ
   - `src/content/items.json`: メタデータ（全typeのサンプルデータ1件ずつ）
   - `src/content/*.md`: 文章コンテンツ（Markdown）
   - `public/thumbnails/`: サムネイル画像（GitHub上に保存）
   - `src/components/MediaCard.astro`: メディアカードコンポーネント
   - `src/pages/index.astro`: 一覧表示ページ

2. **各typeのサンプルデータ（1件ずつ）**
   - **picture**: 画像（サムネイル必須）
   - **movie**: YouTube動画（リンク管理）
   - **music**: 音声（Dropboxリンク）
   - **write**: 文章（Markdownファイル）
   - **software**: ソフトウェア（GitHub/Demoリンク）
   - **hardware**: ハードウェア（説明文）

3. **表示機能**
   - グリッドレイアウトで一覧表示
   - type別の追加UI（動画埋め込み、音声プレーヤー、リンク等）
   - サムネイル必須（全アイテムで統一）

4. **データ構造**
   ```json
   {
     "id": "unique-id",
     "type": "picture|movie|music|write|software|hardware",
     "title": "タイトル",
     "summary": "説明",
     "tags": ["tag1", "tag2"],
     "date": "2025-01-15",
     "thumbnail": "/thumbnails/image.jpg",
     "assets": { /* type別の追加情報 */ }
   }
   ```

**ファイル配置：**
- メタデータ: `src/content/items.json`（GitHub）
- サムネイル: `public/thumbnails/`（GitHub）
- 文章: `src/content/*.md`（GitHub）
- 動画・音楽: 外部リンク（YouTube、Dropbox）

**起動方法：**
```bash
npm install
npm run dev
```

### 💡 考慮点

- **Astroの採用**: 静的サイト生成に最適、Markdownサポートあり
- **サムネイル必須**: 全アイテムで統一表示、GitHub上に保存
- **外部リンク管理**: 動画・音楽はリンクのみ、実体は外部ストレージ
- **文章はMarkdown**: GitHub上で編集可能、Astroで自動レンダリング
- **次のステップ**: 検索・フィルタ機能、Tableビュー、Gridビューの追加

---

## YouTube埋め込みが無効な動画への対応

### 💬 質問

動画の埋め込みが無効になっている可能性があるということでした。YoutubePlayerAPIが失敗しています

### 🧠 回答

**問題の原因：**
YouTubeの動画には、埋め込み設定があり、一部の動画は埋め込みが無効になっている場合があります。この場合、YouTube Player APIはエラーコード（101または150）を返します。

**対応方法：**

1. **埋め込み設定の確認と有効化**
   - YouTube Studio → 動画を選択 → 「詳細」タブ
   - 「配信とプライバシー設定」で「埋め込みを許可」を確認・有効化

2. **埋め込みが無効な場合の代替表示**
   - サムネイル画像 + YouTubeへのリンク表示
   - サムネイルは `https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg` で取得可能

3. **実装時のエラーハンドリング**
   ```javascript
   // YouTube Player APIのエラーハンドリング
   function onPlayerError(event) {
     const errorCode = event.data;
     if (errorCode === 101 || errorCode === 150) {
       // 埋め込みが無効な場合の代替表示
       showThumbnailWithLink(videoId);
     }
   }
   ```

4. **データモデルでの対応**
   - メタデータに `embedEnabled: boolean` フィールドを追加
   - 埋め込みが無効な場合は、サムネイル + リンク表示に切り替え

**検証ツールの更新：**
- エラーコードに応じた詳細なメッセージ表示
- 埋め込みが無効な場合の代替表示（サムネイル + リンク）を追加
- 埋め込み設定の確認方法を追加

### 💡 考慮点

- **埋め込み設定の確認**: 新規アップロード時は必ず埋め込みを有効化
- **フォールバック表示**: 埋め込みが無効でも、サムネイル + リンクで視聴可能にする
- **エラーコードの処理**: 101/150は埋め込み無効、100は動画削除/非公開、2は無効なID
- **ユーザー体験**: 埋め込みが無効でも、視聴への導線を確保する

---

## YouTubeリンクでのリアルタイム再生検証

### 💬 質問

動画は、Youtubeにしようと思います。Youtubeリンクで、リアルタイムで再生できるか確認したい

### 🧠 回答

**検証用HTMLファイルを作成しました：**

`lab/youtube-embed-test.html` - YouTube URLの埋め込みとリアルタイム再生をテストできるツール

**検証内容：**
1. **URL形式の自動認識**: 様々なYouTube URL形式（`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`）に対応
2. **iframe埋め込み（推奨）**: 最もシンプルで確実な方法
3. **YouTube Player API**: より高度な制御が可能（再生、一時停止、シークなど）
4. **動画IDの抽出**: URLから動画IDを自動抽出

**YouTube埋め込み方法：**

**✅ iframe埋め込み（推奨）**
```html
<iframe 
  width="560" 
  height="315" 
  src="https://www.youtube.com/embed/{VIDEO_ID}?rel=0" 
  frameborder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowfullscreen>
</iframe>
```
- 最もシンプルで確実
- レスポンシブ対応可能（16:9のアスペクト比を維持）
- リアルタイム再生可能

**✅ YouTube Player API**
- より高度な制御が可能
- プログラムから再生・一時停止・シークなどの操作が可能
- イベントハンドリングが可能

**⚠️ 注意点：**
- 一部の動画は埋め込みが無効になっている場合がある（動画の設定による）
- 埋め込みが無効な動画は、YouTube上でのみ視聴可能

**実装時の考慮点：**
- 動画の埋め込み設定を確認（YouTube Studioで設定可能）
- レスポンシブデザインに対応（16:9のアスペクト比を維持）
- サムネイル画像は、YouTubeのAPIまたは`https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg`で取得可能

### 💡 考慮点

- YouTubeは動画ストレージとして最適（無料、高品質、CDN配信）
- 埋め込みが無効な動画がある場合は、代替手段（リンクのみ、または別のストレージ）を検討
- サムネイルはYouTubeのAPIまたは画像URLで取得可能
- 動画IDのみをメタデータに保存し、埋め込みURLは動的に生成する方が柔軟

---

## Dropbox URLでの音声・動画リアルタイム再生検証

### 💬 質問

dropboxのURLだけで、音声や動画をリアルタイムでサムネイル再生できるのか検証したい

### 🧠 回答

**検証用HTMLファイルを作成しました：**

`lab/dropbox-media-test.html` - Dropbox URLの変換とメディア再生をテストできるツール

**検証内容：**
1. **音声ファイル**: HTML5 `<audio>`タグで直接再生可能か
2. **動画ファイル**: HTML5 `<video>`タグで直接再生可能か（サムネイル/ポスター画像含む）
3. **画像ファイル**: サムネイルとして表示可能か

**URL変換方法：**
- Dropbox共有リンク（`www.dropbox.com/s/...`）を直接埋め込み用URL（`dl.dropboxusercontent.com/...`）に変換
- クエリパラメータ（`?dl=0`など）を削除

**検証手順：**
1. Dropboxでファイルの共有リンクを取得
2. 検証ツールにURLを入力
3. 変換後のURLでメディアが再生できるか確認
4. CORS制限やファイル形式の問題がないか確認

**予想される結果：**
- ✅ **画像**: 通常は問題なく表示可能
- ⚠️ **音声/動画**: CORS制限やファイル形式によっては再生できない可能性
- ⚠️ **動画のサムネイル**: ポスター画像（`poster`属性）として別途画像URLが必要な場合あり

**実装時の考慮点：**
- CORS制限がある場合は、プロキシサーバーや別のストレージサービスの検討
- 動画のサムネイルは、別途サムネイル画像を用意する方が確実
- 音声/動画のストリーミング再生には、適切なファイル形式（MP3, MP4等）が必要

### 💡 考慮点

- Dropboxのパブリックリンクは、将来的に仕様変更される可能性がある
- 大量アクセス時は帯域幅制限に引っかかる可能性
- リアルタイム再生ができない場合は、YouTube/Vimeo/SoundCloudなどの専用サービスを検討
- 検証結果に基づいて、メディアタイプごとの最適なストレージ戦略を決定

---

## 要件整理：アプリケーションの目的・UI/UX・データ設計の確定

### 💬 質問

アプリケーションの目的、UI/UX、データ設計について詳細な整理を提供。

**1. アプリケーションの目的（再定義）**
- 自分の活動（文章/映像/画像/音楽/ソフトウェア等）を一つのデータベースとして横断的に一覧・探索できるホームページ
- **発信よりも記録・整理・再発見に重心**
- Notion Database的だが、自分の思想・美意識に寄せたUI
- GitHub Pages（完全静的サイト）、クライアントサイドで完結

**2. UI/UXの整理**
- **基本UI思想**: ミニマル、情報密度高、装飾少ない、「一覧性」＞「作品単体の演出」
- **データベース挙動**: 共通フォーマットの単一データベース、検索・並び替え・絞り込み可能
- **ビュー構成**: Table（デフォルト・最優先）、Grid/Gallery、Node/Space（後回し可）

**3. コンテンツ表現ルール**
- サムネイルは全データ必須（すべて「カード」として扱える）
- typeによる表示拡張（UI分岐はtypeのみ、タグではUIを変えない）

**4. タグ設計**
- **2階層に分離**: 
  - A. メディア種別（typeフィールド）: picture, movie, music, write, software, hardware
  - B. コンセプト/内容タグ（tagsフィールド）: piano, game, vlog, mv, lab, blog など
- **分離理由**: UI分岐と意味づけを混ぜない、検索・絞り込みが破綻しない

**5. データ設計（最大の論点）**
- **結論**: 「メタデータは1つ、実体は外部 or 分離」
- **推奨データモデル**: メタデータはGitHub管理（content.json）、実体は外部ストレージ
- **データ配置**: メタデータ・サムネ（GitHub）、動画（YouTube/Vimeo）、音楽（Dropbox等）、アプリ（GitHub Releases）

**6. 課題への整理された回答**
- **課題① マルチメディア管理**: 同じDBで管理するのはメタデータのみ、実体は分離
- **課題② GitHub Pages大量データ**: GitHub Pagesは「索引装置」、大容量ファイルは外部ストレージ
- **課題③ Dropbox利用**: 使ってよい、ただし役割を限定（音源/高解像度画像/実験データ）

### 🧠 回答

**設計方針の確認と実装計画：**

**✅ 確定した設計原則：**
1. **メタデータ一元管理**: `content.json`（または`content/*.md`）が唯一のDB
2. **typeとtagsの分離**: UI分岐はtypeのみ、tagsは検索・絞り込み用
3. **サムネイル必須**: 全データをカードとして統一表示
4. **外部ストレージ活用**: 実体は適切な外部サービスに配置

**📋 推奨実装順序：**
1. データスキーマを確定（type / tags / assets構造）
2. 仮データ10件でJSONを書く
3. Tableビューだけ作る（デフォルトビュー）
4. 検索・フィルタ実装
5. Gridビュー追加
6. 余力があれば Node / Space ビュー

**🔧 技術的実装ポイント：**
- クライアントサイドで完結（静的サイト）
- メタデータはJSON/YAML/MD Frontmatterで管理
- 実体ファイルは外部URL参照
- type別コンポーネントで表示分岐

**📊 全体構造（概念図）：**
```
[ GitHub Pages ]
   ├── UI / JS / CSS
   ├── content.json  ← 唯一のDB
   └── thumbnails/

[ External Storage ]
   ├── Dropbox (audio, image)
   ├── **YouTube (movie)** ← 確定
   ├── GitHub Repo (software)
```

### 💡 考慮点

- **データ更新フロー**: メタデータの更新はGitHubリポジトリ経由、実体ファイルは各ストレージで管理
- **パフォーマンス**: 大量データの場合はページネーション/仮想スクロール、画像の遅延読み込み
- **URL管理**: 外部ストレージのURL変更リスクを考慮した設計
- **検索性**: メタデータに十分な情報を記録（Dropbox等は検索性ゼロのため）
- **ビューの優先順位**: Tableビューを最優先、Node/Spaceはデータ構造が整理された後の派生表現として扱う

---

## Dropboxを外部ストレージとして使用する可能性について

### 💬 質問

外部ストレージは、Dropboxにできるのか

### 🧠 回答

**Dropboxは使用可能ですが、いくつかの制限があります：**

**✅ 使用可能な方法：**
1. **パブリックリンク機能**
   - Dropboxにファイルをアップロードし、パブリックリンクを取得
   - リンクをJSONデータベースの`mediaUrl`に記録
   - GitHub Pagesから直接参照可能

2. **URL変換**
   - Dropboxの共有リンク（`www.dropbox.com/s/...`）を直接埋め込み用URL（`dl.dropboxusercontent.com/...`）に変換
   - 画像や動画の直接埋め込みが可能

**⚠️ 制限と注意点：**
- **帯域幅制限**: 無料プランでは帯域幅に制限がある可能性（大量アクセス時に問題）
- **URLの安定性**: パブリックリンクの仕様変更リスク
- **利用規約**: 商用利用や大量アクセスが規約に抵触する可能性
- **パフォーマンス**: CDNほど最適化されていない（キャッシュ、画像最適化など）
- **CORS制限**: 一部の用途でCORSエラーが発生する可能性

**💡 推奨される使用シナリオ：**
- 個人利用で、アクセス数が限定的な場合
- プロトタイプやテスト段階
- 小規模なメディアファイル（画像、小さい動画など）

**🔧 実装方法：**
```javascript
// Dropboxのパブリックリンクを直接埋め込み用URLに変換
function convertDropboxUrl(shareUrl) {
  // www.dropbox.com/s/xxx/file.jpg?dl=0
  // → dl.dropboxusercontent.com/s/xxx/file.jpg
  return shareUrl
    .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
    .replace('?dl=0', '');
}
```

**📊 比較：**
- **Dropbox**: 簡単、無料（制限あり）、個人利用向け
- **Cloudinary**: 最適化機能あり、CDN、スケーラブル（有料プランあり）
- **GitHub Releases**: 無料、GitHubと統合、大きなファイル対応

### 💡 考慮点

- Dropboxは個人利用・小規模には適しているが、大規模な公開サイトには専門CDNが推奨
- パブリックリンクの管理とURLの永続性を考慮
- 帯域幅制限を超える可能性がある場合は、他のオプションを検討
- メディアタイプによって使い分け（画像はDropbox、動画はGitHub Releasesなど）

---

## プロジェクト開始：マルチメディア活動記録ギャラリーの要件整理

### 💬 質問

マルチメディア（文章、映像、画像、音楽、開発アプリなど）を一覧できるデータベース型のホームページをGitHub Pagesで公開したい。要件は以下の通り：

**機能要件：**
- シンプルなUIで、Notionのデータベースのような挙動
- 検索、並び替え、絞り込みができる（全てのメディアは一つのフォーマットで管理）
- ビューをいくつか用意（デフォルトは表形式。ノード、宇宙のようなビューなど、シンプルに）
- インスタグラム風のサムネイル表示（メディアタイプに応じた追加表示：文章ならハイライト、タイトル、音楽なら再生バー、開発アプリならリンクなど）
- タグ一覧機能

**タグ形式：**
- メディアタイプ: picture, movie, music, write, software, hardware
- その他のタグ: piano, game, vlog, mv, lab, blog など

**課題：**
- マルチメディアをどのように管理するか（全て同じデータベースで管理したい）
- GitHub Pagesで、そんな大量のデータを扱えるのか、データはどこに置くのか

### 🧠 回答

**データ管理の提案：**

1. **データ形式：JSONファイル**
   - GitHub Pagesは静的サイトホスティングのため、バックエンドDBは使えない
   - リポジトリ内に`data/items.json`のような形で全アイテムを管理
   - 統一されたスキーマで全メディアタイプを管理可能

2. **メディアファイルの保存場所：**
   - **オプションA**: GitHubリポジトリ内の`assets/`フォルダ（小〜中規模向け）
   - **オプションB**: GitHub Releases（大きなファイル向け）
   - **オプションC**: 外部CDN（Cloudinary、Imgix等）で最適化とキャッシュ
   - **オプションD**: Dropbox（パブリックリンク機能を使用）
   - **オプションE**: ハイブリッド（画像はリポジトリ、動画は外部ストレージ）

3. **パフォーマンス対策：**
   - 大量データの場合は、ページネーションまたは仮想スクロールを実装
   - 画像の遅延読み込み（lazy loading）
   - データの分割（年別、タイプ別にJSONを分割し、必要に応じて読み込む）

**技術スタックの推奨：**
- React + Vite（軽量、静的エクスポート可能）
- または Next.js（静的エクスポート機能あり）
- ビューライブラリ：D3.js（ノードビュー、宇宙ビュー用）

**次のステップ：**
1. データ構造の詳細設計
2. プロジェクトの初期化とセットアップ
3. 基本UIコンポーネントの実装
4. データ読み込みと表示機能の実装

### 💡 考慮点

- GitHub Pagesのファイルサイズ制限（100MB/ファイル、1GB/リポジトリ）を考慮
- メディアファイルが多い場合は、外部ストレージの検討が必要
- データの更新頻度と、GitHubリポジトリでの管理のしやすさのバランス
- 検索・フィルタリングのパフォーマンス（クライアントサイドでの処理）
- モバイル対応の重要性
