import type { ComponentType } from 'react'
import type { StoryFrontmatter } from '@/types/mdx'

interface PostModule {
  default: ComponentType<{ components?: Record<string, ComponentType<unknown>> }>
  frontmatter: StoryFrontmatter
}

const modules = import.meta.glob<PostModule>('./*.mdx', { eager: true })

export interface Post {
  slug: string
  frontmatter: StoryFrontmatter
  Component: PostModule['default']
}

export const posts: Post[] = Object.values(modules)
  .map((m) => ({
    slug: m.frontmatter.slug,
    frontmatter: m.frontmatter,
    Component: m.default,
  }))
  .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1))

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getAdjacent(slug: string) {
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx === -1) return { prev: undefined, next: undefined }
  return {
    prev: idx > 0 ? posts[idx - 1] : undefined,
    next: idx < posts.length - 1 ? posts[idx + 1] : undefined,
  }
}
