import { ArrowLeft, ArrowUpRight, CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type WorkType = "project" | "post" | "experiment" | "note";
type WorkStatus = "draft" | "public" | "archived";
type TabKey = "all" | WorkType;

type WorkItem = {
  id: string;
  slug: string;
  title: string;
  type: WorkType;
  status: WorkStatus;
  summary: string;
  tags: string[];
  date?: {
    start: string;
    end?: string;
    source?: string;
  };
  publishedAt?: string;
  updatedAt: string;
  featured: boolean;
  order: number;
  detailPath: string;
  links?: {
    demo?: string;
    repo?: string;
    notion?: string;
  };
  visual: {
    label: string;
    tone: "ink" | "mint" | "amber" | "blue" | "coral" | "violet";
    cover?: string;
  };
};

type ContentIndex = {
  source: "mock" | "notion";
  generatedAt: string;
  items: WorkItem[];
};

type WorkDetail = WorkItem & {
  body?: {
    format: "markdown";
    content: string;
  };
  notion?: {
    pageId: string;
    url: string;
    createdTime: string;
    lastEditedTime: string;
    dateSource?: string;
  };
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "전체" },
  { key: "project", label: "프로젝트" },
  { key: "post", label: "글" },
  { key: "experiment", label: "실험" },
  { key: "note", label: "노트" },
];

const typeLabel: Record<WorkType, string> = {
  project: "프로젝트",
  post: "글",
  experiment: "실험",
  note: "노트",
};

const statusLabel: Record<WorkStatus, string> = {
  draft: "정리 중",
  public: "공개",
  archived: "보관",
};

function getSelectedSlug() {
  const match = window.location.hash.match(/^#\/items\/([^/?#]+)/);

  return match ? decodeURIComponent(match[1]) : null;
}

function resolvePublicPath(value?: string) {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//.test(value)) {
    return value;
  }

  return `${import.meta.env.BASE_URL}${value.replace(/^\/+/, "")}`;
}

function formatDate(value: string) {
  const normalizedValue = value.length === 10 ? `${value}T00:00:00` : value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(normalizedValue));
}

function formatItemDate(item: WorkItem) {
  const start = item.date?.start ?? item.publishedAt ?? item.updatedAt;
  const end = item.date?.end;

  if (!end || end === start) {
    return formatDate(start);
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [content, setContent] = useState<ContentIndex | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => getSelectedSlug());
  const [detail, setDetail] = useState<WorkDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function syncRoute() {
      setSelectedSlug(getSelectedSlug());
    }

    window.addEventListener("hashchange", syncRoute);

    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadContent() {
      try {
        const contentResponse = await fetch(`${import.meta.env.BASE_URL}data/index.json`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!contentResponse.ok) {
          throw new Error(`Failed to load content: ${contentResponse.status}`);
        }

        const nextContent: ContentIndex = await contentResponse.json();

        setContent(nextContent);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setError("콘텐츠를 불러오지 못했습니다.");
      }
    }

    loadContent();

    return () => controller.abort();
  }, []);

  const selectedItem = useMemo(() => {
    if (!content || !selectedSlug) {
      return null;
    }

    return content.items.find((item) => item.slug === selectedSlug || item.id === selectedSlug) ?? null;
  }, [content, selectedSlug]);

  useEffect(() => {
    if (!selectedItem) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    const itemToLoad = selectedItem;
    const controller = new AbortController();

    async function loadDetail() {
      try {
        setDetail(null);
        setDetailError(null);

        const detailResponse = await fetch(resolvePublicPath(itemToLoad.detailPath), {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!detailResponse.ok) {
          throw new Error(`Failed to load detail: ${detailResponse.status}`);
        }

        const nextDetail: WorkDetail = await detailResponse.json();

        setDetail(nextDetail);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setDetailError("상세 내용을 불러오지 못했습니다.");
      }
    }

    loadDetail();

    return () => controller.abort();
  }, [selectedItem]);

  const items = useMemo(() => {
    const source = content?.items ?? [];

    return source
      .filter((item) => activeTab === "all" || item.type === activeTab)
      .sort((a, b) => a.order - b.order);
  }, [activeTab, content]);

  if (selectedSlug) {
    return (
      <DetailPage
        detail={detail}
        detailError={detailError}
        fallbackItem={selectedItem}
        isContentLoading={!content && !error}
      />
    );
  }

  return (
    <>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              안녕하세요,
              <br />
              궁금한 것을 만들며
              <br />
              배우는 개발자
              <br />
              <span>이기용</span>입니다.
            </h1>
          </div>
        </section>

        <section className="archive-section" id="archive" aria-label="작업 목록">
          <div className="site-shell">
            <div className="toolbar" aria-label="콘텐츠 필터">
              <div className="tabs" role="tablist" aria-label="콘텐츠 타입">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    className="tab"
                    data-active={activeTab === tab.key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="content-region" aria-live="polite">
              {error ? <p className="state-message">{error}</p> : null}

              {!content && !error ? (
                <div className="grid" aria-label="로딩 중">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div className="skeleton-card" key={index} />
                  ))}
                </div>
              ) : null}

              {content ? (
                <div className="grid">
                  {items.map((item) => (
                    <article className="work-card" key={item.id}>
                      <a href={`#/items/${encodeURIComponent(item.slug)}`} aria-label={`${item.title} 열기`}>
                        <div
                          className="thumb"
                          data-has-cover={Boolean(item.visual.cover)}
                          data-tone={item.visual.tone}
                        >
                          {item.visual.cover ? (
                            <img alt="" loading="lazy" src={resolvePublicPath(item.visual.cover)} />
                          ) : null}
                          <span>{item.visual.label}</span>
                        </div>
                        <div className="card-body">
                          <div className="card-topline">
                            <span className="status" data-status={item.status}>
                              <span aria-hidden="true" />
                              {statusLabel[item.status]}
                            </span>
                            <span>{typeLabel[item.type]}</span>
                          </div>
                          <h3>{item.title}</h3>
                          <p>{item.summary}</p>
                          <div className="tag-row" aria-label="태그">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                          <div className="card-footer">
                            <span>
                              <CalendarDays size={14} aria-hidden="true" />
                              {formatItemDate(item)}
                            </span>
                            <ArrowUpRight size={16} aria-hidden="true" />
                          </div>
                        </div>
                      </a>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;

function DetailPage({
  detail,
  detailError,
  fallbackItem,
  isContentLoading,
}: {
  detail: WorkDetail | null;
  detailError: string | null;
  fallbackItem: WorkItem | null;
  isContentLoading: boolean;
}) {
  const item = detail ?? fallbackItem;
  const body = detail?.body?.content?.trim() ?? "";

  return (
    <main className="detail-page">
      <nav className="detail-nav" aria-label="상세 페이지 이동">
        <div className="site-shell">
          <a className="back-link" href="#archive">
            <ArrowLeft size={17} aria-hidden="true" />
            목록
          </a>
        </div>
      </nav>

      {isContentLoading ? (
        <div className="site-shell">
          <div className="detail-loading" />
        </div>
      ) : null}

      {!item && !isContentLoading ? (
        <div className="site-shell">
          <p className="state-message">항목을 찾지 못했습니다.</p>
        </div>
      ) : null}

      {item ? (
        <>
          <header className="detail-hero">
            {item.visual.cover ? (
              <img className="detail-hero-bg" alt="" src={resolvePublicPath(item.visual.cover)} />
            ) : null}
            <div className="site-shell detail-hero-inner">
              <div className="detail-meta">
                <span>{typeLabel[item.type]}</span>
                <span>
                  <CalendarDays size={15} aria-hidden="true" />
                  {formatItemDate(item)}
                </span>
              </div>
              <h1>{item.title}</h1>
              <p>{item.summary}</p>
              <div className="detail-tags" aria-label="태그">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </header>

          <div className="site-shell detail-layout">
            <aside className="detail-aside" aria-label="문서 정보">
              <dl>
                <div>
                  <dt>상태</dt>
                  <dd>{statusLabel[item.status]}</dd>
                </div>
                <div>
                  <dt>분류</dt>
                  <dd>{typeLabel[item.type]}</dd>
                </div>
                <div>
                  <dt>날짜</dt>
                  <dd>{formatItemDate(item)}</dd>
                </div>
              </dl>
            </aside>

            <article className="article-body" aria-label="본문">
              {detailError ? <p className="state-message">{detailError}</p> : null}
              {body ? renderMarkdown(body) : null}
              {detail && !body && !detailError ? (
                <p className="state-message">아직 본문이 없습니다.</p>
              ) : null}
            </article>
          </div>
        </>
      ) : null}
    </main>
  );
}

function renderMarkdown(content: string) {
  const lines = content.split(/\r?\n/);
  const elements: JSX.Element[] = [];
  let paragraph: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];
  let code: string[] | null = null;
  let codeLanguage = "";

  function key() {
    return `block-${elements.length}`;
  }

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }

    elements.push(<p key={key()}>{renderInline(paragraph.join(" "))}</p>);
    paragraph = [];
  }

  function flushList() {
    if (!list || list.items.length === 0) {
      return;
    }

    const ListTag = list.type;

    elements.push(
      <ListTag key={key()}>
        {list.items.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ListTag>,
    );
    list = null;
  }

  function flushQuote() {
    if (quote.length === 0) {
      return;
    }

    elements.push(<blockquote key={key()}>{renderInline(quote.join(" "))}</blockquote>);
    quote = [];
  }

  function flushTextBlocks() {
    flushParagraph();
    flushList();
    flushQuote();
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (code) {
        elements.push(
          <pre key={key()}>
            <code data-language={codeLanguage}>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
        codeLanguage = "";
        continue;
      }

      flushTextBlocks();
      code = [];
      codeLanguage = trimmed.replace("```", "").trim();
      continue;
    }

    if (code) {
      code.push(line);
      continue;
    }

    if (!trimmed) {
      flushTextBlocks();
      continue;
    }

    const heading = trimmed.match(/^(#{2,4})\s+(.+)$/);

    if (heading) {
      flushTextBlocks();
      const level = heading[1].length;
      const text = heading[2];

      if (level === 2) {
        elements.push(<h2 key={key()}>{renderInline(text)}</h2>);
      } else if (level === 3) {
        elements.push(<h3 key={key()}>{renderInline(text)}</h3>);
      } else {
        elements.push(<h4 key={key()}>{renderInline(text)}</h4>);
      }
      continue;
    }

    const image = trimmed.match(/^!\[(.*)]\((.+)\)$/);

    if (image) {
      flushTextBlocks();
      const caption = image[1];
      const source = image[2];

      elements.push(
        <figure className="article-image" key={key()}>
          <img alt={caption} loading="lazy" src={resolvePublicPath(source)} />
          {caption && caption !== "image" ? <figcaption>{caption}</figcaption> : null}
        </figure>,
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      flushQuote();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(trimmed.slice(2));
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);

    if (ordered) {
      flushParagraph();
      flushQuote();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      quote.push(trimmed.slice(2));
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }

  if (code) {
    elements.push(
      <pre key={key()}>
        <code data-language={codeLanguage}>{code.join("\n")}</code>
      </pre>,
    );
  }

  flushTextBlocks();

  return elements;
}

function renderInline(text: string) {
  const nodes: ReactNode[] = [];
  const pattern = /(\[[^\]]+]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("[") && token.includes("](")) {
      const link = token.match(/^\[([^\]]+)]\(([^)]+)\)$/);

      if (link) {
        const href = link[2];
        const external = /^https?:\/\//.test(href);

        nodes.push(
          <a href={resolvePublicPath(href)} key={`${token}-${match.index}`} rel={external ? "noreferrer" : undefined} target={external ? "_blank" : undefined}>
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith("`")) {
      nodes.push(<code key={`${token}-${match.index}`}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={`${token}-${match.index}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("~~")) {
      nodes.push(<del key={`${token}-${match.index}`}>{token.slice(2, -2)}</del>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={`${token}-${match.index}`}>{token.slice(1, -1)}</em>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
