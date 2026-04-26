# Article / Opus / Timeline データ形式

正本は Dropbox。リポジトリ上は `src/data/` 直下に**種別フォルダだけ**置く（余計な `content/` なし）。

---

## Article

| 項目 | 内容 |
|------|------|
| 置き場所 | `src/data/article/`（`*.md` と必要なら `data/`） |
| 記事 ID / URL | 原則 **ファイル名**（`*.md` を除く）。サブフォルダがあればそのパスがスラッグになる |
| 画像・動画 | 本文で Obsidian 埋め込み `![[名前.ext]]`、実体は `**/data/` に配置。ビルド前に `scripts/normalize-article-assets.sh` で webp / webm 化可 |

---

## Opus

| 項目 | 内容 |
|------|------|
| 置き場所 | `src/data/opus/`（必須: `youtube-link.md`、画像は `data/`） |
| YouTube | `youtube-link.md` を**パイプ区切り1行目ヘッダ**の表で管理 |

```text
id | title | url | date
26-04-01 | タイトル | https://www.youtube.com/watch?v=... | 26-04-01
```

| 列 | 備考 |
|----|------|
| id, title, url | 必須に近い |
| date | 省略可（id から補完されることあり） |

| 画像 | `data/` に **`{id}.拡子`** だけ置く（専用 `.md` は不要）。`normalize-opus-assets.sh` で WebP 化 |

---

## Timeline

| 項目 | 内容 |
|------|------|
| 置き場所 | `src/data/timeline/`。投稿は日付フォルダ配下: `YY-MM-DD/` または `YYYY-MM-DD/` |
| 日付 | **フォルダ名**から自動（本文 frontmatter 省略可） |
| 埋め込み | Article と同様 `![[...]]` 等。メディアは `timeline/data/` などに置き `normalize-timeline-assets.sh` 可 |

### ファイル名（推奨・`_` 区切り）

| 種別 | パターン | 例 |
|------|----------|-----|
| 通常 | `{表示順}_{account}.md` | `1_nattsu.md` |
| 引用 | `{表示順}_{account}_{引用先id}.md` | `2_emo_2026-04-27.md` |

- **account**: `nattsu` / `emo` / `tech`
- **表示順**: 同じ日付フォルダ内で数が**大きいほど上**、**1 が最下位**
- **id** は「フォルダの日付 + 表示順」から自動（1 番目 `YYYY-MM-DD`、2 以降 `YYYY-MM-DD-2` 形式）
- 上記に合わない `.md` は **YAML frontmatter**（`id` / `date` / `account` / `quoteTo` 等）で指定可能

---

## 補足

- Dropbox 取り込み: `scripts/fetch-dropbox-content.py` または `sync-dropbox-content.sh`
- 運用の全体像はルート [README.md](../README.md) を参照
