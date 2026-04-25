import { Link } from 'react-router-dom'
import type { Story } from '@/content/me'
import SectionHeading from '@/components/shared/SectionHeading'
import Reveal from '@/components/shared/Reveal'

interface Props {
  stories: Story[]
}

export default function SignatureStoriesSection({ stories }: Props) {
  return (
    <section className="relative bg-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <SectionHeading
          index="02"
          kicker="시그니처 사례"
          label="세 개의 장면으로 압축한 이력서."
        />

        <ol className="mt-20 flex flex-col gap-8">
          {stories.map((story, i) => (
            <Reveal
              as="li"
              key={story.id}
              delay={i * 120}
              className="group relative"
            >
              <Link
                to={`/me/stories/${story.id}`}
                className="block rounded-sm border border-rule-soft bg-mist-cool p-8 transition-all duration-300 hover:border-ink hover:bg-paper md:p-12"
              >
                <div className="flex items-start justify-between gap-6 md:items-baseline">
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[0.75rem] uppercase tracking-[0.3em] text-vermillion">
                      {story.index}
                    </span>
                    <h3 className="font-serif text-2xl font-bold tracking-kr break-keep md:text-3xl lg:text-4xl">
                      {story.title}
                    </h3>
                  </div>
                  <svg
                    width="28"
                    height="14"
                    viewBox="0 0 28 14"
                    aria-hidden="true"
                    className="mt-2 shrink-0 text-ink transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path d="M1 7 H25 M20 1 L26 7 L20 13" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>

                <p className="mt-4 font-serif text-lg italic text-ghost md:ml-12 md:text-xl break-keep">
                  {story.hook}
                </p>

                <div className="mt-8 flex flex-wrap items-baseline gap-x-10 gap-y-4 border-t border-rule-soft pt-6 md:ml-12">
                  <dl className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
                    <div>
                      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">
                        BEFORE
                      </dt>
                      <dd className="mt-1 font-serif text-base font-bold break-keep">{story.metric.before}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">
                        AFTER
                      </dt>
                      <dd className="mt-1 font-serif text-base font-bold break-keep">{story.metric.after}</dd>
                    </div>
                    <div className="min-w-[12rem]">
                      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">
                        DELTA
                      </dt>
                      <dd className="mt-1 font-serif text-base font-bold text-vermillion break-keep">
                        {story.metric.delta}
                      </dd>
                    </div>
                  </dl>
                  <span className="ml-auto font-mono text-[0.7rem] uppercase tracking-[0.3em] text-ink group-hover:text-vermillion">
                    전문 읽기 →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
