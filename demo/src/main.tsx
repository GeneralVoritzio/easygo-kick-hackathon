import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './kick/theme.css'
import { Layout } from './kick/components/Layout'
import { Home } from './kick/pages/Home'
import { Browse } from './kick/pages/Browse'
import { Following } from './kick/pages/Following'
import { FollowingCategories } from './kick/pages/FollowingCategories'
import { FollowingChannels } from './kick/pages/FollowingChannels'
import { Channel } from './kick/pages/Channel'
import { ChannelClips } from './kick/pages/ChannelClips'
import { SettingsProfile } from './kick/pages/SettingsProfile'
import { SettingsPreferences } from './kick/pages/SettingsPreferences'
import { CreatorDashboard } from './kick/pages/CreatorDashboard'
import Demo from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/demo" element={<Demo />} />
        <Route path="/dashboard" element={<CreatorDashboard />} />
        <Route path="/dashboard/:section" element={<CreatorDashboard />} />
        <Route path="/dashboard/channel/:section" element={<CreatorDashboard />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/following" element={<Following />} />
          <Route path="/following/categories" element={<FollowingCategories />} />
          <Route path="/following/channels" element={<FollowingChannels />} />
          <Route path="/settings/profile" element={<SettingsProfile />} />
          <Route path="/settings/preferences" element={<SettingsPreferences />} />
          <Route path="/:slug" element={<Channel />} />
          <Route path="/:slug/clips" element={<ChannelClips />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
