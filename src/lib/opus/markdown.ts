export type OpusItem = {
  id: string;
  title?: string;
  type?: string;
  date?: string;
  tags?: string[];
  url?: string;
  thumbnail?: string;
  assets?: {
    image?: string;
    wav?: string;
    midi?: string;
  };
};

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

function parseTags(value?: string) {
  if (!value) return undefined;
  const tags = value.split(",").map((tag) => tag.trim()).filter(Boolean);
  return tags.length ? tags : undefined;
}

function ensureId(filePath: string, frontmatterId?: string) {
  const fallback = filePath.replace(/\\/g, "/").split("/").pop()?.replace(/\.md$/i, "") ?? "";
  return String(frontmatterId || fallback).trim().replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function parseOpusMarkdownFiles(markdownModules: Record<string, string>): OpusItem[] {
  return Object.entries(markdownModules)
    .map(([filePath, raw]) => {
      const { meta } = parseFrontmatter(raw);
      const id = ensureId(filePath, meta.id);
      if (!id) return null;
      const item: OpusItem = {
        id,
        title: meta.title?.trim() || undefined,
        type: meta.type?.trim() || undefined,
        date: meta.date?.trim() || undefined,
        tags: parseTags(meta.tags),
        url: meta.url?.trim() || undefined,
        thumbnail: meta.thumbnail?.trim() || undefined,
      };
      const image = meta.image?.trim();
      const wav = meta.wav?.trim();
      const midi = meta.midi?.trim();
      if (image || wav || midi) item.assets = { image: image || undefined, wav: wav || undefined, midi: midi || undefined };
      return item;
    })
    .filter((item): item is OpusItem => Boolean(item));
}
