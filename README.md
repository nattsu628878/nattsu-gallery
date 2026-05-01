# nattsu-gallery

Live site: https://nattsu628878.github.io/nattsu-gallery

## Overview

This project manages all content in Git under:

- `src/data/article/`
- `src/data/opus/`
- `src/data/timeline/`

Static UI assets stay in `public/`.

For detailed content schemas, see `docs/CONTENT-FORMAT.md`.

## Local Development

```bash
./dev.sh
```

`npm run dev` runs media normalization via `predev`.

## Content Update Flow

1. Edit files in `src/data/article/`, `src/data/opus/`, or `src/data/timeline/`.
2. Run checks:

```bash
npm run dev
npm run build
```

3. Commit and push:

```bash
git add .
git commit -m "update content"
git push
```

## Media Normalization (optional)

```bash
bash scripts/normalize-article-assets.sh
bash scripts/normalize-opus-assets.sh
bash scripts/normalize-timeline-assets.sh
```

## Deploy

- Push to `main` (or run `workflow_dispatch`).
- GitHub Actions normalizes media, builds, and deploys to GitHub Pages.