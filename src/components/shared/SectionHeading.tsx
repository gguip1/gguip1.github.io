interface Props {
  index: string
  label: string
  kicker?: string
  align?: 'start' | 'center'
}

export default function SectionHeading({ index, label, kicker, align = 'start' }: Props) {
  return (
    <div
      className={`flex flex-col gap-3 ${align === 'center' ? 'items-center text-center' : 'items-start'}`}
    >
      <div className="flex items-center gap-4">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-ghost">
          {index}
        </span>
        <span className="h-px w-16 bg-rule-soft" />
        {kicker && (
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.35em] text-vermillion">
            {kicker}
          </span>
        )}
      </div>
      <h2 className="font-serif text-3xl font-bold tracking-kr break-keep md:text-4xl lg:text-5xl">
        {label}
      </h2>
    </div>
  )
}
