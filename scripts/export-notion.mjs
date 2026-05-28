import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

await loadDotEnv(path.resolve(".env"));

const apiKey = process.env.NOTION_API_KEY;
const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;
const notionVersion = process.env.NOTION_VERSION ?? "2026-03-11";
const dataDir = path.resolve("public", "data");
const itemsDir = path.join(dataDir, "items");
const assetsDir = path.resolve("public", "assets", "notion");
const outputDir = path.resolve("output", "notion-export");

const validTypes = new Set(["project", "post", "experiment", "note"]);
const datePropertyNames = ["Date", "Published At", "Published", "날짜"];
const defaultToneByType = {
  project: "blue",
  post: "ink",
  experiment: "mint",
  note: "amber",
};
const maxBlockDepth = Number.parseInt(process.env.NOTION_EXPORT_BLOCK_DEPTH ?? "4", 10);

if (!apiKey) {
  fail("NOTION_API_KEY is required.");
}

if (!dataSourceId) {
  fail("NOTION_DATA_SOURCE_ID is required.");
}

await mkdir(itemsDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

const pages = await queryPublicPages();
const warnings = [];
const items = [];
const exportedPages = [];

for (const page of pages) {
  const item = await pageToIndexItem(page, warnings);
  exportedPages.push({ page, item });
}

exportedPages.sort((a, b) => compareItemsByDateDesc(a.item, b.item));

for (const [index, exportedPage] of exportedPages.entries()) {
  const { page } = exportedPage;
  const item = {
    ...exportedPage.item,
    order: index + 1,
  };
  const body = await pageToMarkdown(page.id, item.id, warnings);

  items.push(item);

  await writeFile(
    path.join(itemsDir, `${item.id}.json`),
    `${JSON.stringify(
      {
        ...item,
        body: {
          format: "markdown",
          content: body.content,
        },
        notion: {
          pageId: page.id,
          url: page.url,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
          dateSource: item.date.source,
          exportedBlockCount: body.blockCount,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

const index = {
  source: "notion",
  generatedAt: new Date().toISOString(),
  schemaVersion: 1,
  items,
};

await writeFile(path.join(dataDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");

const report = {
  generatedAt: index.generatedAt,
  dataSourceId,
  pageCount: pages.length,
  itemCount: items.length,
  warnings,
  items: items.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    date: item.date.start,
    dateSource: item.date.source,
    cover: item.visual.cover ?? null,
  })),
};

await writeFile(
  path.join(outputDir, "latest-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

console.log(`Exported ${items.length} Notion item(s)`);
console.log(`- public/data/index.json`);
console.log(`- public/data/items/*.json`);
console.log(`- output/notion-export/latest-report.json`);

if (warnings.length > 0) {
  console.warn(`Warnings: ${warnings.length}`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

async function queryPublicPages() {
  const pages = [];
  let startCursor;

  do {
    const body = {
      page_size: 100,
      result_type: "page",
      filter: {
        property: "Status",
        select: {
          equals: "public",
        },
      },
    };

    if (startCursor) {
      body.start_cursor = startCursor;
    }

    const response = await notionRequest(`/data_sources/${dataSourceId}/query`, {
      method: "POST",
      body,
    });

    pages.push(...response.results.filter((result) => result.object === "page"));
    startCursor = response.next_cursor;
  } while (startCursor);

  return pages;
}

async function pageToIndexItem(page, warnings) {
  const title = richTextToPlain(page.properties?.Name?.title).trim();
  const type = page.properties?.Type?.select?.name;
  const status = page.properties?.Status?.select?.name;
  const summary = richTextToPlain(page.properties?.Summary?.rich_text).trim();
  const tags = page.properties?.Tags?.multi_select?.map((tag) => tag.name) ?? [];
  const coverFile = page.properties?.Cover?.files?.[0] ?? page.cover;
  const displayDate = resolveDisplayDate(page, warnings);
  const itemId = page.id;

  if (!title) {
    warnings.push(`${page.id}: Name is empty.`);
  }

  if (!validTypes.has(type)) {
    warnings.push(`${page.id}: Type is missing or invalid. Falling back to note.`);
  }

  if (status !== "public") {
    warnings.push(`${page.id}: Status is ${status ?? "empty"}, but it was included in export.`);
  }

  if (!summary) {
    warnings.push(`${page.id}: Summary is empty.`);
  }

  const nextType = validTypes.has(type) ? type : "note";
  const cover = coverFile ? await mirrorCover(coverFile, itemId, warnings) : undefined;

  return {
    id: itemId,
    slug: itemId,
    title: title || "Untitled",
    type: nextType,
    status: "public",
    summary,
    tags,
    date: displayDate,
    publishedAt: displayDate.start,
    updatedAt: page.last_edited_time,
    featured: false,
    order: 0,
    detailPath: `/data/items/${itemId}.json`,
    links: {
      notion: page.url,
    },
    visual: {
      label: nextType.toUpperCase(),
      tone: defaultToneByType[nextType],
      ...(cover ? { cover } : {}),
    },
  };
}

async function pageToMarkdown(pageId, itemId, warnings) {
  const assetCounter = { value: 0 };
  const blocks = await queryBlockChildren(pageId, warnings);
  const content = await blocksToMarkdown(blocks, itemId, warnings, 0, assetCounter);

  return {
    content: normalizeMarkdown(content),
    blockCount: countBlocks(blocks),
  };
}

async function queryBlockChildren(blockId, warnings, depth = 0) {
  const blocks = [];
  let startCursor;

  do {
    const query = new URLSearchParams({ page_size: "100" });

    if (startCursor) {
      query.set("start_cursor", startCursor);
    }

    const response = await notionRequest(`/blocks/${blockId}/children?${query.toString()}`);

    for (const block of response.results.filter((result) => result.object === "block")) {
      if (block.has_children) {
        if (depth >= maxBlockDepth) {
          warnings.push(`${block.id}: child blocks exceed max depth ${maxBlockDepth}.`);
        } else {
          block.children = await queryBlockChildren(block.id, warnings, depth + 1);
        }
      }

      blocks.push(block);
    }

    startCursor = response.next_cursor;
  } while (startCursor);

  return blocks;
}

async function blocksToMarkdown(blocks, pageId, warnings, depth, assetCounter) {
  const chunks = [];
  let previousList = false;

  for (const block of blocks) {
    const markdown = await blockToMarkdown(block, pageId, warnings, depth, assetCounter);

    if (!markdown.trim()) {
      previousList = false;
      continue;
    }

    const currentList = isListBlock(block.type);
    const separator = previousList && currentList ? "\n" : "\n\n";

    chunks.push(`${chunks.length > 0 ? separator : ""}${markdown}`);
    previousList = currentList;
  }

  return chunks.join("");
}

async function blockToMarkdown(block, pageId, warnings, depth, assetCounter) {
  const indent = "  ".repeat(depth);

  switch (block.type) {
    case "paragraph": {
      const text = richTextToMarkdown(block.paragraph.rich_text);
      const children = await childBlocksToMarkdown(block, pageId, warnings, depth, assetCounter);

      return joinBlockParts(text, children);
    }

    case "heading_1":
      return `## ${richTextToMarkdown(block.heading_1.rich_text)}`.trim();

    case "heading_2":
      return `### ${richTextToMarkdown(block.heading_2.rich_text)}`.trim();

    case "heading_3":
      return `#### ${richTextToMarkdown(block.heading_3.rich_text)}`.trim();

    case "heading_4":
      return `#### ${richTextToMarkdown(block.heading_4.rich_text)}`.trim();

    case "column_list":
    case "column":
      return childBlocksToMarkdown(block, pageId, warnings, depth, assetCounter);

    case "bulleted_list_item": {
      const text = richTextToMarkdown(block.bulleted_list_item.rich_text);
      const children = await childBlocksToMarkdown(block, pageId, warnings, depth + 1, assetCounter);

      return joinBlockParts(`${indent}- ${text}`, children);
    }

    case "numbered_list_item": {
      const text = richTextToMarkdown(block.numbered_list_item.rich_text);
      const children = await childBlocksToMarkdown(block, pageId, warnings, depth + 1, assetCounter);

      return joinBlockParts(`${indent}1. ${text}`, children);
    }

    case "to_do": {
      const checked = block.to_do.checked ? "x" : " ";
      const text = richTextToMarkdown(block.to_do.rich_text);
      const children = await childBlocksToMarkdown(block, pageId, warnings, depth + 1, assetCounter);

      return joinBlockParts(`${indent}- [${checked}] ${text}`, children);
    }

    case "toggle": {
      const text = richTextToMarkdown(block.toggle.rich_text) || "접기";
      const children = await childBlocksToMarkdown(block, pageId, warnings, depth, assetCounter);

      return joinBlockParts(`#### ${text}`, children);
    }

    case "quote": {
      const text = richTextToMarkdown(block.quote.rich_text);
      const children = await childBlocksToMarkdown(block, pageId, warnings, depth, assetCounter);
      const quotedText = text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");

      return joinBlockParts(quotedText, children);
    }

    case "callout": {
      const icon = notionIconToText(block.callout.icon);
      const text = richTextToMarkdown(block.callout.rich_text);
      const children = await childBlocksToMarkdown(block, pageId, warnings, depth, assetCounter);

      return joinBlockParts(`> ${[icon, text].filter(Boolean).join(" ")}`, children);
    }

    case "code": {
      const language = block.code.language && block.code.language !== "plain text" ? block.code.language : "";
      const text = richTextToPlain(block.code.rich_text);

      return `\`\`\`${language}\n${text}\n\`\`\``;
    }

    case "image": {
      const source = await mirrorBlockAsset(block.image, pageId, warnings, assetCounter);
      const caption = richTextToPlain(block.image.caption).trim();

      if (!source) {
        return "";
      }

      return `![${escapeMarkdownAlt(caption || "image")}](${source})`;
    }

    case "bookmark":
      return markdownLink(block.bookmark.url, richTextToPlain(block.bookmark.caption).trim() || block.bookmark.url);

    case "embed":
      return markdownLink(block.embed.url, block.embed.url);

    case "link_preview":
      return markdownLink(block.link_preview.url, block.link_preview.url);

    case "video":
    case "file":
    case "pdf":
    case "audio": {
      const media = block[block.type];
      const fileInfo = getFileInfo(media);
      const caption = richTextToPlain(media.caption).trim();

      return fileInfo?.url ? markdownLink(fileInfo.url, caption || fileInfo.name || block.type) : "";
    }

    case "divider":
      return "---";

    case "child_page":
      return `## ${block.child_page.title}`;

    case "table":
      return tableToMarkdown(block.children ?? []);

    case "table_row":
      return tableRowToMarkdown(block);

    case "unsupported":
      warnings.push(`${block.id}: unsupported Notion block.`);
      return "";

    default:
      warnings.push(`${block.id}: unsupported block type ${block.type}.`);
      return "";
  }
}

async function childBlocksToMarkdown(block, pageId, warnings, depth, assetCounter) {
  if (!Array.isArray(block.children) || block.children.length === 0) {
    return "";
  }

  return blocksToMarkdown(block.children, pageId, warnings, depth, assetCounter);
}

function tableToMarkdown(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "";
  }

  const markdownRows = rows
    .filter((row) => row.type === "table_row")
    .map((row) => tableRowToMarkdown(row));

  if (markdownRows.length === 0) {
    return "";
  }

  const columnCount = rows[0].table_row?.cells?.length ?? 1;
  const divider = `| ${Array.from({ length: columnCount }).map(() => "---").join(" | ")} |`;

  return [markdownRows[0], divider, ...markdownRows.slice(1)].join("\n");
}

function tableRowToMarkdown(row) {
  const cells = row.table_row.cells.map((cell) => escapeTableCell(richTextToMarkdown(cell)));

  return `| ${cells.join(" | ")} |`;
}

function resolveDisplayDate(page, warnings) {
  for (const propertyName of datePropertyNames) {
    const date = page.properties?.[propertyName]?.date;

    if (!date) {
      continue;
    }

    if (!date.start) {
      warnings.push(`${page.id}: ${propertyName} is empty. Falling back to created_time.`);
      break;
    }

    if (!isValidDateValue(date.start)) {
      warnings.push(`${page.id}: ${propertyName} has invalid date ${date.start}. Falling back to created_time.`);
      break;
    }

    return {
      start: date.start,
      ...(date.end ? { end: date.end } : {}),
      source: propertyName,
    };
  }

  return {
    start: page.created_time,
    source: "created_time",
  };
}

function compareItemsByDateDesc(a, b) {
  const dateDiff = dateToTimestamp(b.date.start) - dateToTimestamp(a.date.start);

  if (dateDiff !== 0) {
    return dateDiff;
  }

  return b.updatedAt.localeCompare(a.updatedAt);
}

function dateToTimestamp(value) {
  const normalizedValue = value.length === 10 ? `${value}T00:00:00` : value;
  const timestamp = Date.parse(normalizedValue);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isValidDateValue(value) {
  return dateToTimestamp(value) > 0;
}

async function mirrorCover(fileObject, pageId, warnings) {
  return mirrorAsset(fileObject, pageId, "cover", warnings, "Cover");
}

async function mirrorBlockAsset(fileObject, pageId, warnings, assetCounter) {
  assetCounter.value += 1;

  return mirrorAsset(
    fileObject,
    pageId,
    `image-${String(assetCounter.value).padStart(2, "0")}`,
    warnings,
    "Image",
  );
}

async function mirrorAsset(fileObject, pageId, fileStem, warnings, label) {
  const fileInfo = getFileInfo(fileObject);

  if (!fileInfo?.url) {
    warnings.push(`${pageId}: ${label} exists but has no downloadable URL.`);
    return undefined;
  }

  try {
    const response = await fetch(fileInfo.url);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const extension = inferExtension(fileInfo, response.headers.get("content-type"));
    const itemAssetDir = path.join(assetsDir, pageId);
    const fileName = `${fileStem}.${extension}`;

    await mkdir(itemAssetDir, { recursive: true });
    await writeFile(path.join(itemAssetDir, fileName), bytes);

    return `/assets/notion/${pageId}/${fileName}`;
  } catch (error) {
    warnings.push(`${pageId}: Failed to download ${label.toLowerCase()} (${error.message}).`);
    return undefined;
  }
}

function getFileInfo(fileObject) {
  if (!fileObject) {
    return null;
  }

  if (fileObject.type === "external") {
    return {
      name: fileObject.name,
      url: fileObject.external?.url,
      source: "external",
    };
  }

  if (fileObject.type === "file") {
    return {
      name: fileObject.name,
      url: fileObject.file?.url,
      source: "notion-file",
      expiryTime: fileObject.file?.expiry_time,
    };
  }

  return null;
}

async function notionRequest(endpoint, options = {}) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    let parsedError;

    try {
      parsedError = JSON.parse(text);
    } catch {
      parsedError = null;
    }

    if (response.status === 404 && parsedError?.code === "object_not_found") {
      throw new Error(
        [
          `Notion source is not accessible: ${dataSourceId}`,
          `Share the Archive database with the Notion integration, then run export again.`,
          `In Notion: Archive database → ... menu → Connections/Add connections → select the integration.`,
          `Original response: ${text}`,
        ].join("\n"),
      );
    }

    throw new Error(`Notion API ${response.status} ${response.statusText}: ${text}`);
  }

  return response.json();
}

function richTextToPlain(items) {
  if (!Array.isArray(items)) {
    return "";
  }

  return items.map((item) => item.plain_text ?? "").join("");
}

function richTextToMarkdown(items) {
  if (!Array.isArray(items)) {
    return "";
  }

  return items
    .map((item) => {
      let text = item.plain_text ?? "";

      if (!text) {
        return "";
      }

      if (item.annotations?.code) {
        text = `\`${text.replace(/`/g, "\\`")}\``;
      } else {
        if (item.annotations?.bold) {
          text = `**${text}**`;
        }

        if (item.annotations?.italic) {
          text = `*${text}*`;
        }

        if (item.annotations?.strikethrough) {
          text = `~~${text}~~`;
        }
      }

      const href = item.href ?? item.text?.link?.url;

      if (href) {
        return markdownLink(href, text);
      }

      return text;
    })
    .join("");
}

function normalizeMarkdown(content) {
  return content
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countBlocks(blocks) {
  return blocks.reduce((count, block) => count + 1 + countBlocks(block.children ?? []), 0);
}

function isListBlock(type) {
  return type === "bulleted_list_item" || type === "numbered_list_item" || type === "to_do";
}

function joinBlockParts(...parts) {
  return parts.filter((part) => part && part.trim()).join("\n\n");
}

function markdownLink(url, label) {
  if (!url) {
    return label ?? "";
  }

  return `[${escapeMarkdownLabel(label || url)}](${url})`;
}

function escapeMarkdownLabel(value) {
  return String(value).replace(/\]/g, "\\]");
}

function escapeMarkdownAlt(value) {
  return String(value).replace(/\]/g, "\\]");
}

function escapeTableCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function notionIconToText(icon) {
  if (!icon) {
    return "";
  }

  if (icon.type === "emoji") {
    return icon.emoji;
  }

  return "";
}

function inferExtension(fileInfo, contentType) {
  const byContentType = {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };

  if (contentType && byContentType[contentType.split(";")[0]]) {
    return byContentType[contentType.split(";")[0]];
  }

  if (fileInfo.name) {
    const extension = path.extname(fileInfo.name).replace(".", "").toLowerCase();

    if (extension) {
      return extension;
    }
  }

  try {
    const extension = path.extname(new URL(fileInfo.url).pathname).replace(".", "").toLowerCase();

    if (extension) {
      return extension;
    }
  } catch {
    // Ignore invalid URLs and use the default.
  }

  return "png";
}

async function loadDotEnv(filePath) {
  let source;

  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return;
    }

    throw error;
  }

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
