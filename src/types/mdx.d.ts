export interface StoryFrontmatter {
  title: string
  slug: string
  kicker: string
  date: string
  metric: { before: string; after: string; delta: string }
  related?: string[]
  tags?: string[]
  readingMinutes?: number
}

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: StoryFrontmatter
  const Component: ComponentType<{ components?: Record<string, ComponentType<unknown>> }>
  export default Component
}
