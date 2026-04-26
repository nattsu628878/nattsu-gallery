export type OpusItem = {
  id: string;
  title?: string;
  type?: string;
  date?: string;
  url?: string;
  thumbnail?: string;
  assets?: {
    image?: string;
    wav?: string;
    midi?: string;
  };
};

export type OpusAssetEntry = {
  rel: string;
  url: string;
};

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

function resolveAssetUrl(assetMap: Map<string, string>, value?: string) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  const normalized = raw.replace(/^\/+/, "").replace(/\\/g, "/").toLowerCase();
  const exact = assetMap.get(normalized);
  if (exact) return exact;
  const file = normalized.split("/").pop() || normalized;
  return assetMap.get(file) || raw;
}

function inferDateFromId(id: string) {
  const matched = id.match(/^(\d{2,4}-\d{2}-\d{2})(?:[-_].*)?$/);
  return matched?.[1];
}

function parseFrontmatter(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { meta: {}, body: normalized.trim() };
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) return { meta: {}, body: normalized.trim() };
  const block = normalized.slice(4, end);
  const body = normalized.slice(end + 5).trim();
  const meta: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
    if (key) meta[key] = value;
  }
  return { meta, body };
}

function ensureId(filePath: string, frontmatterId?: string) {
  const fallback = filePath.replace(/\\/g, "/").split("/").pop()?.replace(/\.md$/i, "") ?? "";
  return String(frontmatterId || fallback).trim().replace(/[^a-zA-Z0-9_-]/g, "-");
}

function extractYouTubeLinks(raw: string, filePath: string): OpusItem[] {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  if (!normalizedPath.endsWith("/youtube-link.md")) return [];
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const items: OpusItem[] = [];
  let idx = 0;
  let headerMap: Record<string, number> | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const columns = trimmed
      .split("|")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    if (headerMap === null) {
      const header = columns.map((value) => value.toLowerCase());
      const hasId = header.includes("id");
      const hasTitle = header.includes("title");
      const hasUrl = header.includes("url");
      if (hasId && hasTitle && hasUrl) {
        headerMap = {};
        header.forEach((name, index) => {
          headerMap![name] = index;
        });
        continue;
      }
      // header がない場合は `id | title | url | date` を既定として扱う
      headerMap = { id: 0, title: 1, url: 2, date: 3 };
    }

    const idRaw = columns[headerMap.id ?? 0];
    const titleRaw = columns[headerMap.title ?? 1];
    const urlRaw = columns[headerMap.url ?? 2];
    const dateRaw = columns[headerMap.date ?? 3];
    const id = String(idRaw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "-");
    const url = String(urlRaw || "").trim();
    if (!id || !url) continue;
    idx += 1;
    items.push({
      id,
      title: String(titleRaw || "").trim() || `YouTube ${idx}`,
      type: "movie",
      date: String(dateRaw || "").trim() || inferDateFromId(id) || undefined,
      url,
      thumbnail: id,
    });
  }
  return items;
}

function normalizeYouTubeLinksFile(raw: string, filePath: string) {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  if (!normalizedPath.endsWith("/youtube-link.md")) return raw;
  return raw
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith("#")) return false;
      return !/^---+$/.test(trimmed);
    })
    .join("\n");
}

function parseFrontmatterOrBody(raw: string, filePath: string) {
  const normalized = normalizeYouTubeLinksFile(raw, filePath);
  const parsed = parseFrontmatter(normalized);
  if (Object.keys(parsed.meta).length > 0) return parsed;
  return parseFrontmatter(raw);
}

export function parseOpusMarkdownFiles(
  markdownModules: Record<string, string>,
  assetMap: Map<string, string> = new Map(),
  assetEntries: OpusAssetEntry[] = []
): OpusItem[] {
  const items: OpusItem[] = [];
  const usedIds = new Set<string>();
  for (const [filePath, raw] of Object.entries(markdownModules)) {
    const links = extractYouTubeLinks(raw, filePath);
    if (links.length > 0) {
      const normalizedLinks = links.map((item) => ({
          ...item,
          id: item.id.trim(),
          ...(() => {
            const resolved = resolveAssetUrl(assetMap, item.thumbnail);
            const fallback = item.thumbnail?.trim();
            const isUnresolvedId = !resolved || (fallback && resolved === fallback);
            return {
              thumbnail: isUnresolvedId ? undefined : resolved,
            };
          })(),
        }));
      for (const item of normalizedLinks) {
        if (!item.id || usedIds.has(item.id)) continue;
        items.push(item);
        usedIds.add(item.id);
      }
      continue;
    }

    const { meta } = parseFrontmatterOrBody(raw, filePath);
    const id = ensureId(filePath, meta.id);
    if (!id) continue;
    const item: OpusItem = {
      id,
      title: meta.title?.trim() || undefined,
      type: meta.type?.trim() || undefined,
      date: meta.date?.trim() || undefined,
      url: resolveAssetUrl(assetMap, meta.url?.trim()) || meta.url?.trim() || undefined,
      thumbnail: resolveAssetUrl(assetMap, meta.thumbnail?.trim()) || meta.thumbnail?.trim() || undefined,
    };
    const image = resolveAssetUrl(assetMap, meta.image?.trim()) || meta.image?.trim();
    const wav = meta.wav?.trim();
    const midi = meta.midi?.trim();
    if (image || wav || midi) item.assets = { image: image || undefined, wav: wav || undefined, midi: midi || undefined };
    if (usedIds.has(item.id)) continue;
    items.push(item);
    usedIds.add(item.id);
  }

  for (const entry of assetEntries) {
    const rel = entry.rel.replace(/\\/g, "/");
    const lowerRel = rel.toLowerCase();
    const file = lowerRel.split("/").pop() || lowerRel;
    const ext = file.includes(".") ? file.slice(file.lastIndexOf(".")) : "";
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    const id = file.replace(/\.[^.]+$/i, "");
    if (!id || usedIds.has(id)) continue;
    const imageUrl = resolveAssetUrl(assetMap, id) || entry.url;
    items.push({
      id,
      title: undefined,
      type: "picture",
      date: inferDateFromId(id),
      thumbnail: imageUrl,
      assets: { image: imageUrl },
    });
    usedIds.add(id);
  }
  return items;
}
