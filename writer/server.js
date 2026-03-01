/**
 * 記事追加用 Writer アプリのローカルサーバー
 * 実行: cd writer && node server.js → http://127.0.0.1:3333/ (ギャラリー), http://127.0.0.1:3333/writer/ (Writer)
 * ローカル専用（localhost のみバインド）
 */
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT_START = parseInt(process.env.PORT, 10) || 3333;
const PORT_END = PORT_START + 20;
const WRITER_DIR = __dirname;
const ROOT = path.join(WRITER_DIR, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ASSETS_DIR = path.join(ROOT, 'assets');
const ITEMS_JSON = path.join(DATA_DIR, 'items.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.static(ROOT, { index: 'index.html' }));
app.use('/writer', express.static(WRITER_DIR, { index: 'index.html' }));

function ensureDir(dir) {
  return fs.mkdir(dir, { recursive: true });
}

async function readItems() {
  try {
    const raw = await fs.readFile(ITEMS_JSON, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeItems(items) {
  await ensureDir(DATA_DIR);
  await fs.writeFile(ITEMS_JSON, JSON.stringify(items, null, 2), 'utf8');
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}

app.get('/api/items', async (req, res) => {
  try {
    const items = await readItems();
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/items', async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) return res.status(400).json({ error: 'items は配列で送信してください' });
    await writeItems(body);
    res.json({ ok: true, count: body.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/** パスから assets 内のファイル名を取得（/assets/xxx → xxx） */
function assetPathToFilename(assetPath) {
  if (!assetPath || typeof assetPath !== 'string') return null;
  const s = assetPath.replace(/^\/assets\/?/, '').trim();
  return s || null;
}

app.delete('/api/items/:id', async (req, res) => {
  try {
    const id = (req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id は必須です' });
    const items = await readItems();
    const index = items.findIndex((i) => i.id === id);
    if (index < 0) return res.status(404).json({ error: 'アイテムが見つかりません' });
    const item = items[index];
    const toDelete = [];
    if (item.assets) {
      if (item.assets.md) {
        const name = assetPathToFilename(item.assets.md);
        if (name) toDelete.push(path.join(ASSETS_DIR, name));
      }
      if (item.assets.image) {
        const name = assetPathToFilename(item.assets.image);
        if (name) toDelete.push(path.join(ASSETS_DIR, name));
      }
    }
    if (item.url && item.url.startsWith('/assets/')) {
      const name = assetPathToFilename(item.url);
      if (name) toDelete.push(path.join(ASSETS_DIR, name));
    }
    for (const filePath of toDelete) {
      try {
        await fs.unlink(filePath);
      } catch (e) {
        if (e.code !== 'ENOENT') console.error('delete asset', filePath, e);
      }
    }
    items.splice(index, 1);
    await writeItems(items);
    res.json({ ok: true, deleted: id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/entry', async (req, res) => {
  try {
    const { type, id, title, date, tags, update: isUpdate } = req.body;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ error: 'id は必須です' });
    }
    const trimmedId = id.trim();
    const items = await readItems();
    const existingIndex = items.findIndex((i) => i.id === trimmedId);
    const isUpsert = isUpdate === true;

    if (existingIndex >= 0 && !isUpsert) {
      return res.status(400).json({ error: `id "${trimmedId}" は既に存在します` });
    }

    const item = {
      id: trimmedId,
      title: title && String(title).trim() || undefined,
      type: type === 'write' || type === 'picture' ? type : 'movie',
      date: date && String(date).trim() || undefined,
      tags: Array.isArray(tags) ? tags.filter((t) => t && String(t).trim()) : undefined,
    };

    if (type === 'write') {
      const { markdown, attachments, topImage } = req.body;
      await ensureDir(ASSETS_DIR);
      const mdPath = path.join(ASSETS_DIR, `${trimmedId}.md`);
      await fs.writeFile(mdPath, markdown != null ? String(markdown) : '', 'utf8');

      if (Array.isArray(attachments) && attachments.length > 0) {
        for (const att of attachments) {
          const name = att.filename && sanitizeFilename(att.filename);
          const data = att.data;
          if (name && data) {
            const buf = Buffer.from(data, 'base64');
            const outPath = path.join(ASSETS_DIR, name);
            await fs.writeFile(outPath, buf);
          }
        }
      }

      if (topImage && topImage.filename && topImage.data) {
        await ensureDir(ASSETS_DIR);
        const ext = path.extname(topImage.filename) || '.jpg';
        const fileName = `${trimmedId}-card${ext}`;
        const outPath = path.join(ASSETS_DIR, fileName);
        await fs.writeFile(outPath, Buffer.from(topImage.data, 'base64'));
        item.assets = { md: `/assets/${trimmedId}.md`, image: `/assets/${fileName}` };
      } else {
        item.assets = { md: `/assets/${trimmedId}.md` };
        if (isUpsert && existingIndex >= 0 && items[existingIndex].assets && items[existingIndex].assets.image) {
          item.assets.image = items[existingIndex].assets.image;
        }
      }

      item.url = `/assets/${trimmedId}.md`;
    } else if (type === 'picture') {
      const { image } = req.body;
      if (!image || !image.filename || !image.data) {
        return res.status(400).json({ error: '画像データ（image.filename, image.data）が必要です' });
      }
      await ensureDir(ASSETS_DIR);
      const ext = path.extname(image.filename) || '.jpg';
      const fileName = `${trimmedId}${ext}`;
      const outPath = path.join(ASSETS_DIR, fileName);
      await fs.writeFile(outPath, Buffer.from(image.data, 'base64'));
      item.assets = { image: `/assets/${fileName}` };
    } else {
      const { url, videoFile } = req.body;
      if (videoFile && videoFile.filename && videoFile.data) {
        await ensureDir(ASSETS_DIR);
        const name = sanitizeFilename(videoFile.filename) || `${trimmedId}.mp4`;
        const outPath = path.join(ASSETS_DIR, name);
        await fs.writeFile(outPath, Buffer.from(videoFile.data, 'base64'));
        item.url = `/assets/${name}`;
      } else if (url && String(url).trim()) {
        item.url = String(url).trim();
      } else if (isUpsert && existingIndex >= 0 && items[existingIndex].url) {
        item.url = items[existingIndex].url;
      }
    }

    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }
    await writeItems(items);
    res.json({ ok: true, item, updated: existingIndex >= 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

function tryListen(port) {
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`Gallery: http://127.0.0.1:${port}/`);
    console.log(`Writer:  http://127.0.0.1:${port}/writer/`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < PORT_END) {
      tryListen(port + 1);
    } else {
      console.error(err.code === 'EADDRINUSE'
        ? `\nポート ${PORT_START}～${PORT_END - 1} はすべて使用中です。`
        : err.message);
      process.exit(1);
    }
  });
}

tryListen(PORT_START);
