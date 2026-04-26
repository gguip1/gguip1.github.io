import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { posts } from '@/content/posts'

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${y}.${m}.${day}`
}

export default function BlogIndexPage() {
  useEffect(() => {
    document.title = '쓴 글 · gguip1'
  }, [])

  return (
    <main className="theme-journal min-h-screen" style={{ backgroundColor: 'var(--page-bg)', color: 'var(--page-fg)' }}>
      <div className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12 md:py-20">
        <header className="flex items-baseline justify-between font-mono text-[0.65rem] uppercase tracking-[0.35em]" style={{ color: 'var(--page-muted)' }}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 transition-colors hover:text-[color:var(--journal-accent)]"
          >
            <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
              <path d="M13 5 H2 M6 1 L2 5 L6 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            gguip1
          </Link>
          <span>journal · {posts.length}편</span>
        </header>

        <section className="flex-1 pt-24 pb-32 md:pt-36 md:pb-40">
          <div className="mb-20 md:mb-28 animate-fade-rise">
            <span
              className="font-mono text-[0.7rem] uppercase tracking-[0.4em]"
              style={{ color: 'var(--journal-accent)' }}
            >
              journal
            </span>
            <h1
              className="mt-6 font-serif text-4xl font-bold leading-[1.2] tracking-tight break-keep md:text-5xl"
              style={{ letterSpacing: '-0.025em' }}
            >
              측정 가능한 글만,
              <br />
              조용히 쌓는 곳.
            </h1>
            <p
              className="mt-8 max-w-[36ch] font-serif text-base leading-[1.85] break-keep md:text-lg"
              style={{ color: 'var(--journal-quote)' }}
            >
              직감 대신 숫자로 쓴 기록입니다. 의사결정 · 마이그레이션 · 디버깅 ─
              모두 측정과 함께 옵니다.
            </p>
          </div>

          <ol className="space-y-16 md:space-y-20">
            {posts.map((post, i) => (
              <li key={post.slug} className="animate-fade-rise" style={{ animationDelay: `${i * 80}ms` }}>
                <Link to={`/blog/${post.slug}`} className="group block">
                  <div
                    className="font-mono text-[0.65rem] uppercase tracking-[0.35em]"
                    style={{ color: 'var(--page-muted)' }}
                  >
                    CASE NO. {String(i + 1).padStart(2, '0')} ·{' '}
                    {formatDate(post.frontmatter.date)}
                    {post.frontmatter.readingMinutes && (
                      <> · {post.frontmatter.readingMinutes}분 읽기</>
                    )}
                  </div>

                  <h2
                    className="mt-4 font-serif text-3xl font-bold leading-[1.25] tracking-tight break-keep transition-colors group-hover:text-[color:var(--journal-accent)] md:text-4xl"
                    style={{ letterSpacing: '-0.025em' }}
                  >
                    {post.frontmatter.title}
                  </h2>

                  <p
                    className="mt-5 font-serif text-base leading-[1.85] break-keep md:text-[17px]"
                    style={{ color: 'var(--journal-quote)' }}
                  >
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] mr-3" style={{ color: 'var(--page-muted)' }}>
                      delta
                    </span>
                    {post.frontmatter.metric.delta}
                  </p>

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
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <footer
          className="flex items-baseline justify-between border-t pt-5 font-mono text-[0.65rem] uppercase tracking-[0.35em]"
          style={{ color: 'var(--page-muted)', borderColor: 'var(--page-rule)' }}
        >
          <span>gguip1 · journal</span>
          <Link
            to="/me"
            className="transition-colors hover:text-[color:var(--journal-accent)]"
          >
            이기용 · /me →
          </Link>
        </footer>
      </div>
    </main>
  )
}
