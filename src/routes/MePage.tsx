import { useEffect } from 'react'
import HeroSection from '@/components/me/HeroSection'
import StatsSection from '@/components/me/StatsSection'
import SignatureStoriesSection from '@/components/me/SignatureStoriesSection'
import ProjectsSection from '@/components/me/ProjectsSection'
import TechArsenalSection from '@/components/me/TechArsenalSection'
import AiAssistedSection from '@/components/me/AiAssistedSection'
import AwardsSection from '@/components/me/AwardsSection'
import FaqSection from '@/components/me/FaqSection'
import FinalCtaSection from '@/components/me/FinalCtaSection'
import { me } from '@/content/me'

export default function MePage() {
  useEffect(() => {
    document.title = '이기용 · gguip1 portfolio'
  }, [])
  return (
    <main className="min-h-screen">
      <HeroSection content={me.hero} hook={me.heroHook} />
      <StatsSection stats={me.stats} />
      <SignatureStoriesSection stories={me.stories} />
      <ProjectsSection projects={me.projects} />
      <TechArsenalSection categories={me.techCategories} />
      <AiAssistedSection content={me.aiAssisted} />
      <AwardsSection awards={me.awards} />
      <FaqSection items={me.faq} />
      <FinalCtaSection content={me.cta} />
    </main>
  )
}
