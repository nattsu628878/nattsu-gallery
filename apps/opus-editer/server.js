/**
 * Opus Editer 用ローカルサーバー（画像・動画のみ）
 * 実行: cd apps/opus-editer && node server.js → http://127.0.0.1:3333/ (ギャラリー), http://127.0.0.1:3333/opus-editer/
 * ローカル専用（localhost のみバインド）
 */
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const app = express();
const PORT_START = parseInt(process.env.PORT, 10) || 3333;
const PORT_END = PORT_START + 20;
const OPUS_EDITER_DIR = __dirname;
const ROOT = path.join(OPUS_EDITER_DIR, '..', '..');
// opus内にデータ/アセットを集約する
const DATA_DIR = path.join(ROOT, 'pages', 'opus', 'data');
const ASSETS_DIR = path.join(ROOT, 'pages', 'opus', 'assets');
const ITEMS_JSON = path.join(DATA_DIR, 'items.json');

const ARTICLE_EDITER_DIR = path.join(ROOT, 'apps', 'article-editer');
const ARTICLE_DATA_DIR = path.join(ROOT, 'pages', 'article', 'data');
const ARTICLE_ASSETS_DIR = path.join(ROOT, 'pages', 'article', 'assets');
const ARTICLES_JSON = path.join(ARTICLE_DATA_DIR, 'articles.json');
const execFileAsync = promisify(execFile);

app.use(express.json({ limit: '50mb' }));
app.use(express.static(ROOT, { index: 'index.html' }));
app.use('/opus-editer', express.static(OPUS_EDITER_DIR, { index: 'index.html' }));
app.use('/article-editer', express.static(ARTICLE_EDITER_DIR, { index: 'index.html' }));

function ensureDir(dir) {
  return fs.mkdir(dir, { recursive: true });
}

async function readItems() {
  try {
    const raw = await fs.readFile(ITEMS_JSON, 'utf8');
    const data = JSON.parse(raw);
    const normalized = Array.isArray(data) ? data : [];
    // 旧パス互換: /assets/* -> /pages/opus/assets/*
    const OLD_PREFIX = '/assets/';
    const NEW_PREFIX = '/pages/opus/assets/';
    normalized.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      if (typeof item.url === 'string' && item.url.startsWith(OLD_PREFIX)) {
        item.url = item.url.replace(OLD_PREFIX, NEW_PREFIX);
      }
      if (item.assets && typeof item.assets === 'object') {
        if (typeof item.assets.md === 'string' && item.assets.md.startsWith(OLD_PREFIX)) {
          item.assets.md = item.assets.md.replace(OLD_PREFIX, NEW_PREFIX);
        }
        if (typeof item.assets.image === 'string' && item.assets.image.startsWith(OLD_PREFIX)) {
          item.assets.image = item.assets.image.replace(OLD_PREFIX, NEW_PREFIX);
        }
      }
    });
    return normalized;
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

function isImageFilename(name) {
  const ext = path.extname(String(name || '')).toLowerCase();
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp';
}

async function saveImageAsWebp({ id, filename, base64Data }) {
  const inputExt = (path.extname(filename) || '.png').toLowerCase();
  const tempInput = path.join(ASSETS_DIR, `${id}__upload${inputExt}`);
  const webpName = `${id}.webp`;
  const webpPath = path.join(ASSETS_DIR, webpName);
  await fs.writeFile(tempInput, Buffer.from(base64Data, 'base64'));
  try {
    await execFileAsync('cwebp', ['-quiet', '-q', '80', tempInput, '-o', webpPath]);
    await fs.unlink(tempInput).catch(() => {});
    return webpName;
  } catch (_) {
    // cwebp がない環境でも保存自体は失敗させない
    const fallbackName = `${id}${inputExt}`;
    const fallbackPath = path.join(ASSETS_DIR, fallbackName);
    await fs.rename(tempInput, fallbackPath);
    return fallbackName;
  }
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

/** パスから assets 内のファイル名を取得（/pages/opus/assets/xxx → xxx, /assets/xxx → xxx） */
function assetPathToFilename(assetPath) {
  if (!assetPath || typeof assetPath !== 'string') return null;
  const s = assetPath
    .replace(/^\/pages\/opus\/assets\/?/, '')
    .replace(/^\/assets\/?/, '')
    .trim();
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
    if (item.url && (item.url.startsWith('/assets/') || item.url.startsWith('/pages/opus/assets/'))) {
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

    if (type === 'write') {
      return res.status(400).json({ error: '記事タイプは廃止されました。画像（picture）または動画（movie）を指定してください' });
    }
    if (type !== 'picture' && type !== 'movie') {
      return res.status(400).json({ error: 'type には picture または movie を指定してください' });
    }

    const item = {
      id: trimmedId,
      title: title && String(title).trim() || undefined,
      type,
      date: date && String(date).trim() || undefined,
      tags: Array.isArray(tags) ? tags.filter((t) => t && String(t).trim()) : undefined,
    };

    if (type === 'picture') {
      const { image } = req.body;
      if (!image || !image.filename || !image.data) {
        return res.status(400).json({ error: '画像データ（image.filename, image.data）が必要です' });
      }
      if (!isImageFilename(image.filename)) {
        return res.status(400).json({ error: '画像は jpg/jpeg/png/webp のみ対応です' });
      }
      await ensureDir(ASSETS_DIR);
      const fileName = await saveImageAsWebp({
        id: trimmedId,
        filename: image.filename,
        base64Data: image.data,
      });
      if (isUpsert && existingIndex >= 0) {
        const oldImage = items[existingIndex]?.assets?.image;
        const oldName = assetPathToFilename(oldImage);
        if (oldName && oldName !== fileName) {
          await fs.unlink(path.join(ASSETS_DIR, oldName)).catch(() => {});
        }
      }
      item.assets = { image: `/pages/opus/assets/${fileName}` };
    } else {
      const { url, videoFile } = req.body;
      if (videoFile && videoFile.filename && videoFile.data) {
        await ensureDir(ASSETS_DIR);
        const name = sanitizeFilename(videoFile.filename) || `${trimmedId}.mp4`;
        const outPath = path.join(ASSETS_DIR, name);
        await fs.writeFile(outPath, Buffer.from(videoFile.data, 'base64'));
        item.url = `/pages/opus/assets/${name}`;
      } else if (url && String(url).trim()) {
        item.url = String(url).trim();
      } else if (isUpsert && existingIndex >= 0 && items[existingIndex].url) {
        item.url = items[existingIndex].url;
      } else {
        return res.status(400).json({ error: '動画の URL または videoFile が必要です' });
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

/* —— Article（pages/article、article-editer）—— */

function sanitizeArticleId(id) {
  if (!id || typeof id !== 'string') return null;
  const s = id.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(s)) return null;
  return s.slice(0, 120);
}

function sanitizeMdFilename(name, fallbackId) {
  if (name && typeof name === 'string') {
    const base = path.basename(name.trim());
    if (/\.md$/i.test(base)) {
      return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
    }
  }
  if (fallbackId) return `${fallbackId}.md`;
  return null;
}

async function readArticles() {
  try {
    const raw = await fs.readFile(ARTICLES_JSON, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeArticles(articles) {
  await ensureDir(ARTICLE_DATA_DIR);
  await fs.writeFile(ARTICLES_JSON, JSON.stringify(articles, null, 2), 'utf8');
}

app.get('/api/article/articles', async (req, res) => {
  try {
    const articles = await readArticles();
    res.json(articles);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/article/articles', async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) return res.status(400).json({ error: 'articles は配列で送信してください' });
    await writeArticles(body);
    res.json({ ok: true, count: body.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/article/entry', async (req, res) => {
  try {
    const { title, date, tags, markdown, update: isUpdate } = req.body;
    const trimmedId = sanitizeArticleId(req.body.id);
    if (!trimmedId) {
      return res.status(400).json({ error: 'id は英数字・_- のみで指定してください' });
    }
    const filename = sanitizeMdFilename(req.body.file, trimmedId);
    if (!filename) {
      return res.status(400).json({ error: 'file は .md のファイル名で指定してください' });
    }

    const articles = await readArticles();
    const existingIndex = articles.findIndex((a) => a.id === trimmedId);
    const isUpsert = isUpdate === true;

    if (existingIndex >= 0 && !isUpsert) {
      return res.status(400).json({ error: `id "${trimmedId}" は既に存在します` });
    }
    if (existingIndex < 0 && isUpsert) {
      return res.status(400).json({ error: `id "${trimmedId}" が見つかりません` });
    }

    await ensureDir(ARTICLE_ASSETS_DIR);
    const outPath = path.join(ARTICLE_ASSETS_DIR, filename);
    await fs.writeFile(outPath, markdown != null ? String(markdown) : '', 'utf8');

    const entry = {
      id: trimmedId,
      title: title && String(title).trim() || trimmedId,
      date: date && String(date).trim() || undefined,
      tags: Array.isArray(tags) ? tags.filter((t) => t && String(t).trim()).map((t) => String(t).trim()) : undefined,
      file: filename,
    };

    if (existingIndex >= 0) {
      articles[existingIndex] = entry;
    } else {
      articles.push(entry);
    }
    await writeArticles(articles);
    res.json({ ok: true, article: entry, updated: existingIndex >= 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/article/:id', async (req, res) => {
  try {
    const trimmedId = sanitizeArticleId(req.params.id);
    if (!trimmedId) return res.status(400).json({ error: 'id が不正です' });
    const articles = await readArticles();
    const index = articles.findIndex((a) => a.id === trimmedId);
    if (index < 0) return res.status(404).json({ error: '記事が見つかりません' });
    const entry = articles[index];
    const name = entry.file ? path.basename(entry.file) : null;
    if (name) {
      const fp = path.join(ARTICLE_ASSETS_DIR, name);
      try {
        await fs.unlink(fp);
      } catch (e) {
        if (e.code !== 'ENOENT') console.error('unlink article md', fp, e);
      }
    }
    articles.splice(index, 1);
    await writeArticles(articles);
    res.json({ ok: true, deleted: trimmedId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

function tryListen(port) {
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`Gallery: http://127.0.0.1:${port}/`);
    console.log(`Opus Editer: http://127.0.0.1:${port}/opus-editer/`);
    console.log(`Article Editer: http://127.0.0.1:${port}/article-editer/`);
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
