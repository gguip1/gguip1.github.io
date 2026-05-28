# gguip archive

Personal archive mockup for GitHub Pages.

## Development

```bash
npm install
npm run export:notion
npm run dev
```

The first page reads generated content from `public/data/index.json`.

## Notion inspection

Before building the exporter, inspect the actual Notion response shape:

```bash
cp .env.example .env
# Fill NOTION_API_KEY and NOTION_DATA_SOURCE_ID.
npm run inspect:notion
```

The script writes ignored files under `output/notion-inspect/`:

- `summary-*.md`: property names, property types, block type counts, media count
- `inspect-*.json`: sampled page properties and block children

Use this output to decide the final `index.json` fields and the Markdown export rules.

## Notion export preview

Generate `public/data/index.json` from the Notion Archive database:

```bash
npm run export:notion
npm run dev
```

The Archive database must be shared with the Notion integration used by `NOTION_API_KEY`.

Recommended Archive properties:

- `Name` title
- `Type` select: `project`, `post`, `experiment`, `note`
- `Status` select: only `public` is exported
- `Summary` rich text
- `Tags` multi-select
- `Cover` files
- `Date` date: controls the card date and sort order. `날짜`, `Published At`, and `Published` are also accepted. If empty, the exporter falls back to the Notion page creation time.

The exporter writes the card index to `public/data/index.json` and reads each public page's blocks into Markdown at `public/data/items/{pageId}.json`.
Images in page body blocks are mirrored to `public/assets/notion/{pageId}/image-*.ext`.
Nested block traversal is controlled by `NOTION_EXPORT_BLOCK_DEPTH` and defaults to `4`.

## GitHub Pages deploy

Repository settings:

- Pages source: `GitHub Actions`

Required repository secrets:

- `NOTION_API_KEY`
- `NOTION_DATA_SOURCE_ID`

Optional repository variables:

- `NOTION_VERSION` defaults to `2026-03-11`
- `NOTION_EXPORT_BLOCK_DEPTH` defaults to `4`

The workflow runs on `main` pushes, manual dispatch, and daily at `03:00` KST.
