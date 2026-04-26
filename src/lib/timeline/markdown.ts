export type TimelineItem = {
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

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif|svg)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov)$/i;

function parseFrontmatter(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { meta: {}, body: normalized.trim() };
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) {
    return { meta: {}, body: normalized.trim() };
  }
  const block = normalized.slice(4, end);
  const body = normalized.slice(end + 5).trim();
  const meta: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    meta[key] = value.replace(/^"(.*)"$/, "$1");
  }
  return { meta, body };
}

function ensureId(filePath: string, frontmatterId?: string) {
  const fallback = filePath.replace(/\\/g, "/").split("/").pop()?.replace(/\.md$/i, "") ?? "";
  const id = String(frontmatterId || fallback).trim();
  return id.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function resolveAssetUrl(assetMap: Map<string, string>, target?: string) {
  const raw = String(target || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  const normalized = raw.replace(/^\/+/, "").replace(/\\/g, "/").toLowerCase();
  const exact = assetMap.get(normalized);
  if (exact) return exact;
  const file = normalized.split("/").pop() || normalized;
  return assetMap.get(file) || "";
}

function extractEmbeddedMedia(body: string, assetMap: Map<string, string>) {
  let cleaned = body;
  let image = "";
  let video = "";

  const pick = (targetRaw: string) => {
    const target = String(targetRaw || "").trim();
    if (!target) return;
    const resolved = resolveAssetUrl(assetMap, target);
    if (!resolved) return;
    if (!image && IMAGE_EXT_RE.test(target)) image = resolved;
    if (!video && VIDEO_EXT_RE.test(target)) video = resolved;
  };

  cleaned = cleaned.replace(/!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, (full, targetRaw) => {
    pick(targetRaw);
    return "";
  });

  cleaned = cleaned.replace(/!\[[^\]]*\]\(([^)]+)\)/g, (full, targetRaw) => {
    pick(targetRaw);
    return "";
  });

  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  return { image, video, cleaned };
}

export function parseTimelineMarkdownFiles(
  markdownModules: Record<string, string>,
  assetMap: Map<string, string> = new Map()
): TimelineItem[] {
  return Object.entries(markdownModules)
    .map(([filePath, raw]) => {
      const { meta, body } = parseFrontmatter(raw);
      const id = ensureId(filePath, meta.id);
      if (!id) return null;
      const embedded = extractEmbeddedMedia(body, assetMap);
      const image =
        resolveAssetUrl(assetMap, meta.image?.trim()) || embedded.image || meta.image?.trim() || "";
      const video =
        resolveAssetUrl(assetMap, meta.video?.trim()) || embedded.video || meta.video?.trim() || "";
      const item: TimelineItem = {
        id,
        date: meta.date?.trim() || undefined,
        account: meta.account?.trim() || undefined,
        quoteTo: meta.quoteTo?.trim() || undefined,
        content: embedded.cleaned || undefined,
      };
      if (image || video) item.assets = { image: image || undefined, video: video || undefined };
      return item;
    })
    .filter((item): item is TimelineItem => Boolean(item));
}
