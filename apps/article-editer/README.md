# article-editer

`pages/article/data/articles.json` と `pages/article/assets/*.md` を編集するローカル UI。

## 起動

**`apps/opus-editer` のサーバーに統合**されています（同一プロセス・同一ポート）。

```bash
cd apps/opus-editer
npm start
```

- Article Editer: http://127.0.0.1:3333/article-editer/

## API（`apps/opus-editer/server.js`）

| メソッド | パス | 内容 |
|----------|------|------|
| GET | `/api/article/articles` | `articles.json` |
| PUT | `/api/article/articles` | 一覧の一括保存 |
| POST | `/api/article/entry` | 1件保存（`markdown` + メタデータ） |
| DELETE | `/api/article/:id` | 削除（JSON + `.md`） |
