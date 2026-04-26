import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { getPost, getAdjacent } from '@/content/posts'
import NotFoundPage from '@/routes/NotFoundPage'

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${y}.${m}.${day}`
}

function caseNo(kicker: string) {
  return kicker.match(/\d+/)?.[0]?.padStart(2, '0') ?? ''
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPost(slug) : undefined

  useEffect(() => {
    if (post) document.title = `${post.frontmatter.title} · gguip1`
  }, [post])

  if (!post) return <NotFoundPage />

  const { prev, next } = getAdjacent(post.slug)
  const Component = post.Component

  return (
    <main
      className="theme-journal min-h-screen"
      style={{ backgroundColor: 'var(--page-bg)', color: 'var(--page-fg)' }}
    >
      <div className="mx-auto flex min-h-screen max-w-[680px] flex-col px-6 py-12 md:py-16">
        <nav
          className="flex items-baseline justify-between font-mono text-[0.65rem] uppercase tracking-[0.35em]"
          style={{ color: 'var(--page-muted)' }}
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 transition-colors hover:text-[color:var(--journal-accent)]"
          >
            <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
              <path d="M13 5 H2 M6 1 L2 5 L6 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            journal
          </Link>
          <span>{post.frontmatter.kicker}</span>
        </nav>

        <article className="pt-24 pb-32 md:pt-36 md:pb-40">
          <header className="mb-20 md:mb-24">
            <div
              className="font-mono text-[0.65rem] uppercase tracking-[0.35em]"
              style={{ color: 'var(--page-muted)' }}
            >
              CASE NO. {caseNo(post.frontmatter.kicker)} ·{' '}
              {formatDate(post.frontmatter.date)}
              {post.frontmatter.readingMinutes && (
                <> · {post.frontmatter.readingMinutes}분 읽기</>
              )}
            </div>

            <h1
              className="mt-6 font-serif text-4xl font-bold leading-[1.2] tracking-tight break-keep md:text-5xl lg:text-[3.5rem]"
              style={{ letterSpacing: '-0.03em' }}
            >
              {post.frontmatter.title}
            </h1>

            <div
              className="mt-10 grid grid-cols-1 gap-y-3 gap-x-10 border-y py-5 font-mono text-[0.7rem] uppercase tracking-[0.2em] sm:grid-cols-3"
              style={{ borderColor: 'var(--page-rule)', color: 'var(--page-muted)' }}
            >
              <div>
                <span className="block text-[0.6rem] tracking-[0.3em]" style={{ color: 'var(--page-muted)' }}>
                  before
                </span>
                <span className="mt-1 block font-serif text-base normal-case tracking-normal break-keep" style={{ color: 'var(--page-fg)' }}>
                  {post.frontmatter.metric.before}
                </span>
              </div>
              <div>
                <span className="block text-[0.6rem] tracking-[0.3em]" style={{ color: 'var(--page-muted)' }}>
                  after
                </span>
                <span className="mt-1 block font-serif text-base normal-case tracking-normal break-keep" style={{ color: 'var(--page-fg)' }}>
                  {post.frontmatter.metric.after}
                </span>
              </div>
              <div>
                <span className="block text-[0.6rem] tracking-[0.3em]" style={{ color: 'var(--page-muted)' }}>
                  delta
                </span>
                <span
                  className="mt-1 block font-serif text-base normal-case tracking-normal break-keep"
                  style={{ color: 'var(--journal-accent)' }}
                >
                  {post.frontmatter.metric.delta}
                </span>
              </div>
            </div>

            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div
                className="mt-5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.6rem] uppercase tracking-[0.25em]"
                style={{ color: 'var(--page-muted)' }}
              >
                {post.frontmatter.tags.map((t: string) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            )}
          </header>

          <MDXProvider>
            <div className="prose-journal">
              <Component />
            </div>
          </MDXProvider>

          <hr className="mx-auto my-20 w-16 border-0 border-t" style={{ borderColor: 'var(--page-rule)' }} />

          <nav className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {prev ? (
              <Link
                to={`/blog/${prev.slug}`}
                aria-label={`이전 글: ${prev.frontmatter.title}`}
                className="group block"
              >
                <span
                  className="font-mono text-[0.6rem] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--page-muted)' }}
                >
                  ← 이전
                </span>
                <div
                  className="mt-2 font-serif text-lg font-bold leading-tight tracking-tight break-keep transition-colors group-hover:text-[color:var(--journal-accent)]"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {prev.frontmatter.title}
                </div>
              </Link>
            ) : (
              <span
                className="font-mono text-[0.6rem] uppercase tracking-[0.3em]"
                style={{ color: 'var(--page-muted)' }}
              >
                — 가장 최신 글입니다
              </span>
            )}
            {next ? (
              <Link
                to={`/blog/${next.slug}`}
                aria-label={`다음 글: ${next.frontmatter.title}`}
                className="group block md:text-right"
              >
                <span
                  className="font-mono text-[0.6rem] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--page-muted)' }}
                >
                  다음 →
                </span>
                <div
                  className="mt-2 font-serif text-lg font-bold leading-tight tracking-tight break-keep transition-colors group-hover:text-[color:var(--journal-accent)]"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {next.frontmatter.title}
                </div>
              </Link>
            ) : (
              <span
                className="font-mono text-[0.6rem] uppercase tracking-[0.3em] md:text-right"
                style={{ color: 'var(--page-muted)' }}
              >
                — 가장 오래된 글입니다
              </span>
            )}
          </nav>

          <div className="mt-20 flex flex-wrap justify-center gap-8 font-mono text-[0.7rem] uppercase tracking-[0.3em]">
            <Link
              to="/blog"
              className="transition-colors hover:text-[color:var(--journal-accent)]"
              style={{ color: 'var(--page-fg)' }}
            >
              ← 글 목록으로
            </Link>
            <Link
              to="/me"
              className="transition-colors hover:text-[color:var(--journal-accent)]"
              style={{ color: 'var(--page-muted)' }}
            >
              이기용 · /me
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}
