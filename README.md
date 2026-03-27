# nattsu - Project Overview

Browser-based media gallery and editor. Browse items in multiple views, open markdown articles, and manage `items.json` + assets with the Writer app.

## Screenshot



## Technologies

- HTML + CSS
- Vanilla JavaScript (ES modules)
- Node.js + Express (Writer local server)
- JSON (`pages/opus/data/items.json` for project state)
- GitHub Actions + GitHub Pages (deploy)

## Overview

| Item | Description |
| --- | --- |
| Entry | `index.html` (redirect) -> `pages/opus/index.html` -> `pages/opus/js/main.js` |
| UI | Two-row header on Opus page (Mode + Opus subview), dedicated About Me / NT pages, article page, Writer (database table + detail panel) |
| Data | `pages/opus/data/items.json` (id/title/type/date/tags/url/assets) |

## Layout

- Header Row 1: global mode switch (`Opus`, `About Me`, `NT`)
- Header Row 2: `Opus` subview switch (`Grid`, `Table`, `Simple`) + view controls
- Pages:
  - `pages/opus/`: gallery rendering system
  - `pages/aboutme/`: profile and social links
  - `pages/nt/`: project area
- Writer: Left = database table (inline edit, add/delete/reorder), Right = detail settings panel.
- Article page: Loads markdown from `pages/opus/assets/*.md` and renders in browser.

## Navigation State

- Opus query-based routing:
  - `pages/opus/?view=grid`
  - `pages/opus/?view=table`
  - `pages/opus/?view=simple`
- Top-level page routing:
  - `pages/aboutme/`
  - `pages/nt/`
- Legacy compatibility:
  - root `/?mode=about` and `/?mode=nt` are redirected by `index.html`.

## Item kinds

- `write` - Markdown-based article (`assets.md`)
- `picture` - Single image item (`assets.image`)
- `movie` - Video item (YouTube URL or local file)

## Thumbnails

- Priority 1: `assets.image`
- Priority 2: auto from `url` (YouTube / SoundCloud / direct URL)
- Fallback: placeholder image
- YouTube uses fallback from `maxresdefault` to `hqdefault` when needed

## Save / Load

- Save (Writer): creates/updates item data under `pages/opus/data/items.json` and related files under `pages/opus/assets/`
- Load (Gallery): reads `pages/opus/data/items.json` and renders selected view
- Reorder (Writer): persists order with `PUT /api/items`

## Main files

| File | Role |
| --- | --- |
| `index.html` | Root entry (redirect to `pages/opus/`) |
| `pages/opus/index.html` | Opus page HTML |
| `pages/opus/js/main.js` | Opus page JS entry (imports app bootstrap) |
| `pages/opus/css/main.css` | Opus page CSS entry |
| `pages/opus/js/app/main.js` | Opus bootstrap (`view` query sync + page navigation) |
| `pages/opus/js/opus/opus-mode.js` | Opus view renderer (`grid/table/simple`) |
| `pages/opus/js/features/settings/opus-settings.js` | Opus settings handlers (shape/size/table controls) |
| `pages/opus/js/views/grid-view.js` | Grid view rendering |
| `pages/opus/js/views/table-view.js` | Table view rendering |
| `pages/opus/js/views/simple-view.js` | Simple view rendering |
| `pages/opus/js/utils.js` | Shared helpers (thumbnail/id extraction, actions) |
| `pages/aboutme/index.html` | About Me page (independent mode page) |
| `pages/nt/index.html` | NT page (independent mode page) |
| `pages/opus/article/index.html` | Article page HTML（Opus 内） |
| `pages/opus/article/js/article.js` | Article page JS |
| `pages/opus/article/css/article.css` | Article page CSS |
| `apps/writer/index.html` | Writer UI entry |
| `apps/writer/writer.js` | Writer client logic |
| `apps/writer/server.js` | Writer API server (`GET/POST/PUT/DELETE`) |
| `pages/opus/data/items.json` | Item database |
| `pages/opus/assets/` | Markdown/images/videos |

## Dev Run

```bash
./start-gallery.sh
# http://127.0.0.1:8000/
```

```bash
./start-writer.sh
# Gallery: http://127.0.0.1:3333/
# Writer : http://127.0.0.1:3333/writer/
```

## Docs (reference only)

- `schema.md` - Item schema
- `docs/writer-design.md` - Writer design notes

## Planned Phase 2

- File system re-organization (example: feature-based split such as `features/opus`, `features/about`, `features/nt`)