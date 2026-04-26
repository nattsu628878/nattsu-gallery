import { promises } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const ROOT = process.cwd();
const ITEMS_PATH = path.join(ROOT, "src", "data", "timeline", "items.json");
const TIMELINE_ASSETS_DIR = path.join(ROOT, "public", "timeline");
const execFileAsync = promisify(execFile);
async function readItems() {
  const raw = await promises.readFile(ITEMS_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}
async function writeItems(items) {
  await promises.writeFile(ITEMS_PATH, `${JSON.stringify(items, null, 2)}
`, "utf8");
}
function sanitizeId(id) {
  return String(id || "").trim().replace(/[^a-zA-Z0-9_-]/g, "-");
}
async function saveWebpFromBase64(id, filename, data) {
  await promises.mkdir(TIMELINE_ASSETS_DIR, { recursive: true });
  const inputExt = path.extname(filename || "").toLowerCase() || ".png";
  const tmpPath = path.join(TIMELINE_ASSETS_DIR, `${id}__upload${inputExt}`);
  const webpName = `${id}.webp`;
  const webpPath = path.join(TIMELINE_ASSETS_DIR, webpName);
  await promises.writeFile(tmpPath, Buffer.from(data, "base64"));
  try {
    await execFileAsync("cwebp", ["-quiet", "-q", "80", tmpPath, "-o", webpPath]);
    await promises.unlink(tmpPath).catch(() => {
    });
    return `/timeline/${webpName}`;
  } catch {
    const fallbackName = `${id}${inputExt}`;
    const fallbackPath = path.join(TIMELINE_ASSETS_DIR, fallbackName);
    await promises.rename(tmpPath, fallbackPath);
    return `/timeline/${fallbackName}`;
  }
}
async function saveWebmFromBase64(id, filename, data) {
  await promises.mkdir(TIMELINE_ASSETS_DIR, { recursive: true });
  const inputExt = path.extname(filename || "").toLowerCase() || ".mp4";
  const tmpPath = path.join(TIMELINE_ASSETS_DIR, `${id}__upload_video${inputExt}`);
  const webmName = `${id}.webm`;
  const webmPath = path.join(TIMELINE_ASSETS_DIR, webmName);
  await promises.writeFile(tmpPath, Buffer.from(data, "base64"));
  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      tmpPath,
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "32",
      "-c:a",
      "libopus",
      "-b:a",
      "96k",
      webmPath
    ]);
    await promises.unlink(tmpPath).catch(() => {
    });
    return `/timeline/${webmName}`;
  } catch {
    const safeExt = [".mp4", ".webm", ".mov", ".ogg"].includes(inputExt) ? inputExt : ".mp4";
    const fallbackName = `${id}${safeExt}`;
    const fallbackPath = path.join(TIMELINE_ASSETS_DIR, fallbackName);
    await promises.rename(tmpPath, fallbackPath);
    return `/timeline/${fallbackName}`;
  }
}
function isTimelineAssetReferenced(items, assetPath) {
  return items.some((item) => item.assets?.image === assetPath || item.assets?.video === assetPath);
}
async function unlinkTimelineAssetIfUnused(assetPath, items) {
  if (!assetPath || !assetPath.startsWith("/timeline/")) return;
  if (isTimelineAssetReferenced(items, assetPath)) return;
  await promises.unlink(path.join(TIMELINE_ASSETS_DIR, path.basename(assetPath))).catch(() => {
  });
}
const GET = async () => {
  try {
    const items = await readItems();
    return new Response(JSON.stringify(items), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return new Response(JSON.stringify({ error: "配列で送信してください" }), { status: 400 });
    }
    await writeItems(body);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const raw = body?.item ?? body;
    const id = sanitizeId(raw?.id);
    if (!id) return new Response(JSON.stringify({ error: "id は必須です" }), { status: 400 });
    const nextItem = {
      id,
      date: raw?.date ? String(raw.date).trim() : void 0,
      account: raw?.account ? String(raw.account).trim() : void 0,
      content: raw?.content ? String(raw.content).trim() : void 0
    };
    const existing = await readItems();
    const existingIndex = existing.findIndex((item) => item.id === id);
    const prev = existingIndex >= 0 ? existing[existingIndex] : null;
    const prevImagePath = prev?.assets?.image;
    const prevVideoPath = prev?.assets?.video;
    const image = body?.image;
    const videoFile = body?.videoFile;
    const nextAssets = {};
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
const DELETE = async ({ url }) => {
  try {
    const id = sanitizeId(url.searchParams.get("id") || "");
    if (!id) return new Response(JSON.stringify({ error: "id は必須です" }), { status: 400 });
    const items = await readItems();
    const target = items.find((item) => item.id === id);
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) {
      return new Response(JSON.stringify({ error: "対象が見つかりません" }), { status: 404 });
    }
    await writeItems(next);
    const imagePath = target?.assets?.image;
    const videoPath = target?.assets?.video;
    if (imagePath && imagePath.startsWith("/timeline/")) {
      await promises.unlink(path.join(TIMELINE_ASSETS_DIR, path.basename(imagePath))).catch(() => {
      });
    }
    if (videoPath && videoPath.startsWith("/timeline/")) {
      await promises.unlink(path.join(TIMELINE_ASSETS_DIR, path.basename(videoPath))).catch(() => {
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST,
  PUT,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
