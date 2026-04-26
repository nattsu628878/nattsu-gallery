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

export function parseTimelineMarkdownFiles(markdownModules: Record<string, string>): TimelineItem[] {
  return Object.entries(markdownModules)
    .map(([filePath, raw]) => {
      const { meta, body } = parseFrontmatter(raw);
      const id = ensureId(filePath, meta.id);
      if (!id) return null;
      const image = meta.image?.trim();
      const video = meta.video?.trim();
      const item: TimelineItem = {
        id,
        date: meta.date?.trim() || undefined,
        account: meta.account?.trim() || undefined,
        quoteTo: meta.quoteTo?.trim() || undefined,
        content: body || undefined,
      };
      if (image || video) item.assets = { image: image || undefined, video: video || undefined };
      return item;
    })
    .filter((item): item is TimelineItem => Boolean(item));
}
