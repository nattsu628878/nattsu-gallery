import { promises } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const ITEMS_PATH = path.join(ROOT, "src", "data", "opus", "items.json");
const OPUS_ASSETS_DIR = path.join(ROOT, "public", "opus");
const OPUS_WEBP_BATCH_SCRIPT = path.join(ROOT, "scripts", "convert-opus-assets-to-webp.sh");
async function runOpusAssetsToWebpBatch() {
  try {
    await execFileAsync("bash", [OPUS_WEBP_BATCH_SCRIPT], { cwd: ROOT });
  } catch (err) {
    console.error("[api/editor/opus] convert-opus-assets-to-webp.sh failed:", err);
  }
}
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
function parseTags(value) {
  if (!Array.isArray(value)) return void 0;
  const tags = value.map((v) => String(v).trim()).filter(Boolean);
  return tags.length ? tags : void 0;
}
async function saveWebpFromBase64(id, filename, data) {
  await promises.mkdir(OPUS_ASSETS_DIR, { recursive: true });
  const inputExt = path.extname(filename || "").toLowerCase() || ".png";
  const tmpPath = path.join(OPUS_ASSETS_DIR, `${id}__upload${inputExt}`);
  const webpName = `${id}.webp`;
  const webpPath = path.join(OPUS_ASSETS_DIR, webpName);
  await promises.writeFile(tmpPath, Buffer.from(data, "base64"));
  try {
    await execFileAsync("cwebp", ["-quiet", "-q", "80", tmpPath, "-o", webpPath]);
    await promises.unlink(tmpPath).catch(() => {
    });
    return `/opus/${webpName}`;
  } catch {
    const fallbackName = `${id}${inputExt}`;
    const fallbackPath = path.join(OPUS_ASSETS_DIR, fallbackName);
    await promises.rename(tmpPath, fallbackPath);
    return `/opus/${fallbackName}`;
  }
}
async function saveVideoFromBase64(id, filename, data) {
  await promises.mkdir(OPUS_ASSETS_DIR, { recursive: true });
  const ext = path.extname(filename || "").toLowerCase() || ".mp4";
  const safeExt = [".mp4", ".webm", ".ogg", ".mov"].includes(ext) ? ext : ".mp4";
  const outName = `${id}${safeExt}`;
  const outPath = path.join(OPUS_ASSETS_DIR, outName);
  await promises.writeFile(outPath, Buffer.from(data, "base64"));
  return `/opus/${outName}`;
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
    const type = raw?.type === "movie" ? "movie" : "picture";
    const nextItem = {
      id,
      title: raw?.title ? String(raw.title).trim() : void 0,
      type,
      date: raw?.date ? String(raw.date).trim() : void 0,
      tags: parseTags(raw?.tags)
    };
    const existing = await readItems();
    const existingIndex = existing.findIndex((i) => i.id === id);
    const prev = existingIndex >= 0 ? existing[existingIndex] : null;
    if (type === "picture") {
      const image = body?.image;
      if (image?.data && image?.filename) {
        nextItem.assets = { image: await saveWebpFromBase64(id, image.filename, image.data) };
      } else if (raw?.assets?.image) {
        nextItem.assets = { image: String(raw.assets.image) };
      } else if (prev?.assets?.image) {
        nextItem.assets = { image: prev.assets.image };
      } else {
        return new Response(JSON.stringify({ error: "画像データが必要です" }), { status: 400 });
      }
    } else {
      const videoFile = body?.videoFile;
      if (videoFile?.data && videoFile?.filename) {
        nextItem.url = await saveVideoFromBase64(id, videoFile.filename, videoFile.data);
      } else {
        nextItem.url = raw?.url ? String(raw.url).trim() : void 0;
      }
      if (!nextItem.url && prev?.url) nextItem.url = prev.url;
      if (!nextItem.url) {
        return new Response(JSON.stringify({ error: "動画URLまたは動画ファイルが必要です" }), { status: 400 });
      }
    }
    const next = [...existing];
    if (existingIndex >= 0) next[existingIndex] = nextItem;
    else next.push(nextItem);
    await writeItems(next);
    if (type === "picture" && body?.image?.data && body?.image?.filename) {
      await runOpusAssetsToWebpBatch();
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
    const target = items.find((i) => i.id === id);
    const next = items.filter((i) => i.id !== id);
    if (next.length === items.length) {
      return new Response(JSON.stringify({ error: "対象が見つかりません" }), { status: 404 });
    }
    await writeItems(next);
    const imagePath = target?.assets?.image;
    if (imagePath && imagePath.startsWith("/opus/")) {
      await promises.unlink(path.join(OPUS_ASSETS_DIR, path.basename(imagePath))).catch(() => {
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
