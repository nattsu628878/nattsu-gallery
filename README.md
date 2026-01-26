# nattsu Gallery

マルチメディア活動記録データベース - Vanilla JavaScript実装版

## 概要

自分の活動（文章、映像、画像、音楽、ソフトウェア、ハードウェアなど）を一つのデータベースとして横断的に一覧・探索できるホームページ。

**シンプルな実装**: Vanilla JavaScript + HTML + CSSで実装。

## 技術スタック

- **HTML5**: マークアップ
- **CSS3**: スタイリング
- **Vanilla JavaScript**: データ読み込みと表示
- **JSON**: メタデータ管理

## データ構造

### メタデータ（`data/items.json`）

各アイテムは以下の構造を持ちます：

```json
{
  "id": "unique-id",
  "type": "picture|movie|music|write|software|hardware",
  "title": "タイトル",
  "summary": "説明",
  "tags": ["tag1", "tag2"],
  "date": "2025-01-15",
  "thumbnail": "/thumbnails/image.jpg",
  "assets": {
    // type別の追加情報
  }
}
```

### ファイル配置

- **メタデータ**: `data/items.json`
- **サムネイル**: `thumbnails/`（GitHub上に保存）
- **文章**: `content/*.md`（GitHub上に保存、Markdown形式）
- **動画・音楽**: 外部リンク（YouTube、Dropbox等）

## セットアップ

```bash
# ローカルサーバーで起動（例：Python）
python3 -m http.server 8000

# または Node.js の http-server
npx http-server -p 8000

# ブラウザで http://localhost:8000 にアクセス
```

## プロジェクト構造

```
.
├── index.html          # メインページ
├── styles.css          # スタイル
├── app.js              # JavaScript（データ読み込みと表示）
├── data/
│   └── items.json      # メタデータ
├── content/
│   └── *.md            # 文章コンテンツ（Markdown）
├── article.html        # 記事表示ページ（MarkdownをHTMLに変換）
└── thumbnails/         # サムネイル画像
```

## 各typeの表示

- **picture**: 画像プレビュー
- **movie**: YouTube埋め込み or リンク
- **music**: 音声プレーヤー
- **write**: 記事へのリンク
- **software**: GitHub/Demoリンク
- **hardware**: 説明文

## 開発メモ

詳細は `history.md` を参照してください。

## Astro版との比較

- **Astro版**: `../nattsu-gallery-astro/` に保存
- **Vanilla JS版**: このディレクトリ（フレームワーク不要、シンプル）
