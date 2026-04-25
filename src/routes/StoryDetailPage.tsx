import { Link, useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { getPost, getAdjacent } from '@/content/posts'
import NotFoundPage from '@/routes/NotFoundPage'

export default function StoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPost(slug) : undefined

  if (!post) return <NotFoundPage />

  const { prev, next } = getAdjacent(post.slug)
  const Component = post.Component

  return (
    <main className="min-h-screen bg-paper">
      <article className="mx-auto max-w-[760px] px-6 pb-28 pt-10 md:px-10 md:pb-36 md:pt-16">
        <nav className="flex items-center justify-between border-b border-rule-soft pb-4 font-mono text-[0.65rem] uppercase tracking-[0.35em] text-ghost md:text-xs">
          <Link
            to="/me"
            className="inline-flex items-center gap-2 transition-colors hover:text-vermillion"
          >
            <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
              <path d="M13 5 H2 M6 1 L2 5 L6 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            /me
          </Link>
          <span>{post.frontmatter.kicker}</span>
        </nav>

        <header className="mt-16">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.4em] text-vermillion">
            {post.frontmatter.kicker} · {post.frontmatter.date}
          </span>
          <h1 className="mt-6 font-serif text-4xl font-black leading-tight tracking-kr break-keep md:text-5xl lg:text-6xl">
            {post.frontmatter.title}
          </h1>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-y border-rule-soft py-6">
            <div>
              <dt className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">BEFORE</dt>
              <dd className="mt-1 font-serif text-base font-bold break-keep">
                {post.frontmatter.metric.before}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">AFTER</dt>
              <dd className="mt-1 font-serif text-base font-bold break-keep">
                {post.frontmatter.metric.after}
              </dd>
            </div>
            <div className="flex-1 min-w-[14rem]">
              <dt className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">DELTA</dt>
              <dd className="mt-1 font-serif text-base font-bold text-vermillion break-keep">
                {post.frontmatter.metric.delta}
              </dd>
            </div>
            {post.frontmatter.readingMinutes && (
              <div>
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">READ</dt>
                <dd className="mt-1 font-mono text-sm">{post.frontmatter.readingMinutes}분</dd>
              </div>
            )}
          </dl>

          {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.frontmatter.tags.map((t: string) => (
                <span
                  key={t}
                  className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-ghost"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </header>

        <MDXProvider>
          <div className="prose-gallery mt-16">
            <Component />
          </div>
        </MDXProvider>

        <nav className="mt-24 grid grid-cols-1 gap-px bg-rule-soft md:grid-cols-2">
          {prev ? (
            <Link
              to={`/me/stories/${prev.slug}`}
              className="group block bg-paper p-6 transition-colors hover:bg-mist md:p-8"
            >
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">
                ← 이전 (최신)
              </span>
              <div className="mt-3 font-serif text-lg font-bold tracking-kr break-keep group-hover:text-vermillion md:text-xl">
                {prev.frontmatter.title}
              </div>
            </Link>
          ) : (
            <div className="bg-paper p-6 md:p-8">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">
                최신 글입니다
              </span>
            </div>
          )}
          {next ? (
            <Link
              to={`/me/stories/${next.slug}`}
              className="group block bg-paper p-6 text-right transition-colors hover:bg-mist md:p-8"
            >
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">
                다음 (과거) →
              </span>
              <div className="mt-3 font-serif text-lg font-bold tracking-kr break-keep group-hover:text-vermillion md:text-xl">
                {next.frontmatter.title}
              </div>
            </Link>
          ) : (
            <div className="bg-paper p-6 text-right md:p-8">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">
                가장 오래된 글입니다
              </span>
            </div>
          )}
        </nav>

        <div className="mt-12 flex justify-center">
          <Link
            to="/me"
            className="inline-flex items-center gap-3 border border-ink px-6 py-3 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
              <path d="M13 5 H2 M6 1 L2 5 L6 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            이기용 · /me 으로
          </Link>
        </div>
      </article>
    </main>
  )
}
