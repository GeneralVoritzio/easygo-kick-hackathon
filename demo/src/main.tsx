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
import { SettingsProfile } from './kick/pages/SettingsProfile'
import { SettingsPreferences } from './kick/pages/SettingsPreferences'
import { DropsInventory } from './kick/pages/DropsInventory'
import { DropsAllCampaigns } from './kick/pages/DropsAllCampaigns'
import { CreatorDashboard } from './kick/pages/CreatorDashboard'
import { RaidProvider } from './kick/raid/RaidProvider'
import { RaidDialog } from './kick/components/RaidDialog'
import Demo from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RaidProvider>
        <RaidDialog />
        <Routes>
          <Route path="/demo" element={<Demo />} />
          <Route path="/dashboard" element={<CreatorDashboard />} />
          <Route path="/dashboard/:section" element={<CreatorDashboard />} />
          <Route path="/dashboard/channel/:section" element={<CreatorDashboard />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse tab="livestreams" />} />
            <Route path="/browse/categories" element={<Browse tab="categories" />} />
            <Route path="/browse/clips" element={<Browse tab="clips" />} />
            <Route path="/following" element={<Following />} />
            <Route path="/following/categories" element={<FollowingCategories />} />
            <Route path="/following/channels" element={<FollowingChannels />} />
            <Route path="/drops/inventory" element={<DropsInventory />} />
            <Route path="/drops/all-campaigns" element={<DropsAllCampaigns />} />
            <Route path="/settings/profile" element={<SettingsProfile />} />
            <Route path="/settings/preferences" element={<SettingsPreferences />} />
            <Route path="/:slug" element={<Channel tab="home" watch />} />
            <Route path="/:slug/home" element={<Channel tab="home" />} />
            <Route path="/:slug/about" element={<Channel tab="about" />} />
            <Route path="/:slug/videos" element={<Channel tab="videos" />} />
            <Route path="/:slug/clips" element={<Channel tab="clips" />} />
          </Route>
        </Routes>
      </RaidProvider>
    </BrowserRouter>
  </StrictMode>,
)
