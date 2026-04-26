https://nattsu628878.github.io/nattsu-gallery

# nattsu-gallery

## 前提

- 本文データの正本は Dropbox（`article` / `opus` / `timeline`）
- リポジトリ側の `src/data/...` と `public/...` は同期結果（`.gitignore` 対象）

### ディレクトリ形（Dropbox と同じ並びに揃える）

| 種別 | 置き場所 | 中身の例 |
|------|----------|----------|
| Article | `src/data/article/` | `*.md` と `data/`（`src/data/article/` 直下。余計な `content/` は置かない） |
| Opus | `src/data/opus/` | `youtube-link.md` と `data/*.webp`（同上。`data/opus/data/` のネストは不要） |
| Timeline | `src/data/timeline/` | `YY-MM-DD/*.md` と `data/`（同上） |

`scripts/fetch-dropbox-content.py` は、zip 先頭に余分に `content` / `article` / `opus` / `timeline` が 1 段ある場合は自動で畳みます。Opus 資産の `data/opus/data` 型のネストも解消します。

**Article / Opus / Timeline の形式の要約**（ディレクトリ・ファイル名・表記法）: [docs/CONTENT-FORMAT.md](docs/CONTENT-FORMAT.md)

## ローカル開発

```bash
./dev.sh
```

## Dropbox 同期（ローカル）

```bash
DROPBOX_ACCESS_TOKEN=... python3 scripts/fetch-dropbox-content.py
```

または、ラッパースクリプト:

```bash
DROPBOX_ACCESS_TOKEN=... ./sync-dropbox-content.sh
```

必要ならパス上書き:

```bash
DROPBOX_ACCESS_TOKEN=... \
DROPBOX_ARTICLE_PATH=/nattsu-gallery/article \
DROPBOX_OPUS_PATH=/nattsu-gallery/opus \
DROPBOX_TIMELINE_PATH=/nattsu-gallery/timeline \
python3 scripts/fetch-dropbox-content.py
```

### `DROPBOX_ACCESS_TOKEN` の設定方法

1回だけ:

```bash
DROPBOX_ACCESS_TOKEN='YOUR_TOKEN' ./sync-dropbox-content.sh
```

現在のシェルで有効化:

```bash
export DROPBOX_ACCESS_TOKEN='YOUR_TOKEN'
./sync-dropbox-content.sh
```

恒久設定（zsh）:

```bash
echo "export DROPBOX_ACCESS_TOKEN='YOUR_TOKEN'" >> ~/.zshrc
source ~/.zshrc
```

※ トークンをスクリプトやリポジトリに直接書かないこと

必要なら Opus 画像を WebP 化:

```bash
bash scripts/normalize-opus-assets.sh
```

## Opus（Dropbox）運用フォーマット

`opus/youtube-link.md` は以下フォーマットで管理（`type` は自動で `movie`）:

```md
id | title | url | date
26-04-01 | Logic Sketches #3 | https://www.youtube.com/watch?v=xxxx | 26-04-01
```

- 動画の必要メタデータは `id`, `title`, `url`（`date` は任意。未指定時は `id` から推定）
- 画像は md 不要（`opus/data/` に `id` と同名ファイルを置くだけ）
- 画像の `type` は自動で `picture`
- 画像の `date` は `id` から自動取得
  - 例: `26-04-01.webp` → `date: 26-04-01`
  - 例: `26-04-01-2.webp` → `date: 26-04-01`
- 画像は `normalize-opus-assets.sh` で自動的に WebP へ変換

## Article / Timeline の Obsidian 埋め込み

- `src/data/article/**/*.md`, `src/data/timeline/**/*.md` 内で Obsidian 埋め込みを利用可能
  - 例: `![[sample.png]]`, `![[movie.mp4]]`
- 実ファイルは各 `data/`（記事・Opus 共通）や、タイムラインの日付フォルダ付近の `data/` に配置
- 同期後に以下スクリプトで自動変換
  - Article: `scripts/normalize-article-assets.sh`（画像→webp, 動画→webm）
  - Timeline: `scripts/normalize-timeline-assets.sh`（画像→webp, 動画→webm）
- 変換後は埋め込み参照も自動で `webp/webm` 側へ更新

### Timeline のファイル名（推奨）

**日付は日付フォルダ名**（`src/data/timeline/YY-MM-DD/` 等）から自動取得します。ファイル名に日付を含める必要はありません。

- **通常（引用なし）**  
  `{表示順}_{account}.md`  
  例: `1_nattsu.md`（`nattsu` / `emo` / `tech`）
- **引用あり**  
  `{表示順}_{account}_{引用先id}.md`（3 段目は **引用元の `id` だけ**。日付の一部ではありません）  
  例: `2_emo_2026-04-27.md`（当日の初投稿 `2026-04-27` を引用）

`id` は「フォルダの日付 + 表示順」から自動（表示順 1 → `YYYY-MM-DD`、2 以降 → `YYYY-MM-DD-2` 形式）。同日内の並びは先頭の **表示順が大きいほど上**（**`1` がその日の最下位**）。

命名に合わない `.md` は `frontmatter` の `id` / `date` / `account` / `quoteTo` で従来どおり指定できます。

### Timeline の date 自動化（従来）

- 上記の命名でない `.md` では、`src/data/timeline/YY-MM-DD/` 等の日付フォルダから `date` を推定
- または frontmatter の `date` / `id` を利用

## ビルド確認

```bash
npm run build
```

## 本番デプロイ

- `main` へ push（または Actions の `workflow_dispatch`）
- Actions 内で Dropbox 同期 → build → GitHub Pages 配信