# nattsu Gallery

マルチメディア活動記録データベース

## 概要

自分の活動（文章、映像、画像、音楽、開発など）を一つのデータベースとして横断的に一覧・探索できるホームページ。

**シンプルな実装**: Vanilla JavaScript + HTML + CSSで実装。GitHub Pagesで公開。

## 特徴

- **スキーマレス設計**: 必須フィールドは`id`のみ。各ビューが独自にJSONを解釈
- **複数ビュー**: Grid View（デフォルト）、Table View、Simple View
- **動的サムネイル取得**: YouTube、SoundCloudから自動取得
- **Markdownサポート**: `assets/` 配下のMarkdownファイルを表示
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
  "url"?: string,                  // 動画・外部リンクURL または サムネイル取得用
  "title"?: string,
  "type"?: string,                 // write | picture | movie（Writer が作成）。その他は手動で可
  "date"?: string,
  "tags"?: string[],
  "assets"?: {
    "image"?: string,              // サムネイル／メイン画像（assets/ 内のパス）
    "md"?: string,                 // Markdown 記事（assets/ 内）
    "midi"?: string,               // MIDI（将来の拡張）
    "wav"?: string                 // WAV（将来の拡張）
  }
}
```

詳細は [`schema.md`](./schema.md) を参照してください。

### ファイル配置

- **メタデータ**: `data/items.json`
- **メディア一式**: `assets/` に集約
  - 記事: `assets/{id}.md`、添付画像・動画、記事カード用画像 `assets/{id}-card.*`
  - 画像1枚: `assets/{id}.{ext}`
  - 動画ファイル: `assets/{filename}`
- **動画・音楽**: 外部リンク（YouTube、SoundCloud 等）は `url` のみで参照

**移行**: 従来 `thumbnails/` にあった画像は `assets/` にコピーしてください（`items.json` の参照は `/assets/` に更新済み）。例: `cp thumbnails/* assets/`

## ビュー

### Grid View（デフォルト）

- カード形式でサムネイルを表示
- ホバー時に詳細パネルを表示
- クリック時に適切なページを開く（`article.html` で Markdown、外部URLはそのまま。`midi.html` / `audioplayer.html` は将来対応）

### Table View

- 表形式で一覧表示
- サムネイル、タイトル、タイプ、日付、タグを表示
- ツールチップでMarkdownプレビューを表示

### Simple View

- IDのみをリスト表示
- 最小限の情報表示

## サムネイル取得ロジック

1. `assets.image` が指定されている場合、それを最優先（すべて `assets/` 内のパス）
2. `url` が指定されている場合、URL の種類に応じて自動取得
   - **YouTube**: 動画IDから自動生成
   - **SoundCloud**: oEmbed API から取得
   - **その他**: `url` をそのまま使用
3. どちらもない場合、プレースホルダーを表示

## セットアップ

プロジェクトルートに起動用スクリプトを置いています。

| スクリプト | 用途 |
|------------|------|
| `./start-gallery.sh` | ギャラリーのみ（Python HTTP サーバー・ポート 8000） |
| `./start-writer.sh` | ギャラリー + Writer（Node サーバー・ポート 3333） |

### ギャラリーのみ（通常サーバー）

```bash
./start-gallery.sh
# → http://127.0.0.1:8000/
```

従来どおり `./dev-server.sh` や `python3 -m http.server 8000` でも起動できます。

### Writer（記事・画像・動画の追加）

**執筆は Writer アプリで行う**。記事・画像1枚・動画1本を登録し、`items.json` と `assets/` を自動更新する。**ローカルでのみ実行**し、公開サイトには含めません。

```bash
./start-writer.sh
# → ギャラリー http://127.0.0.1:3333/
# → Writer     http://127.0.0.1:3333/writer/
```

初回は `writer/node_modules` を自動でインストールします。手動で起動する場合は `cd writer && npm install && npm start` でも可。

- **記事を書く**: Markdown で本文を書き、画像は「画像」ボタンで貼り付け。**仮保存**で下書きをブラウザのローカルに保存し、あとから読み込んで本保存できる。
- **画像1枚**: 画像を1枚選択して登録。`assets/{id}.{ext}` に保存され、`type: "picture"` で1件追加。
- **動画1本**: YouTube URL または動画ファイルを指定。`type: "movie"` で1件追加。

タイプの分け方（write / picture / movie）と仮保存の詳細は [`docs/writer-design.md`](./docs/writer-design.md) を参照。

### GitHub Pages へのデプロイ

1. リポジトリの Settings > Pages で GitHub Actions を有効化
2. `.github/workflows/deploy.yml` が自動的にデプロイを実行
3. `main` ブランチにプッシュすると自動デプロイ

## プロジェクト構造

```
.
├── start-gallery.sh        # ギャラリー用サーバー起動（Python 8000）
├── start-writer.sh         # Writer 用サーバー起動（Node 3333）
├── dev-server.sh           # 開発サーバー起動（従来）
├── index.html              # メインページ
├── article.html            # 記事表示ページ（MarkdownをHTMLに変換）
├── styles.css              # スタイル
├── app.js                  # メインアプリケーション
├── writer/                 # 記事追加アプリ（ローカル専用・デプロイ対象外）
│   ├── server.js           # Writer 用ローカルサーバー
│   ├── index.html          # Writer のエントリ
│   ├── writer.js           # Writer フロント
│   ├── writer.css          # Writer スタイル
│   ├── package.json        # Writer の依存関係
│   └── README.md           # Writer の起動方法
├── js/
│   ├── grid-view.js        # Grid View実装
│   ├── table-view.js       # Table View実装
│   ├── simple-view.js      # Simple View実装
│   └── utils.js            # 共通ユーティリティ
├── data/
│   └── items.json          # メタデータ
├── assets/                 # メディア一式（.md, 画像, 動画ファイル）
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
  "url": "/assets/new-article.md",
  "assets": {
    "md": "/assets/new-article.md"
  }
}
```

### カスタマイズ

- **画像サイズ**: ヘッダーの「Size」スライダーで調整（Grid View時）
- 設定は `localStorage` に保存され、次回アクセス時も維持されます。## ライセンスMIT License