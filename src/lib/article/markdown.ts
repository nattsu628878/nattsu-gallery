import { marked } from 'marked';

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov)$/i;

export type ArticleDoc = {
  id: string;
  slug: string;
  filename: string;
  raw: string;
};

export function markdownIdFromFilePath(filePath: string) {
  const normalized = filePath.replace(/\\/g, '/');
  const filename = normalized.split('/').pop() || '';
  return filename.replace(/\.md$/i, '').normalize('NFC');
}

export function buildArticleCollections(
  markdownModules: Record<string, string>,
  assetModules: Record<string, string>,
  markdownRoot: string
) {
  const docs: ArticleDoc[] = Object.entries(markdownModules).map(([filePath, raw]) => {
    const normalized = filePath.replace(/\\/g, '/');
    const rel = normalized.includes(markdownRoot)
      ? normalized.split(markdownRoot)[1]
      : normalized.split('/').slice(-1)[0];
    const slug = rel.replace(/\.md$/i, '');
    const filename = rel.split('/').pop() || '';
    const id = markdownIdFromFilePath(filename);
    return { id, filename, slug, raw };
  });

  const docMap = new Map<string, ArticleDoc>();
  docs.forEach((doc) => {
    const bySlug = doc.slug.toLowerCase();
    const byId = doc.id.toLowerCase();
    if (!docMap.has(bySlug)) docMap.set(bySlug, doc);
    if (!docMap.has(byId)) docMap.set(byId, doc);
  });

  const assetMap = new Map<string, string>();
  Object.entries(assetModules).forEach(([filePath, url]) => {
    const normalized = filePath.replace(/\\/g, '/');
    const rel = normalized.includes(markdownRoot)
      ? normalized.split(markdownRoot)[1]
      : normalized.split('/').slice(-1)[0];
    const baseName = rel.split('/').pop() || rel;
    assetMap.set(rel.toLowerCase(), String(url));
    assetMap.set(baseName.toLowerCase(), String(url));
  });

  return { docs, docMap, assetMap };
}

export function toBasePath(baseUrl: string, path: string) {
  return `${baseUrl}${path.replace(/^\/+/, '')}`;
}

function normalizeTarget(target: string) {
  return target
    .trim()
    .normalize('NFC')
    .replace(/\.md$/i, '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .toLowerCase();
}

function isImageExt(value: string) {
  return IMAGE_EXT_RE.test(value);
}

function isVideoExt(value: string) {
  return VIDEO_EXT_RE.test(value);
}

function getVideoMime(value: string) {
  const lower = value.toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.ogg')) return 'video/ogg';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return 'video/mp4';
}

function renderVideoEmbed(videoUrl: string, rawTarget: string, label: string) {
  const mime = getVideoMime(rawTarget);
  return `<video controls playsinline preload="metadata"><source src="${videoUrl}" type="${mime}" /><a href="${videoUrl}" target="_blank" rel="noopener noreferrer">${label}</a></video>`;
}

function parseEmbedSize(rawLabel: string) {
  const value = String(rawLabel || '').trim();
  if (!value) return null;
  const matched = value.match(/^(\d+)(?:x(\d+))?$/i);
  if (!matched) return null;
  const width = Number.parseInt(matched[1], 10);
  const height = matched[2] ? Number.parseInt(matched[2], 10) : undefined;
  if (!Number.isFinite(width) || width <= 0) return null;
  if (height !== undefined && (!Number.isFinite(height) || height <= 0)) return null;
  return { width, height };
}

function buildImageEmbedHtml(imageUrl: string, rawTarget: string, rawLabel: string) {
  const size = parseEmbedSize(rawLabel);
  const fallbackAlt = rawTarget.split('/').pop()?.replace(/\.[^.]+$/, '') || rawTarget;
  const alt = size ? fallbackAlt : String(rawLabel || fallbackAlt).trim();
  const widthAttr = size ? ` width="${size.width}"` : '';
  const heightAttr = size?.height ? ` height="${size.height}"` : '';
  return `<img src="${imageUrl}" alt="${alt}" loading="lazy"${widthAttr}${heightAttr} />`;
}

function resolveAssetUrl(assetMap: Map<string, string>, target: string) {
  const cleaned = target.trim().replace(/^\/+/, '').replace(/\\/g, '/');
  const byExact = assetMap.get(cleaned.toLowerCase());
  if (byExact) return byExact;
  const file = cleaned.split('/').pop() || cleaned;
  return assetMap.get(file.toLowerCase()) || '';
}

function buildHierarchyPath(rawTarget: string, resolvedId: string) {
  const cleaned = rawTarget.trim().replace(/\.md$/i, '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!cleaned) return `_home/${resolvedId}`;
  return cleaned;
}

export function convertObsidianLinks(
  markdown: string,
  docMap: Map<string, ArticleDoc>,
  assetMap: Map<string, string>,
  toArticleHref: (target: string) => string
) {
  return markdown
    .replace(/!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (full, rawTarget, rawLabel = '') => {
      const assetUrl = resolveAssetUrl(assetMap, String(rawTarget));
      if (!assetUrl) return full;
      const label = String(rawLabel || rawTarget).trim();
      if (isImageExt(String(rawTarget))) return buildImageEmbedHtml(assetUrl, String(rawTarget), String(rawLabel));
      if (isVideoExt(String(rawTarget))) return renderVideoEmbed(assetUrl, String(rawTarget), label);
      return `[${label}](${assetUrl})`;
    })
    .replace(/\[\[([^\]|#]+)(#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (full, rawTarget, rawHash = '', rawLabel = '') => {
      const key = normalizeTarget(String(rawTarget));
      const matched = docMap.get(key);
      if (!matched) return rawLabel || rawTarget;
      const label = String(rawLabel || rawTarget).trim();
      const hash = String(rawHash || '');
      const hierarchyPath = buildHierarchyPath(String(rawTarget), matched.id);
      return `[${label}](${toArticleHref(matched.id)}?path=${encodeURIComponent(hierarchyPath)}${hash})`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+\.md)(#[^)]+)?\)/g, (full, label, mdTarget, hash = '') => {
      const key = normalizeTarget(String(mdTarget));
      const matched = docMap.get(key);
      if (!matched) return full;
      const hierarchyPath = buildHierarchyPath(String(mdTarget), matched.id);
      return `[${label}](${toArticleHref(matched.id)}?path=${encodeURIComponent(hierarchyPath)}${String(hash || '')})`;
    })
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, rawTarget) => {
      const assetUrl = resolveAssetUrl(assetMap, String(rawTarget));
      if (!assetUrl) return full;
      if (isVideoExt(String(rawTarget))) {
        const label = String(alt || rawTarget).trim();
        return renderVideoEmbed(assetUrl, String(rawTarget), label);
      }
      return `![${alt}](${assetUrl})`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label, rawTarget) => {
      const assetUrl = resolveAssetUrl(assetMap, String(rawTarget));
      if (!assetUrl) return full;
      return `[${label}](${assetUrl})`;
    });
}

export async function renderMarkdown(markdown: string) {
  const rendered = await marked.parse(markdown, { breaks: true });
  return String(rendered);
}
