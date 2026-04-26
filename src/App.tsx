import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HubPage from '@/routes/HubPage'
import MePage from '@/routes/MePage'
import BlogIndexPage from '@/routes/BlogIndexPage'
import BlogPostPage from '@/routes/BlogPostPage'
import NotFoundPage from '@/routes/NotFoundPage'
import ScrollToTop from '@/components/shared/ScrollToTop'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HubPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
