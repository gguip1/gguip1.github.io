import type { CtaContent } from '@/content/me'
import GradientMesh from '@/components/shared/GradientMesh'

interface Props {
  content: CtaContent
}

export default function FinalCtaSection({ content }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-paper">
      <GradientMesh variant="dusk" className="opacity-80" />
      <div className="relative mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
        <div className="flex items-baseline gap-4 font-mono text-[0.65rem] uppercase tracking-[0.35em] text-paper/80 md:text-xs">
          <span className="text-stamp-hot">{content.kicker}</span>
          <span className="h-px flex-1 bg-paper/30" />
          <span>08</span>
        </div>

        <h2 className="mt-14 font-serif text-ultra font-black leading-[0.9] tracking-kr break-keep">
          {content.headline}
        </h2>

        <p className="mt-10 max-w-2xl border-l-2 border-stamp-hot pl-6 font-serif text-lg leading-relaxed text-paper/85 md:text-xl break-keep">
          {content.body}
        </p>

        <div className="mt-16 flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
          <a
            href={content.email.href}
            className="group inline-flex items-center justify-center gap-4 border border-paper bg-paper px-8 py-5 font-serif text-xl font-bold text-ink transition-colors hover:border-stamp-hot hover:bg-stamp-hot hover:text-paper md:text-2xl"
          >
            메일 보내기
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              <path d="M3 10 H15 M11 5 L16 10 L11 15" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </a>

          <a
            href={content.github.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 self-start border-b border-paper/40 pb-1 font-mono text-sm uppercase tracking-[0.25em] text-paper transition-colors hover:border-stamp-hot hover:text-stamp-hot"
          >
            {content.github.label}
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              <path d="M3 11 L11 3 M5 3 H11 V9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </a>
        </div>

        <div className="mt-24 flex flex-wrap items-end justify-between gap-6 border-t border-paper/30 pt-6 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-paper/80 md:text-xs">
          <span>{content.email.label}</span>
          <span>합류 후 48시간 이내 회신</span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-3 text-paper transition-colors hover:text-stamp-hot"
          >
            <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden="true">
              <path d="M7 21 V3 M1 9 L7 3 L13 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {content.backToTopLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
