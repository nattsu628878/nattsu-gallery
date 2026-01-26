# nattsu Gallery Admin (Tauri版)

記事追加用のTauriアプリケーションです。

## セットアップ

### 必要な環境

- Node.js (v18以上)
- Rust (最新版)
  ```bash
  # Rustのインストール（初回のみ）
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

### インストール

```bash
cd admin-app

# 依存関係のインストール
npm install
```

## 開発

```bash
# 開発サーバー起動
npm run dev

# または Tauri開発モード
npm run tauri dev
```

## ビルド

```bash
# アプリケーションをビルド
npm run tauri build
```

ビルドされたアプリケーションは `src-tauri/target/release/` に生成されます。

## 機能

- アイテム情報の入力フォーム
- `data/items.json`への自動保存
- サムネイル画像の自動コピー
- Markdownファイルの自動保存（writeタイプの場合）
- プロジェクトディレクトリの選択ダイアログ

## 使用方法

1. アプリケーションを起動
2. フォームに入力
3. サムネイル画像を選択
4. 「💾 保存」ボタンをクリック
5. プロジェクトのルートディレクトリを選択
6. 自動的に`data/items.json`と`thumbnails/`に保存されます
