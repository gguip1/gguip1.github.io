import type { AiAssistedContent } from '@/content/me'
import SectionHeading from '@/components/shared/SectionHeading'
import Reveal from '@/components/shared/Reveal'

interface Props {
  content: AiAssistedContent
}

export default function AiAssistedSection({ content }: Props) {
  return (
    <section className="relative bg-mist">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <SectionHeading
          index="05"
          kicker={content.kicker}
          label="AI는 부조종사, 결정은 내가."
        />

        <div className="mt-20 grid grid-cols-1 gap-14 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <Reveal className="flex flex-col justify-between gap-10">
            <blockquote className="font-serif text-3xl font-black leading-snug tracking-kr break-keep md:text-4xl lg:text-5xl">
              <span className="text-vermillion">&ldquo;</span>
              {content.quote}
              <span className="text-vermillion">&rdquo;</span>
            </blockquote>

            <div>
              <div className="font-serif text-6xl font-black leading-none tracking-kr text-vermillion md:text-7xl">
                {content.stat.value}
              </div>
              <p className="mt-3 font-sans text-sm text-ink-soft md:text-base break-keep">
                {content.stat.label}
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="flex flex-col gap-6">
            {content.paragraphs.map((p, i) => (
              <p
                key={i}
                className="font-sans text-base leading-[1.9] text-ink-soft md:text-lg break-keep"
              >
                {p}
              </p>
            ))}

            <div className="mt-8 border-t border-ink pt-6">
              <div className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-ghost">
                도구 세트
              </div>
              <ul className="mt-4 divide-y divide-rule-soft">
                {content.tools.map((t) => (
                  <li
                    key={t.name}
                    className="grid grid-cols-[auto_1fr] gap-6 py-3 font-sans text-sm md:text-base"
                  >
                    <span className="font-serif font-bold">{t.name}</span>
                    <span className="text-ink-soft break-keep">{t.use}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 border-l-2 border-vermillion pl-5 font-serif italic text-ghost md:text-lg break-keep">
              {content.note}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
