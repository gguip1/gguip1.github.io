import type { FaqItem } from '@/content/me'
import SectionHeading from '@/components/shared/SectionHeading'
import Reveal from '@/components/shared/Reveal'

interface Props {
  items: FaqItem[]
}

export default function FaqSection({ items }: Props) {
  return (
    <section className="relative bg-mist-cool">
      <div className="mx-auto max-w-[1100px] px-6 py-24 md:px-10 md:py-32">
        <SectionHeading index="07" kicker="예상 질문" label="대답은 짧게, 증거는 깊게." />

        <ul className="mt-20 flex flex-col divide-y divide-ink/90 border-y border-ink">
          {items.map((item, i) => {
            const mirror = i % 2 === 1
            return (
              <Reveal as="li" key={i} delay={i * 60}>
                <details className="group">
                  <summary
                    className={`flex cursor-pointer list-none items-start gap-6 py-8 md:py-10 ${mirror ? 'md:pl-16' : 'md:pr-16'}`}
                  >
                    <span className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-vermillion">
                      Q{String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 font-serif text-2xl font-bold tracking-kr break-keep md:text-3xl">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-3 hidden h-px w-12 bg-ink transition-all group-open:w-24 group-open:bg-vermillion md:block"
                    />
                  </summary>
                  <div
                    className={`grid grid-cols-[auto_1fr] gap-6 pb-10 ${mirror ? 'md:pl-16' : 'md:pr-16'}`}
                  >
                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-ghost">
                      A{String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="font-sans text-base leading-[1.9] text-ink-soft md:text-lg break-keep">
                      {item.a}
                    </p>
                  </div>
                </details>
              </Reveal>
            )
          })}
        </ul>

        <p className="mt-12 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-ghost">
          더 묻고 싶은 게 있으면 아래 CTA로.
        </p>
      </div>
    </section>
  )
}
