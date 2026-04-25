import type { Award } from '@/content/me'
import SectionHeading from '@/components/shared/SectionHeading'

interface Props {
  awards: Award[]
}

export default function AwardsSection({ awards }: Props) {
  const track = [...awards, ...awards, ...awards]
  return (
    <section className="relative bg-paper">
      <div className="mx-auto max-w-[1400px] px-6 pt-24 md:px-10 md:pt-32">
        <SectionHeading index="06" kicker="외부 인정" label="남이 보증해준 기록도, 따로 있습니다." />
      </div>

      <div className="group relative mt-14 overflow-hidden border-y border-rule-soft py-10">
        <div className="flex w-max animate-marquee-x gap-16 group-hover:[animation-play-state:paused]">
          {track.map((a, i) => (
            <div key={i} className="flex shrink-0 items-baseline gap-5">
              <span className="font-serif text-5xl font-black leading-none tracking-kr text-vermillion md:text-6xl">
                {a.year}
              </span>
              <div className="max-w-xs">
                <div className="font-serif text-base font-bold text-ink md:text-lg break-keep">
                  {a.title}
                </div>
                <div className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-ghost">
                  {a.org}
                </div>
              </div>
              <span aria-hidden="true" className="self-center font-serif text-3xl text-rule-soft">
                ·
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-6 md:px-10 md:pb-32">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-ghost">
          마퀴 — 호버 시 정지
        </p>
      </div>
    </section>
  )
}
