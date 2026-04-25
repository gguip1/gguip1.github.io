import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { useReveal } from '@/hooks/useReveal'

interface Props extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  delay?: number
  as?: ElementType
}

export default function Reveal({
  children,
  delay = 0,
  className = '',
  style,
  as: Tag = 'div',
  ...rest
}: Props) {
  const ref = useReveal<HTMLElement>()
  return (
    <Tag
      ref={ref}
      className={className}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
