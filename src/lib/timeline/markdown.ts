export type TimelineItem = {
  id: string;
  date?: string;
  content?: string;
  /** ファイル名先頭の表示順（同日内ソート用） */
  order?: number;
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

/** 先頭2桁年を4桁年へ（例: 26-04-27 → 2026-04-27） */
function expandYearInDatePart(y: string): string {
  if (y.length === 4) return y;
  const n = parseInt(y, 10);
  if (!Number.isFinite(n) || n < 0) return y;
  if (n <= 99) return String(2000 + n);
  return y;
}

/** YY-MM-DD または YYYY-MM-DD を正規化 */
function normalizeDateOnly(token: string): string {
  const m = String(token).match(/^(\d{2,4})-(\d{2})-(\d{2})$/);
  if (!m) return String(token).trim();
  return `${expandYearInDatePart(m[1])}-${m[2]}-${m[3]}`;
}

/**
 * フォルダの日付 + 先頭表示順 だけで id
 * 表示順 1 → `2026-04-27`、2 以上 → `2026-04-27-2` 形式
 */
function idFromFolderDateAndOrder(folderDate: string, orderNum: number): string {
  const d = normalizeDateOnly(folderDate);
  const n = orderNum || 1;
  if (n <= 1) return d;
  return `${d}-${n}`;
}

/**
 * `表示順.md`（推奨）/ `表示順_任意文字列.md`（互換）を解釈
 */
function parseFilenameMeta(
  filePath: string,
  basename: string
): { id: string; date: string; order: number } | null {
  const folderDate = inferDateFromFilePath(filePath);
  if (folderDate) {
    const m = basename.match(/^(\d+)(?:_.*)?$/);
    const order = parseInt(m?.[1] ?? "", 10);
    if (Number.isFinite(order)) {
      return {
        id: idFromFolderDateAndOrder(folderDate, order),
        date: folderDate,
        order,
      };
    }
  }
  return null;
}

function inferDateFromFilePath(filePath: string, id?: string) {
  const normalized = filePath.replace(/\\/g, "/");
  const matchedPath = normalized.match(/(?:^|\/)(\d{2,4}-\d{2}-\d{2})(?:\/|$)/);
  if (matchedPath?.[1]) return normalizeDateOnly(matchedPath[1]);
  const matchedId = String(id || "").match(/^(\d{2,4}-\d{2}-\d{2})(?:[-_].*)?$/);
  if (matchedId?.[1]) return normalizeDateOnly(matchedId[1]);
  return undefined;
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
  const items = Object.entries(markdownModules)
    .map(([filePath, raw]) => {
      const { meta, body } = parseFrontmatter(raw);
      const stem = filePath.replace(/\\/g, "/").split("/").pop()?.replace(/\.md$/i, "") ?? "";
      const fromName = parseFilenameMeta(filePath, stem);
      const id = fromName ? fromName.id : ensureId(filePath, meta.id);
      if (!id) return null;
      const embedded = extractEmbeddedMedia(body, assetMap);
      const image =
        resolveAssetUrl(assetMap, meta.image?.trim()) || embedded.image || meta.image?.trim() || "";
      const video =
        resolveAssetUrl(assetMap, meta.video?.trim()) || embedded.video || meta.video?.trim() || "";
      const item: TimelineItem = {
        id,
        date: fromName?.date || meta.date?.trim() || inferDateFromFilePath(filePath, id),
        content: embedded.cleaned || undefined,
        order: fromName?.order,
      };
      if (image || video) item.assets = { image: image || undefined, video: video || undefined };
      return item;
    })
    .filter((item): item is TimelineItem => Boolean(item));

  return items.sort((a, b) => {
    const byDate = (b.date || "").localeCompare(a.date || "");
    if (byDate !== 0) return byDate;
    const oa = a.order ?? 0;
    const ob = b.order ?? 0;
    // 同日内は表示順の大きい方を上（1 が最下位）
    if (oa !== ob) return ob - oa;
    return a.id.localeCompare(b.id);
  });
}
