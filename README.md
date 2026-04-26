https://nattsu628878.github.io/nattsu-gallery

# nattsu-gallery

## 前提

- 本文データの正本は Dropbox（`article` / `opus` / `timeline`）
- リポジトリ側の `src/data/...` と `public/...` は同期結果（`.gitignore` 対象）

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
- 画像は md 不要（`opus/content/data/` に `id` と同名ファイルを置くだけ）
- 画像の `type` は自動で `picture`
- 画像の `date` は `id` から自動取得
  - 例: `26-04-01.webp` → `date: 26-04-01`
  - 例: `26-04-01-2.webp` → `date: 26-04-01`
- 画像は `normalize-opus-assets.sh` で自動的に WebP へ変換

## Article / Timeline の Obsidian 埋め込み

- `article/content/*.md`, `timeline/content/*.md` 内で Obsidian 埋め込みを利用可能
  - 例: `![[sample.png]]`, `![[movie.mp4]]`
- 実ファイルは `article/content/data/`, `timeline/content/data/` に配置
- 同期後に以下スクリプトで自動変換
  - Article: `scripts/normalize-article-assets.sh`（画像→webp, 動画→webm）
  - Timeline: `scripts/normalize-timeline-assets.sh`（画像→webp, 動画→webm）
- 変換後は埋め込み参照も自動で `webp/webm` 側へ更新

### Timeline のファイル名（推奨）

日付フォルダ配下のファイル名に **表示順・アカウント・（引用先）・日付・通し** を入れると、`id` / `date` / `account` / `quoteTo` を frontmatter なしで扱えます。`id` は自動生成されます（1番目 `YYYY-MM-DD`、2番目以降 `YYYY-MM-DD-2` 形式）。

- **通常（引用なし）**  
  `{表示順}_{account}_{日付と同形}_通し.md`  
  例: `1_nattsu_26-04-27_2.md`（`nattsu` / `emo` / `tech`）
- **引用あり**  
  `{表示順}_{account}_{引用先id}_{同じ日付}_通し.md`  
  例: `1_emo_2026-04-27_26-04-27_2.md`（`2026-04-27` が引用先。引用先の `id` ルールに合わせる）

日付は `YY-MM-DD` または `YYYY-MM-DD` どちらでも可。同日内の並びはファイル名先頭の **表示順**、次点で `id` の文字列比較に従います。旧来の **frontmatter だけ** でも従来どおり動作します。

### Timeline の date 自動化（従来）

- 上記の命名でない `.md` では、`timeline/content/YY-MM-DD/` 等の日付フォルダから `date` を推定
- または frontmatter の `date` / `id` を利用

## ビルド確認

```bash
npm run build
```

## 本番デプロイ

- `main` へ push（または Actions の `workflow_dispatch`）
- Actions 内で Dropbox 同期 → build → GitHub Pages 配信