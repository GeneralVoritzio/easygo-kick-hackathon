import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { startEngineTick } from './engine/mockEvents'
import StreamView from './stream/StreamView'
import BrandConsole from './brand/BrandConsole'
import SolutionPage from './circles/SolutionPage'
import CirclesPage from './circles/CirclesPage'
import BrowsePage from './browse/BrowsePage'
import DashboardPage from './dashboard/DashboardPage'
import AuthModal from './auth/AuthModal'

export default function App() {
  useEffect(() => startEngineTick(), [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/stream" replace />} />
        <Route path="/stream" element={<StreamView />} />
        <Route path="/brand" element={<BrandConsole />} />
        <Route path="/solution" element={<SolutionPage />} />
        <Route path="/circles" element={<CirclesPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
      {/* auth modal is global — any page can open it via useAuth */}
      <AuthModal />
    </BrowserRouter>
  )
}
