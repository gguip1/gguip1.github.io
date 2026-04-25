interface Props {
  variant?: 'warm' | 'cool' | 'dusk'
  className?: string
}

const variants: Record<NonNullable<Props['variant']>, string> = {
  warm: `
    bg-[radial-gradient(circle_at_20%_20%,rgba(255,170,120,0.45),transparent_50%),
         radial-gradient(circle_at_80%_10%,rgba(255,210,170,0.4),transparent_55%),
         radial-gradient(circle_at_60%_80%,rgba(194,73,44,0.18),transparent_60%)]
  `,
  cool: `
    bg-[radial-gradient(circle_at_15%_30%,rgba(214,220,210,0.55),transparent_55%),
         radial-gradient(circle_at_85%_20%,rgba(235,226,209,0.65),transparent_60%),
         radial-gradient(circle_at_50%_90%,rgba(92,84,70,0.1),transparent_65%)]
  `,
  dusk: `
    bg-[radial-gradient(circle_at_20%_70%,rgba(194,73,44,0.22),transparent_55%),
         radial-gradient(circle_at_80%_30%,rgba(60,50,40,0.4),transparent_65%),
         radial-gradient(circle_at_50%_110%,rgba(255,90,61,0.2),transparent_55%)]
  `,
}

export default function GradientMesh({ variant = 'warm', className = '' }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 animate-mesh-drift blur-3xl opacity-70 mix-blend-multiply ${variants[variant]} ${className}`}
    />
  )
}
