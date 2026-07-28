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
import { SettingsWatchHistory } from './kick/pages/SettingsWatchHistory'
import { SettingsPreferences } from './kick/pages/SettingsPreferences'
import { CreatorDashboard } from './kick/pages/CreatorDashboard'
import { Expeditions } from './kick/pages/Expeditions'
import { Expedition } from './kick/pages/Expedition'
import { CreateExpedition } from './kick/pages/CreateExpedition'
import { Multiview } from './kick/pages/Multiview'
import { PinnedStreamsProvider } from './kick/expedition/PinnedStreamsContext'
import { ExpeditionProvider } from './kick/expedition/ExpeditionContext'
import { ExpeditionSettingsProvider } from './kick/expedition/ExpeditionSettingsContext'
import { ChannelPointsToast } from './kick/expedition/ChannelPointsToast'
import { HandoffNoticeToast } from './kick/expedition/HandoffNoticeToast'
import { EndedNoticeToast } from './kick/expedition/EndedNoticeToast'
import { livestreams } from './kick/mock/api'
import Demo from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PinnedStreamsProvider>
      <ExpeditionSettingsProvider>
        <ExpeditionProvider livestreams={livestreams}>
          <BrowserRouter>
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
                <Route path="/settings/profile" element={<SettingsProfile />} />
                <Route path="/settings/watch-history" element={<SettingsWatchHistory />} />
                <Route path="/settings/preferences" element={<SettingsPreferences />} />
                <Route path="/multiview" element={<Multiview />} />
                <Route path="/expeditions" element={<Expeditions />} />
                <Route path="/expeditions/new" element={<CreateExpedition />} />
                <Route path="/expedition/:id" element={<Expedition />} />
                <Route path="/:slug" element={<Channel tab="home" watch />} />
                <Route path="/:slug/home" element={<Channel tab="home" />} />
                <Route path="/:slug/about" element={<Channel tab="about" />} />
                <Route path="/:slug/videos" element={<Channel tab="videos" />} />
                <Route path="/:slug/clips" element={<Channel tab="clips" />} />
              </Route>
            </Routes>
            <ChannelPointsToast />
            <HandoffNoticeToast />
            <EndedNoticeToast />
          </BrowserRouter>
        </ExpeditionProvider>
      </ExpeditionSettingsProvider>
    </PinnedStreamsProvider>
  </StrictMode>,
)
