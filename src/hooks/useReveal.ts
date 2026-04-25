import { useCallback, useEffect, useRef } from 'react'

let observer: IntersectionObserver | null = null
const listeners = new WeakMap<Element, () => void>()

function getObserver() {
  if (observer) return observer
  if (typeof window === 'undefined') return null

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = listeners.get(entry.target)
          if (cb) cb()
          observer!.unobserve(entry.target)
        }
      }
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px',
    },
  )
  return observer
}

export function useReveal<T extends HTMLElement>() {
  const nodeRef = useRef<T | null>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      node.dataset.visible = 'true'
      return
    }

    node.dataset.visible = 'false'
    const obs = getObserver()
    if (!obs) {
      node.dataset.visible = 'true'
      return
    }

    listeners.set(node, () => {
      node.dataset.visible = 'true'
    })
    obs.observe(node)

    return () => {
      obs.unobserve(node)
      listeners.delete(node)
    }
  }, [])

  const setRef = useCallback((node: T | null) => {
    nodeRef.current = node
  }, [])

  return setRef
}
