import { ArrowLeft, ArrowUpRight, CalendarDays, Github, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type WorkType = "project" | "post" | "experiment" | "note";
type WorkStatus = "draft" | "public" | "archived";
type TabKey = "all" | "project";

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

const siteUrl = "https://gguip1.github.io/";
const siteTitle = "gguip1.archive | 이기용 개발 아카이브";
const siteDescription = "궁금한 것을 만들며 배우는 개발자 이기용의 프로젝트와 글을 모아 둔 개인 아카이브입니다.";

function setMetaAttribute(attributeName: "name" | "property", attributeValue: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attributeName}="${attributeValue}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonicalUrl(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

function updatePageSeo({
  title,
  description,
  url = siteUrl,
  type = "website",
}: {
  title: string;
  description: string;
  url?: string;
  type?: "website" | "article";
}) {
  document.title = title;
  setCanonicalUrl(siteUrl);
  setMetaAttribute("name", "description", description);
  setMetaAttribute("property", "og:type", type);
  setMetaAttribute("property", "og:url", url);
  setMetaAttribute("property", "og:title", title);
  setMetaAttribute("property", "og:description", description);
  setMetaAttribute("name", "twitter:title", title);
  setMetaAttribute("name", "twitter:description", description);
}

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

  useEffect(() => {
    const metaItem = detail ?? selectedItem;

    if (!selectedSlug || !metaItem) {
      updatePageSeo({
        title: siteTitle,
        description: siteDescription,
      });
      return;
    }

    updatePageSeo({
      title: `${metaItem.title} | gguip1.archive`,
      description: metaItem.summary || siteDescription,
      url: `${siteUrl}#/items/${encodeURIComponent(metaItem.slug)}`,
      type: "article",
    });
  }, [detail, selectedItem, selectedSlug]);

  const items = useMemo(() => {
    const source = content?.items ?? [];

    return source
      .filter((item) => activeTab === "all" || item.type === activeTab)
      .sort((a, b) => a.order - b.order);
  }, [activeTab, content]);

  const isContentLoading = !content && !error;

  if (selectedSlug) {
    return (
      <DetailPage
        detail={detail}
        detailError={detailError}
        fallbackItem={selectedItem}
        isContentLoading={isContentLoading}
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

              {content && items.length === 0 ? (
                <p className="empty-message">아직 공개된 항목이 없습니다.</p>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
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
    <>
      <main className="detail-page">
        <nav className="detail-nav" aria-label="상세 페이지 이동">
          <div className="site-shell">
            <a className="back-link" href="#archive">
              <ArrowLeft size={17} aria-hidden="true" />
              목록
            </a>
          </div>
        </nav>

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
              <article className="article-body" aria-label="본문">
                {detailError ? <p className="state-message">{detailError}</p> : null}
                {body ? <MarkdownBody content={body} /> : null}
                {detail && !body && !detailError ? (
                  <p className="state-message">아직 본문이 없습니다.</p>
                ) : null}
              </article>
            </div>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <div className="footer-brand">
          <strong>gguip1.archive</strong>
          <p>궁금한 것을 만들며 배우는 개발자 이기용</p>
        </div>
        <nav className="footer-links" aria-label="Footer links">
          <a href="mailto:gguip.dev@gmail.com">
            <Mail size={15} aria-hidden="true" />
            Email
          </a>
          <a href="https://github.com/gguip1" rel="noopener noreferrer" target="_blank">
            <Github size={15} aria-hidden="true" />
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

const markdownComponents: Components = {
  a({ children, href }) {
    const external = Boolean(href && /^https?:\/\//.test(href));

    return (
      <a href={href ? resolvePublicPath(href) : undefined} rel={external ? "noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>
        {children}
      </a>
    );
  },
  img({ alt, src }) {
    return <img alt={alt ?? ""} loading="lazy" src={src ? resolvePublicPath(src) : undefined} />;
  },
  table({ children }) {
    return (
      <div className="article-table">
        <table>{children}</table>
      </div>
    );
  },
};

function MarkdownBody({ content }: { content: string }) {
  return (
    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
