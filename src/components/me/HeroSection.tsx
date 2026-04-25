import type { HeroContent } from '@/content/me'
import GradientMesh from '@/components/shared/GradientMesh'

interface Props {
  content: HeroContent
  hook: string
}

export default function HeroSection({ content, hook }: Props) {
  return (
    <section className="relative isolate overflow-hidden">
      <GradientMesh variant="warm" />
      <div className="relative mx-auto flex min-h-screen max-w-[1400px] flex-col px-6 pb-20 pt-10 md:px-10 md:pb-28 md:pt-16">
        <header className="flex items-center justify-between gap-6 font-mono text-[0.65rem] uppercase tracking-[0.35em] text-ghost md:text-xs">
          <span>gguip1 · 이기용</span>
          <span className="h-px flex-1 bg-rule-soft" />
          <span>2026</span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-20">
          <span className="mb-6 font-mono text-[0.7rem] uppercase tracking-[0.4em] text-vermillion animate-fade-rise [animation-delay:0.05s]">
            {content.role}
          </span>

          <h1 className="font-serif text-hero font-black leading-[0.95] tracking-kr break-keep text-balance animate-fade-rise [animation-delay:0.15s]">
            {content.tagline}
          </h1>

          <p className="mt-10 max-w-3xl font-serif text-lg italic leading-relaxed text-ghost md:text-xl animate-fade-rise [animation-delay:0.3s]">
            {hook}
          </p>

          <div className="mt-16 flex flex-wrap items-baseline gap-x-6 gap-y-2 animate-fade-rise [animation-delay:0.45s]">
            <span className="font-serif text-3xl font-bold tracking-kr md:text-4xl">
              {content.name}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.4em] text-ghost">
              {content.nameEn}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-[0.65rem] uppercase tracking-[0.35em] text-ghost md:text-xs">
          <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true" className="text-ink">
            <path d="M6 1 V17 M1 12 L6 17 L11 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>{content.scrollLabel}</span>
        </div>
      </div>
    </section>
  )
}
