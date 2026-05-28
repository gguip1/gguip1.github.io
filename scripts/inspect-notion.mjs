import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

await loadDotEnv(path.resolve(".env"));

const apiKey = process.env.NOTION_API_KEY;
const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;
const databaseId = process.env.NOTION_DATABASE_ID;
const sourceKind = dataSourceId ? "data_source" : "database";
const sourceId = dataSourceId ?? databaseId;
const notionVersion =
  process.env.NOTION_VERSION ?? (sourceKind === "data_source" ? "2026-03-11" : "2022-06-28");
const pageSize = toNumber(process.env.NOTION_INSPECT_PAGE_SIZE, 5);
const blockDepth = toNumber(process.env.NOTION_INSPECT_BLOCK_DEPTH, 2);
const outputDir = path.resolve("output", "notion-inspect");

if (!apiKey) {
  fail("NOTION_API_KEY is required.");
}

if (!sourceId) {
  fail("NOTION_DATA_SOURCE_ID is required. Use NOTION_DATABASE_ID only for the legacy database API.");
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

const queryResult = await querySource();
const pages = queryResult.results.filter((result) => result.object === "page");
const samplePages = [];

for (const page of pages.slice(0, Math.min(2, pages.length))) {
  const blocks = await listBlockChildren(page.id, 0);
  samplePages.push({
    page: summarizePage(page),
    blockSummary: summarizeBlocks(blocks),
    blocks: blocks.map(summarizeBlock),
  });
}

const report = {
  inspectedAt: new Date().toISOString(),
  sourceKind,
  sourceId,
  notionVersion,
  pageSize,
  blockDepth,
  query: {
    hasMore: queryResult.has_more,
    nextCursor: queryResult.next_cursor,
    resultCount: queryResult.results.length,
    pageCount: pages.length,
  },
  pages: pages.map(summarizePage),
  samplePages,
};

await mkdir(outputDir, { recursive: true });

const jsonPath = path.join(outputDir, `inspect-${timestamp}.json`);
const markdownPath = path.join(outputDir, `summary-${timestamp}.md`);

await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(markdownPath, toMarkdown(report), "utf8");

console.log(`Notion inspect complete`);
console.log(`- JSON: ${jsonPath}`);
console.log(`- Summary: ${markdownPath}`);
console.log(`- Pages sampled: ${pages.length}`);

async function querySource() {
  const endpoint =
    sourceKind === "data_source"
      ? `/data_sources/${sourceId}/query`
      : `/databases/${sourceId}/query`;

  return notionRequest(endpoint, {
    method: "POST",
    body: {
      page_size: pageSize,
      ...(sourceKind === "data_source" ? { result_type: "page" } : {}),
    },
  });
}

async function listBlockChildren(blockId, depth) {
  const blocks = [];
  let startCursor;

  do {
    const query = new URLSearchParams({ page_size: "100" });
    if (startCursor) {
      query.set("start_cursor", startCursor);
    }

    const response = await notionRequest(`/blocks/${blockId}/children?${query.toString()}`);

    for (const block of response.results) {
      const nextBlock = { ...block };

      if (block.has_children && depth < blockDepth) {
        nextBlock.children = await listBlockChildren(block.id, depth + 1);
      }

      blocks.push(nextBlock);
    }

    startCursor = response.next_cursor;
  } while (startCursor);

  return blocks;
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
    throw new Error(`Notion API ${response.status} ${response.statusText}: ${text}`);
  }

  return response.json();
}

function summarizePage(page) {
  return {
    id: page.id,
    url: page.url,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    archived: page.archived,
    inTrash: page.in_trash,
    cover: summarizeFile(page.cover),
    icon: summarizeFile(page.icon),
    properties: Object.fromEntries(
      Object.entries(page.properties ?? {}).map(([name, value]) => [name, summarizeProperty(value)]),
    ),
  };
}

function summarizeProperty(value) {
  const type = value.type;
  const typedValue = value[type];

  if (type === "title" || type === "rich_text") {
    return {
      type,
      text: richTextToPlain(typedValue),
      rawCount: typedValue?.length ?? 0,
    };
  }

  if (type === "select" || type === "status") {
    return {
      type,
      name: typedValue?.name ?? null,
      color: typedValue?.color ?? null,
    };
  }

  if (type === "multi_select") {
    return {
      type,
      names: typedValue?.map((item) => item.name) ?? [],
    };
  }

  if (type === "files") {
    return {
      type,
      files: typedValue?.map(summarizeFile) ?? [],
    };
  }

  if (type === "date") {
    return {
      type,
      start: typedValue?.start ?? null,
      end: typedValue?.end ?? null,
    };
  }

  if (type === "formula") {
    return {
      type,
      formulaType: typedValue?.type ?? null,
      value: typedValue ? typedValue[typedValue.type] : null,
    };
  }

  if (type === "relation") {
    return {
      type,
      count: typedValue?.length ?? 0,
      ids: typedValue?.slice(0, 5).map((item) => item.id) ?? [],
    };
  }

  return {
    type,
    value: typedValue ?? null,
  };
}

function summarizeBlocks(blocks) {
  const flatBlocks = flattenBlocks(blocks);
  const typeCounts = {};
  const unsupported = [];
  const media = [];

  for (const block of flatBlocks) {
    typeCounts[block.type] = (typeCounts[block.type] ?? 0) + 1;

    if (block.type === "unsupported") {
      unsupported.push({ id: block.id });
    }

    if (["image", "file", "video", "pdf", "audio"].includes(block.type)) {
      media.push({
        id: block.id,
        type: block.type,
        file: summarizeFile(block[block.type]),
      });
    }
  }

  return {
    total: flatBlocks.length,
    typeCounts,
    unsupported,
    media,
  };
}

function summarizeBlock(block) {
  const payload = block[block.type] ?? {};

  return {
    id: block.id,
    type: block.type,
    hasChildren: block.has_children,
    createdTime: block.created_time,
    lastEditedTime: block.last_edited_time,
    text: richTextToPlain(payload.rich_text),
    caption: richTextToPlain(payload.caption),
    file: summarizeFile(payload),
    children: block.children?.map(summarizeBlock) ?? undefined,
  };
}

function flattenBlocks(blocks) {
  return blocks.flatMap((block) => [block, ...flattenBlocks(block.children ?? [])]);
}

function summarizeFile(fileObject) {
  if (!fileObject) {
    return null;
  }

  if (fileObject.type === "external") {
    return {
      type: "external",
      url: fileObject.external?.url ?? null,
    };
  }

  if (fileObject.type === "file") {
    return {
      type: "file",
      url: fileObject.file?.url ?? null,
      expiryTime: fileObject.file?.expiry_time ?? null,
    };
  }

  if (fileObject.type === "emoji") {
    return {
      type: "emoji",
      emoji: fileObject.emoji,
    };
  }

  return {
    type: fileObject.type ?? null,
  };
}

function richTextToPlain(items) {
  if (!Array.isArray(items)) {
    return "";
  }

  return items.map((item) => item.plain_text ?? "").join("");
}

function toMarkdown(report) {
  const lines = [
    "# Notion Inspect Summary",
    "",
    `- inspectedAt: ${report.inspectedAt}`,
    `- sourceKind: ${report.sourceKind}`,
    `- notionVersion: ${report.notionVersion}`,
    `- resultCount: ${report.query.resultCount}`,
    `- pageCount: ${report.query.pageCount}`,
    "",
    "## Page Properties",
    "",
  ];

  for (const page of report.pages) {
    const titleEntry = Object.entries(page.properties).find(([, value]) => value.type === "title");
    lines.push(`### ${titleEntry?.[1].text || page.id}`);
    lines.push("");
    lines.push(`- id: ${page.id}`);
    lines.push(`- lastEditedTime: ${page.lastEditedTime}`);
    lines.push("- properties:");

    for (const [name, value] of Object.entries(page.properties)) {
      lines.push(`  - ${name}: ${value.type}${formatPropertyPreview(value)}`);
    }

    lines.push("");
  }

  lines.push("## Sample Blocks");
  lines.push("");

  for (const sample of report.samplePages) {
    const titleEntry = Object.entries(sample.page.properties).find(([, value]) => value.type === "title");
    lines.push(`### ${titleEntry?.[1].text || sample.page.id}`);
    lines.push("");
    lines.push(`- total blocks: ${sample.blockSummary.total}`);
    lines.push(`- type counts: ${JSON.stringify(sample.blockSummary.typeCounts)}`);
    lines.push(`- media count: ${sample.blockSummary.media.length}`);
    lines.push(`- unsupported count: ${sample.blockSummary.unsupported.length}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function formatPropertyPreview(value) {
  if ("text" in value && value.text) {
    return ` = ${JSON.stringify(value.text)}`;
  }

  if ("name" in value && value.name) {
    return ` = ${JSON.stringify(value.name)}`;
  }

  if ("names" in value && value.names.length > 0) {
    return ` = ${JSON.stringify(value.names)}`;
  }

  return "";
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
