import { Link } from 'react-router-dom'
import type { HubEntry } from '@/content/hub'

const statusLabel: Record<HubEntry['status'], string> = {
  LIVE: 'LIVE',
  DRAFT: 'DRAFT',
  SOON: '준비 중',
}

export default function HubRow({ entry }: { entry: HubEntry }) {
  const disabled = entry.status !== 'LIVE'

  const body = (
    <div
      className={`group grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-6 gap-y-1 border-b py-7 transition-colors duration-300 md:grid-cols-[4rem_6rem_1fr_auto] md:gap-x-10 md:py-9 ${
        disabled ? 'border-[color:var(--page-rule)] text-[color:var(--page-muted)]' : 'border-[color:var(--page-rule)] hover:border-ink'
      }`}
    >
      <span className="font-mono text-xs uppercase tracking-[0.35em] text-[color:var(--page-muted)]">
        {entry.index}
      </span>

      <span
        className={`font-mono text-sm tracking-wider ${
          disabled ? 'text-[color:var(--page-muted)]' : 'text-[color:var(--page-fg)]'
        }`}
      >
        {entry.slug}
      </span>

      <div className="col-span-2 md:col-span-1 md:ml-0">
        <div
          className={`font-sans text-2xl font-light tracking-tight transition-transform duration-300 md:text-3xl ${
            disabled ? '' : 'group-hover:translate-x-1.5'
          }`}
        >
          {entry.title}
        </div>
        <div className="mt-1 font-sans text-sm text-[color:var(--page-muted)] md:text-base">
          {entry.sub}
        </div>
      </div>

      <span
        className={`col-start-3 row-start-1 justify-self-end font-mono text-[0.65rem] uppercase tracking-[0.3em] md:col-start-4 ${
          entry.status === 'LIVE' ? 'text-vermillion' : 'text-[color:var(--page-muted)]'
        }`}
      >
        {statusLabel[entry.status]}
      </span>
    </div>
  )

  if (disabled) {
    return <div aria-disabled="true">{body}</div>
  }

  return (
    <Link to={entry.slug} className="block">
      {body}
    </Link>
  )
}
