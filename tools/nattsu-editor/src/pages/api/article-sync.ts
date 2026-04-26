import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const prerender = false;

const execFileAsync = promisify(execFile);

function exists(filePath: string) {
  return fs.access(filePath).then(() => true).catch(() => false);
}

async function resolveRepoRoot() {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '..', '..')
  ];
  for (const candidate of candidates) {
    const syncPath = path.join(candidate, 'sync-obsidian.sh');
    const markdownDir = path.join(candidate, 'src', 'data', 'article', 'markdown');
    if (await exists(syncPath) && await exists(markdownDir)) return candidate;
  }
  throw new Error('repo root not found');
}

async function collectMarkdownStatus(repoRoot: string) {
  const markdownDir = path.join(repoRoot, 'src', 'data', 'article', 'markdown');
  const entries = await fs.readdir(markdownDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'));
  const details = await Promise.all(files.map(async (file) => {
    const fullPath = path.join(markdownDir, file.name);
    const stat = await fs.stat(fullPath);
    return {
      name: file.name,
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString()
    };
  }));
  details.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const totalBytes = details.reduce((sum, item) => sum + item.sizeBytes, 0);
  return {
    directory: markdownDir,
    fileCount: details.length,
    totalBytes,
    latestUpdatedAt: details[0]?.updatedAt ?? null,
    files: details.slice(0, 50)
  };
}

export const GET: APIRoute = async () => {
  try {
    const repoRoot = await resolveRepoRoot();
    const status = await collectMarkdownStatus(repoRoot);
    return new Response(JSON.stringify({ ok: true, repoRoot, status }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), { status: 500 });
  }
};

export const POST: APIRoute = async () => {
  try {
    const repoRoot = await resolveRepoRoot();
    const scriptPath = path.join(repoRoot, 'sync-obsidian.sh');
    const result = await execFileAsync('bash', [scriptPath], { cwd: repoRoot });
    const status = await collectMarkdownStatus(repoRoot);
    return new Response(JSON.stringify({
      ok: true,
      message: 'sync completed',
      stdout: result.stdout,
      stderr: result.stderr,
      repoRoot,
      status
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), { status: 500 });
  }
};
