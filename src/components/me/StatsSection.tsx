import type { Stat } from '@/content/me'
import SectionHeading from '@/components/shared/SectionHeading'
import Reveal from '@/components/shared/Reveal'
import { useCountUp } from '@/hooks/useCountUp'

interface Props {
  stats: Stat[]
}

function StatNumber({ value }: { value: string }) {
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ''))
  const target = Number.isFinite(parsed) ? parsed : 0
  const { value: current, ref } = useCountUp(target, { durationMs: 1400 })
  const display = target >= 100 ? Math.round(current) : current.toFixed(target % 1 === 0 ? 0 : 1)
  return (
    <span ref={ref as never} className="tabular-nums">
      {display}
    </span>
  )
}

export default function StatsSection({ stats }: Props) {
  return (
    <section className="relative bg-mist">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <SectionHeading index="01" kicker="측정된 결과" label="숫자는 거짓말하지 않는다." />

        <ul className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat, i) => (
            <Reveal
              as="li"
              key={stat.label}
              delay={i * 100}
              className="group relative flex flex-col gap-4 border-t border-rule-soft pt-6"
            >
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.35em] text-ghost">
                {String(i + 1).padStart(2, '0')}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-7xl font-black leading-none tracking-kr md:text-[5.5rem]">
                  <StatNumber value={stat.value} />
                </span>
                {stat.unit && (
                  <span className="font-serif text-4xl font-bold text-vermillion md:text-5xl">
                    {stat.unit}
                  </span>
                )}
              </div>

              <div className="font-serif text-xl font-bold tracking-kr break-keep md:text-2xl">
                {stat.label}
              </div>
              <p className="font-sans text-[0.95rem] leading-relaxed text-ink-soft break-keep">
                {stat.caption}
              </p>
              <p className="mt-auto font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ghost break-keep">
                {stat.source}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
