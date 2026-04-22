https://nattsu628878.github.io/nattsu-gallery

# nattsu-gallery（自分用メモ）

このリポジトリは、`Astro + Svelte` で動く個人サイトです。  
`Opus`（ギャラリー）と `Article`（Markdown表示）がメインです。

## コマンド

- **開発（サイト全体）**: `./dev.sh`（Astro のみ。`npm run dev` の前に `predev` で Article アセット正規化）
- **Opus Editor**: `./start-opus-editor.sh`（Astro + `tools/opus-editor` を同時起動。未導入の `node_modules` は自動で `npm install`）
- ビルド: `npm run build`（`@astrojs/node` により静的ファイルは `dist/client`。GitHub Pages もここを公開）
- プレビュー: `npm run preview`（Node アダプタのサーバでプレビュー）

補足: `package.json` の `npm run dev` / `npm run dev:all` もそのまま使える。

## Article アセット運用ルール

対象ディレクトリ:
- `src/data/article/markdown/`
- `src/data/article/markdown/data/`

運用:
- 画像は `webp` に統一
- 動画は `webm` に統一
- 変換元（png/jpg/jpeg/mov/mp4）は自動変換後に削除
- Markdown 内リンクはスクリプトで自動置換

変換スクリプト:
- `scripts/normalize-article-assets.sh`

## ディレクトリ

- **Opus Editor（ローカル専用 UI）**: `tools/opus-editor`（Vite + Svelte）。Vite 開発サーバは、ブラウザからの `fetch` をプロキシで Astro 側へ渡す（`http://127.0.0.1:5174` → `.../nattsu-gallery/...`）。

### Opus の保存（API 経由）

- Opus エディタからの**一覧取得・保存・削除・並び替え**は、いずれも **Astro の API ルート**に HTTP で送る（ファイルを直接触る UI ではない）。
- ルート: `src/pages/api/editor/opus.ts`（`GET` / `POST` / `PUT` / `DELETE`）
- 保存先: マニフェストは `src/data/opus/items.json`、画像・動画は `public/opus/`（必要に応じてサーバ側の `cwebp` や一括 WebP スクリプトが動く）
- 本番の GitHub Pages ではこの API は動かない（**ローカルで `astro dev` しているときだけ**編集可能、という想定）

## コンテンツの置き場所

- Opus データ: `src/data/opus/items.json`

- Article 本文: `src/data/article/markdown/*.md`
- Article 画像/動画: `src/data/article/markdown/data/*`
（Obsidianから_mdを全コピペでOK）

## Article（記事）を更新するとき

1. いつもどおり **Obsidian** などで、`~/Library/CloudStorage/Dropbox/_md` を編集する。
2. リポジトリの**ルート**で次を実行する（コピー → `data` 内の画像・動画の正規化まで）。

   ```bash
   ./sync-obsidian.sh
   ```

3. 変更を **Git に commit** する（必要なら `git push` で本番デプロイまで）。

## メモ

- 開発中に「動画がモバイルで再生できない」場合は、まず拡張子を確認する（`webm` かどうか）
- `mov` は端末差が出やすいので基本使わない
- 文字は見た目同じでも Unicode 差分があるため、ファイル名の重複に注意（例: `で` の正規化差）