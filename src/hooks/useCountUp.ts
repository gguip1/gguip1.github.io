import { useEffect, useRef, useState } from 'react'

interface Options {
  durationMs?: number
  start?: number
}

export function useCountUp(target: number, { durationMs = 1200, start = 0 }: Options = {}) {
  const [value, setValue] = useState(start)
  const nodeRef = useRef<HTMLElement | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(target)
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true
            const t0 = performance.now()
            const tick = (now: number) => {
              const elapsed = now - t0
              const p = Math.min(1, elapsed / durationMs)
              const eased = 1 - Math.pow(1 - p, 3)
              setValue(start + (target - start) * eased)
              if (p < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            obs.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.4 },
    )

    obs.observe(node)
    return () => obs.disconnect()
  }, [target, durationMs, start])

  const setRef = (node: HTMLElement | null) => {
    nodeRef.current = node
  }

  return { value, ref: setRef }
}
