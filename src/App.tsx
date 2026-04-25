import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HubPage from '@/routes/HubPage'
import MePage from '@/routes/MePage'
import StoryDetailPage from '@/routes/StoryDetailPage'
import NotFoundPage from '@/routes/NotFoundPage'
import ScrollToTop from '@/components/shared/ScrollToTop'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HubPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/me/stories/:slug" element={<StoryDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
