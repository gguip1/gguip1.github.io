import type { Project } from '@/content/me'
import SectionHeading from '@/components/shared/SectionHeading'
import Reveal from '@/components/shared/Reveal'

interface Props {
  projects: Project[]
}

const roleClass: Record<Project['role'], string> = {
  솔로: 'text-vermillion',
  팀: 'text-ink-soft',
  팀장: 'text-ink',
}

export default function ProjectsSection({ projects }: Props) {
  return (
    <section className="relative bg-mist-cool">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <SectionHeading
          index="03"
          kicker="포트폴리오"
          label="팀에서, 혼자서, 끝까지 만들었다."
        />

        <ul className="mt-20 grid grid-cols-1 gap-px bg-rule-soft lg:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal
              as="li"
              key={p.id}
              delay={i * 80}
              className="group flex flex-col bg-paper p-8 transition-colors hover:bg-mist md:p-12"
            >
              <div className="flex items-baseline justify-between gap-3 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-ghost">
                <span className={`font-mono ${roleClass[p.role]}`}>{p.role} · {p.period}</span>
              </div>

              <h3 className="mt-6 font-serif text-3xl font-black tracking-kr break-keep md:text-4xl">
                {p.name}
              </h3>

              <p className="mt-5 font-sans text-base leading-[1.8] text-ink-soft md:text-lg break-keep">
                {p.summary}
              </p>

              <div className="mt-6">
                <div className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-ghost">
                  Stack
                </div>
                <p className="font-sans text-sm leading-relaxed text-ink-soft break-keep md:text-[0.95rem]">
                  {p.stack.join(', ')}
                </p>
              </div>

              <ul className="mt-6 space-y-2 border-t border-rule-soft pt-5">
                {p.outcomes.map((o, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 font-sans text-sm text-ink-soft md:text-base break-keep"
                  >
                    <span className="font-mono text-vermillion" aria-hidden="true">·</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>

              {p.href && (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 self-start font-mono text-[0.7rem] uppercase tracking-[0.25em] text-ink transition-colors hover:text-vermillion"
                >
                  {p.name} · GitHub
                  <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
                    <path d="M1 5 H12 M8 1 L12 5 L8 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </a>
              )}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
