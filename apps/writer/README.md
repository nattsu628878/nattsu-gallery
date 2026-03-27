# Writer（記事追加アプリ）

記事・画像・動画を追加して `items.json` を自動生成するローカル専用アプリ。

## 起動

```bash
cd apps/writer
npm install   # 初回のみ
npm start
```

- ギャラリー: http://127.0.0.1:3333/
- Writer: http://127.0.0.1:3333/writer/

## 構成

- `server.js` … ローカルサーバー（`pages/opus/data` / `pages/opus/assets` を参照。メディアはすべて `pages/opus/assets` に保存）
- `index.html` … Writer のエントリ
- `writer.js` / `writer.css` … フロント
