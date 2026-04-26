import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const prerender = false;

const ROOT = process.cwd();
const TIMELINE_MARKDOWN_DIR = path.join(ROOT, 'src', 'data', 'timeline', 'markdown');
const TIMELINE_ASSETS_DIR = path.join(ROOT, 'public', 'timeline');
const execFileAsync = promisify(execFile);

type TimelineItem = {
  id: string;
  date?: string;
  account?: string;
  content?: string;
  quoteTo?: string;
  assets?: {
    image?: string;
    video?: string;
  };
};

async function readItems(): Promise<TimelineItem[]> {
  await fs.mkdir(TIMELINE_MARKDOWN_DIR, { recursive: true });
  const files = (await fs.readdir(TIMELINE_MARKDOWN_DIR))
    .filter((name) => name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));
  const items: TimelineItem[] = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(TIMELINE_MARKDOWN_DIR, file), 'utf8');
    const normalized = raw.replace(/\r\n/g, '\n');
    const hasFrontmatter = normalized.startsWith('---\n');
    const end = hasFrontmatter ? normalized.indexOf('\n---\n', 4) : -1;
    const frontmatter = hasFrontmatter && end >= 0 ? normalized.slice(4, end) : '';
    const body = hasFrontmatter && end >= 0 ? normalized.slice(end + 5).trim() : normalized.trim();
    const meta: Record<string, string> = {};
    if (frontmatter) {
      for (const line of frontmatter.split('\n')) {
        const idx = line.indexOf(':');
        if (idx <= 0) continue;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1');
        if (key) meta[key] = value;
      }
    }
    const fallbackId = file.replace(/\.md$/i, '');
    const id = sanitizeId(meta.id || fallbackId);
    if (!id) continue;
    const item: TimelineItem = {
      id,
      date: meta.date?.trim() || undefined,
      account: meta.account?.trim() || undefined,
      quoteTo: meta.quoteTo?.trim() || undefined,
      content: body || undefined
    };
    const image = meta.image?.trim();
    const video = meta.video?.trim();
    if (image || video) item.assets = { image: image || undefined, video: video || undefined };
    items.push(item);
  }
  return items;
}

async function writeItems(items: TimelineItem[]) {
  await fs.mkdir(TIMELINE_MARKDOWN_DIR, { recursive: true });
  const existing = await fs.readdir(TIMELINE_MARKDOWN_DIR).catch(() => []);
  await Promise.all(
    existing
      .filter((name) => name.toLowerCase().endsWith('.md'))
      .map((name) => fs.unlink(path.join(TIMELINE_MARKDOWN_DIR, name)).catch(() => {}))
  );
  for (const item of items) {
    const id = sanitizeId(item.id);
    if (!id) continue;
    const lines = [
      '---',
      `id: ${id}`,
      item.date ? `date: ${item.date}` : '',
      item.account ? `account: ${item.account}` : '',
      item.quoteTo ? `quoteTo: ${sanitizeId(item.quoteTo)}` : '',
      item.assets?.image ? `image: ${item.assets.image}` : '',
      item.assets?.video ? `video: ${item.assets.video}` : '',
      '---',
      item.content?.trim() || ''
    ].filter(Boolean);
    await fs.writeFile(path.join(TIMELINE_MARKDOWN_DIR, `${id}.md`), `${lines.join('\n')}\n`, 'utf8');
  }
}

function sanitizeId(id: string) {
  return String(id || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-');
}

async function saveWebpFromBase64(id: string, filename: string, data: string) {
  await fs.mkdir(TIMELINE_ASSETS_DIR, { recursive: true });
  const inputExt = path.extname(filename || '').toLowerCase() || '.png';
  const tmpPath = path.join(TIMELINE_ASSETS_DIR, `${id}__upload${inputExt}`);
  const webpName = `${id}.webp`;
  const webpPath = path.join(TIMELINE_ASSETS_DIR, webpName);

  await fs.writeFile(tmpPath, Buffer.from(data, 'base64'));
  try {
    await execFileAsync('cwebp', ['-quiet', '-q', '80', tmpPath, '-o', webpPath]);
    await fs.unlink(tmpPath).catch(() => {});
    return `/timeline/${webpName}`;
  } catch {
    const fallbackName = `${id}${inputExt || '.png'}`;
    const fallbackPath = path.join(TIMELINE_ASSETS_DIR, fallbackName);
    await fs.rename(tmpPath, fallbackPath);
    return `/timeline/${fallbackName}`;
  }
}

async function saveWebmFromBase64(id: string, filename: string, data: string) {
  await fs.mkdir(TIMELINE_ASSETS_DIR, { recursive: true });
  const inputExt = path.extname(filename || '').toLowerCase() || '.mp4';
  const tmpPath = path.join(TIMELINE_ASSETS_DIR, `${id}__upload_video${inputExt}`);
  const webmName = `${id}.webm`;
  const webmPath = path.join(TIMELINE_ASSETS_DIR, webmName);

  await fs.writeFile(tmpPath, Buffer.from(data, 'base64'));
  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      tmpPath,
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '0',
      '-crf',
      '32',
      '-c:a',
      'libopus',
      '-b:a',
      '96k',
      webmPath
    ]);
    await fs.unlink(tmpPath).catch(() => {});
    return `/timeline/${webmName}`;
  } catch {
    const safeExt = ['.mp4', '.webm', '.mov', '.ogg'].includes(inputExt) ? inputExt : '.mp4';
    const fallbackName = `${id}${safeExt}`;
    const fallbackPath = path.join(TIMELINE_ASSETS_DIR, fallbackName);
    await fs.rename(tmpPath, fallbackPath);
    return `/timeline/${fallbackName}`;
  }
}

function isTimelineAssetReferenced(items: TimelineItem[], assetPath: string) {
  return items.some((item) => item.assets?.image === assetPath || item.assets?.video === assetPath);
}

async function unlinkTimelineAssetIfUnused(assetPath: string | undefined, items: TimelineItem[]) {
  if (!assetPath || !assetPath.startsWith('/timeline/')) return;
  if (isTimelineAssetReferenced(items, assetPath)) return;
  await fs.unlink(path.join(TIMELINE_ASSETS_DIR, path.basename(assetPath))).catch(() => {});
}

export const GET: APIRoute = async () => {
  try {
    const items = await readItems();
    return new Response(JSON.stringify(items), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return new Response(JSON.stringify({ error: '配列で送信してください' }), { status: 400 });
    }
    await writeItems(body as TimelineItem[]);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const raw = body?.item ?? body;
    const id = sanitizeId(raw?.id);
    if (!id) return new Response(JSON.stringify({ error: 'id は必須です' }), { status: 400 });

    const nextItem: TimelineItem = {
      id,
      date: raw?.date ? String(raw.date).trim() : undefined,
      account: raw?.account ? String(raw.account).trim() : undefined,
      content: raw?.content ? String(raw.content).trim() : undefined,
      quoteTo: raw?.quoteTo ? sanitizeId(raw.quoteTo) : undefined
    };

    const existing = await readItems();
    const existingIndex = existing.findIndex((item) => item.id === id);
    const prev = existingIndex >= 0 ? existing[existingIndex] : null;
    const prevImagePath = prev?.assets?.image;
    const prevVideoPath = prev?.assets?.video;

    const image = body?.image;
    const videoFile = body?.videoFile;
    const nextAssets: { image?: string; video?: string } = {};

    if (image?.data && image?.filename) {
      nextAssets.image = await saveWebpFromBase64(id, image.filename, image.data);
    } else if (raw?.assets?.image) {
      nextAssets.image = String(raw.assets.image);
    } else if (prev?.assets?.image) {
      nextAssets.image = prev.assets.image;
    }

    if (videoFile?.data && videoFile?.filename) {
      nextAssets.video = await saveWebmFromBase64(id, videoFile.filename, videoFile.data);
    } else if (raw?.assets?.video) {
      nextAssets.video = String(raw.assets.video);
    } else if (prev?.assets?.video) {
      nextAssets.video = prev.assets.video;
    }

    if (nextAssets.image || nextAssets.video) nextItem.assets = nextAssets;
    const next = [...existing];
    if (existingIndex >= 0) next[existingIndex] = nextItem;
    else next.push(nextItem);
    await writeItems(next);
    if (prevImagePath !== nextItem.assets?.image) {
      await unlinkTimelineAssetIfUnused(prevImagePath, next);
    }
    if (prevVideoPath !== nextItem.assets?.video) {
      await unlinkTimelineAssetIfUnused(prevVideoPath, next);
    }
    return new Response(JSON.stringify({ ok: true, item: nextItem }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = sanitizeId(url.searchParams.get('id') || '');
    if (!id) return new Response(JSON.stringify({ error: 'id は必須です' }), { status: 400 });
    const items = await readItems();
    const target = items.find((item) => item.id === id);
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) {
      return new Response(JSON.stringify({ error: '対象が見つかりません' }), { status: 404 });
    }
    await writeItems(next);
    const imagePath = target?.assets?.image;
    const videoPath = target?.assets?.video;
    if (imagePath && imagePath.startsWith('/timeline/')) {
      await fs.unlink(path.join(TIMELINE_ASSETS_DIR, path.basename(imagePath))).catch(() => {});
    }
    if (videoPath && videoPath.startsWith('/timeline/')) {
      await fs.unlink(path.join(TIMELINE_ASSETS_DIR, path.basename(videoPath))).catch(() => {});
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
};
