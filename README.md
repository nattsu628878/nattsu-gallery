# nattsu Gallery

マルチメディア活動記録データベース

## 概要

自分の活動（文章、映像、画像、音楽、開発など）を一つのデータベースとして横断的に一覧・探索できるホームページ。

**シンプルな実装**: Vanilla JavaScript + HTML + CSSで実装。GitHub Pagesで公開。

## 特徴

- **スキーマレス設計**: 必須フィールドは`id`のみ。各ビューが独自にJSONを解釈
- **複数ビュー**: Grid View（デフォルト）、Table View、Simple View
- **動的サムネイル取得**: YouTube、SoundCloudから自動取得
- **Markdownサポート**: `content/`配下のMarkdownファイルを表示
- **カスタマイズ可能**: 画像サイズ、背景色、フォントサイズを調整可能

## 技術スタック

- **HTML5**: マークアップ
- **CSS3**: スタイリング
- **Vanilla JavaScript (ES6 Modules)**: データ読み込みと表示
- **JSON**: メタデータ管理（`data/items.json`）
- **GitHub Pages**: ホスティング

## データ構造

### 基本スキーマ

```typescript
{
  "id": string,                    // 必須: 一意の識別子
  "url"?: string,                  // サムネイル取得用のURL
  "thumbnail"?: string,            // 直接サムネイルURL
  "title"?: string,
  "type"?: string,
  "date"?: string,
  "tags"?: string[],
  "assets"?: {
    "image"?: string,              // サムネイル画像（最優先）
    "md"?: string,                 // Markdownファイルのリンク（content配下）
    "midi"?: string,               // MIDIファイルのリンク（将来の拡張）
    "wav"?: string                 // WAVファイルのリンク（将来の拡張）
  }
}
```

詳細は [`schema.md`](./schema.md) を参照してください。

### ファイル配置

- **メタデータ**: `data/items.json`
- **サムネイル**: `thumbnails/`（GitHub上に保存）
- **文章**: `content/*.md`（GitHub上に保存、Markdown形式）
- **動画・音楽**: 外部リンク（YouTube、SoundCloud等）

## ビュー

### Grid View（デフォルト）

- カード形式でサムネイルを表示
- ホバー時に詳細パネルを表示
- クリック時に適切なページを開く（`article.html`、`midi.html`、`audioplayer.html`など）

### Table View

- 表形式で一覧表示
- サムネイル、タイトル、タイプ、日付、タグを表示
- ツールチップでMarkdownプレビューを表示

### Simple View

- IDのみをリスト表示
- 最小限の情報表示

## サムネイル取得ロジック

1. `assets.image`が指定されている場合、それを最優先
2. `thumbnail`が直接指定されている場合、それを使用
3. `url`が指定されている場合、URLの種類に応じて自動取得
   - **YouTube**: 動画IDから自動生成
   - **SoundCloud**: oEmbed APIから取得
   - **その他**: `url`をそのまま使用
4. どちらもない場合、プレースホルダーを表示

## セットアップ

### ローカル開発

```bash
# 開発サーバーを起動
./dev-server.sh

# または手動で起動
python3 -m http.server 8000

# ブラウザで http://localhost:8000 にアクセス
```

### GitHub Pages へのデプロイ

1. リポジトリの Settings > Pages で GitHub Actions を有効化
2. `.github/workflows/deploy.yml` が自動的にデプロイを実行
3. `main` ブランチにプッシュすると自動デプロイ

## プロジェクト構造

```
.
├── index.html              # メインページ
├── article.html            # 記事表示ページ（MarkdownをHTMLに変換）
├── styles.css              # スタイル
├── app.js                  # メインアプリケーション
├── js/
│   ├── grid-view.js        # Grid View実装
│   ├── table-view.js       # Table View実装
│   ├── simple-view.js      # Simple View実装
│   └── utils.js            # 共通ユーティリティ
├── data/
│   └── items.json          # メタデータ
├── content/
│   └── *.md                # 文章コンテンツ（Markdown）
├── thumbnails/              # サムネイル画像
├── schema.md               # スキーマ仕様書
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Pages デプロイ設定
```

## 使用方法

### アイテムの追加

`data/items.json`に新しいアイテムを追加：

```json
{
  "id": "2025-01-new-item",
  "title": "新しいアイテム",
  "type": "write",
  "date": "2025-01-25",
  "tags": ["blog", "article"],
  "url": "/content/new-article.md",
  "assets": {
    "md": "/content/new-article.md"
  }
}
```

### カスタマイズ

- **画像サイズ**: ヘッダーの「Size」スライダーで調整
- **背景色**: ヘッダーの「Background」カラーピッカーで変更
- **フォントサイズ**: ヘッダーの「Font」スライダーで調整

設定は`localStorage`に保存され、次回アクセス時も維持されます。

## ライセンスMIT License