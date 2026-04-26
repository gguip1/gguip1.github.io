import { useEffect } from 'react'
import { hub } from '@/content/hub'
import HubRow from '@/components/hub/HubRow'

export default function HubPage() {
  useEffect(() => {
    document.title = 'gguip1 · 이기용'
  }, [])

  return (
    <main className="theme-white min-h-screen bg-white text-ink">
      <div className="mx-auto flex min-h-screen max-w-[960px] flex-col px-6 py-10 md:px-10 md:py-16">
        <header className="flex items-center justify-between border-b border-[color:var(--page-rule)] pb-4 font-mono text-[0.65rem] uppercase tracking-[0.35em] text-[color:var(--page-muted)] md:text-xs">
          <span>{hub.masthead} · index</span>
          <span>{hub.year}</span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-20 md:py-28">
          <span className="mb-8 font-mono text-[0.7rem] uppercase tracking-[0.4em] text-vermillion animate-fade-rise">
            CONTENTS
          </span>

          <h1 className="max-w-3xl font-sans text-4xl font-light leading-tight tracking-tight break-keep animate-fade-rise [animation-delay:0.1s] md:text-6xl">
            {hub.intro}
          </h1>

          <p className="mt-8 max-w-xl font-sans text-base leading-relaxed text-[color:var(--page-muted)] animate-fade-rise [animation-delay:0.25s] md:text-lg break-keep">
            {hub.subintro}
          </p>

          <div className="mt-20 border-t border-[color:var(--page-rule)] animate-fade-rise [animation-delay:0.4s]">
            {hub.entries.map((entry) => (
              <HubRow key={entry.id} entry={entry} />
            ))}
          </div>
        </section>

        <footer className="flex items-end justify-between border-t border-[color:var(--page-rule)] pt-4 font-mono text-[0.65rem] uppercase tracking-[0.35em] text-[color:var(--page-muted)] md:text-xs">
          <span>gguip1 · the domain of one</span>
          <span>— {hub.year}</span>
        </footer>
      </div>
    </main>
  )
}
