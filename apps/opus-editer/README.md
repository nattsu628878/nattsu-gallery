# Opus Editer

画像・動画を追加して `items.json` を更新するローカル専用アプリ（記事タイプは廃止）。

## 起動

```bash
cd apps/opus-editer
npm install   # 初回のみ
npm start
```

- ギャラリー: http://127.0.0.1:3333/
- Opus Editer: http://127.0.0.1:3333/opus-editer/

## 構成

- `server.js` … ローカルサーバー（`pages/opus/data` / `pages/opus/assets` を参照）
- `index.html` … エントリ
- `opus-editer.js` / `opus-editer.css` … フロント
