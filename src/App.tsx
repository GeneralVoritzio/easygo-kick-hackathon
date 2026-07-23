import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { startEngineTick } from './engine/mockEvents'
import StreamView from './stream/StreamView'
import BrandConsole from './brand/BrandConsole'

export default function App() {
  useEffect(() => startEngineTick(), [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/stream" replace />} />
        <Route path="/stream" element={<StreamView />} />
        <Route path="/brand" element={<BrandConsole />} />
      </Routes>
    </BrowserRouter>
  )
}
