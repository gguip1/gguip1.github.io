import type { TechCategory } from '@/content/me'
import SectionHeading from '@/components/shared/SectionHeading'
import Reveal from '@/components/shared/Reveal'

interface Props {
  categories: TechCategory[]
}

export default function TechArsenalSection({ categories }: Props) {
  return (
    <section className="relative bg-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <SectionHeading index="04" kicker="도구" label="실전에서 뽑아낸 결과의 출처." />

        <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <Reveal key={cat.label} delay={i * 60} className="flex flex-col">
              <div className="flex items-baseline justify-between border-b border-ink pb-3">
                <h3 className="font-serif text-xl font-bold tracking-kr md:text-2xl">
                  {cat.label}
                </h3>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <ul className="mt-3">
                {cat.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center border-b border-rule-soft py-2.5 font-sans text-[0.95rem] text-ink-soft break-keep md:text-base"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
