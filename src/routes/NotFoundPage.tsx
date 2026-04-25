import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="theme-white min-h-screen bg-white text-ink">
      <div className="mx-auto flex min-h-screen max-w-[960px] flex-col px-6 py-10 md:px-10 md:py-16">
        <header className="flex items-center justify-between border-b border-[color:var(--page-rule)] pb-4 font-mono text-[0.65rem] uppercase tracking-[0.35em] text-[color:var(--page-muted)] md:text-xs">
          <span className="text-vermillion">error · 404 · not found</span>
          <span>gguip1</span>
        </header>

        <section className="flex flex-1 flex-col justify-center">
          <span className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-vermillion">
            file missing
          </span>
          <h1 className="font-sans text-[clamp(6rem,18vw,14rem)] font-light leading-[0.9] tracking-tight">
            404
          </h1>
          <p className="mt-8 max-w-xl font-sans text-lg leading-relaxed text-[color:var(--page-muted)] md:text-xl break-keep">
            찾으신 페이지는 이 도메인에 존재하지 않거나, 아직 태어나지 않았습니다.
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-3 border border-ink bg-ink px-6 py-3 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-white transition-colors hover:bg-vermillion hover:border-vermillion"
            >
              루트 포털로
              <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
                <path d="M1 6 H15 M11 1 L16 6 L11 11" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Link>
            <Link
              to="/me"
              className="inline-flex items-center gap-3 border border-ink px-6 py-3 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-ink transition-colors hover:bg-ink hover:text-white"
            >
              이기용 / me
            </Link>
          </div>
        </section>

        <footer className="flex items-end justify-between border-t border-[color:var(--page-rule)] pt-4 font-mono text-[0.65rem] uppercase tracking-[0.35em] text-[color:var(--page-muted)] md:text-xs">
          <span>status 404 · page not indexed</span>
          <span>— 2026</span>
        </footer>
      </div>
    </main>
  )
}
