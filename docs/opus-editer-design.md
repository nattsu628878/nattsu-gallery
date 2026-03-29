# Opus Editer 設計

## 目的

- **画像・動画**を登録し、`items.json` を自動生成する（**記事 type=write は廃止**。旧データは一覧で「記事(旧)」表示し、種別を画像/動画に変更して保存する）。
- **ローカル専用**: 自分だけが実行し、ファイルシステムに直接書き込む。

## タイプ（picture / movie）

| タイプ | 意味 |
|--------|------|
| **picture** | 画像1枚 → `assets.image` |
| **movie** | YouTube URL または動画ファイル / 直リンク `.mp4` など → `url` |

メディアは **`pages/opus/assets/`** に格納（外部 URL の動画は `url` のみ）。

## 仮保存

ブラウザ **localStorage**（キー: `opus_editer_drafts`。旧 `writer_drafts` は初回に移行）。

## アプリ構成

- **`apps/opus-editer/`** … `server.js`（Express）、`index.html`、`opus-editer.js`、`opus-editer.css`
- **URL**: `/opus-editer/`（ギャラリーは `/`）
- **起動**: `cd apps/opus-editer && npm start`

## API

- `GET /api/items` … `items.json`
- `PUT /api/items` … 並び順など一括更新
- `POST /api/entry` … 1件追加/更新（`type: picture | movie` のみ）
- `DELETE /api/items/:id` … 削除（関連アセットも削除）
