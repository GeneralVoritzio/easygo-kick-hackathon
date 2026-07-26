import { useMemo, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AnimatePresence } from 'framer-motion';
import { createCatalog } from './mock/catalog';
import { createFeaturedStreamer } from './mock/featured';
import { SettingsProvider } from './context/SettingsContext';
import { PinnedStreamsProvider } from './context/PinnedStreamsContext';
import { ExpeditionProvider } from './context/ExpeditionContext';
import { KickBossProvider, useKickBoss } from './context/KickBossContext';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { KickBossRewardToast } from './components/KickBossRewardToast';
import { HomePage } from './pages/HomePage';
import { WatchPage } from './pages/WatchPage';
import { MultiviewPage } from './pages/MultiviewPage';
import { ExpeditionsPage } from './pages/ExpeditionsPage';
import { ExpeditionPage } from './pages/ExpeditionPage';
import type { StreamCard, FeaturedStreamer } from './types';

interface AppShellProps {
  catalog: StreamCard[];
  featured: FeaturedStreamer | null;
}

/** Split out from `App` so it renders inside `BrowserRouter` — global
 *  shortcuts need `useNavigate`, which only works below the router. */
function AppShell({ catalog, featured }: AppShellProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  useGlobalShortcuts(helpOpen, setHelpOpen);

  const { lastResult, dismissResult } = useKickBoss();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Navbar onOpenShortcuts={() => setHelpOpen(true)} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar catalog={catalog} />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage catalog={catalog} featured={featured} />} />
            <Route path="/watch/:id" element={<WatchPage catalog={catalog} />} />
            <Route path="/multiview" element={<MultiviewPage catalog={catalog} />} />
            <Route path="/expeditions" element={<ExpeditionsPage />} />
            <Route path="/expedition/:id" element={<ExpeditionPage />} />
          </Routes>
        </main>
      </div>
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
      <AnimatePresence>
        {lastResult?.participated && <KickBossRewardToast key={lastResult.boss.id} result={lastResult} onClose={dismissResult} />}
      </AnimatePresence>
    </div>
  );
}

/** The catalog and the week's featured pick are generated once per page
 *  load (not per navigation) so a card's viewer count, gradient, etc. stay
 *  stable while you browse between Home, a watch page, and Multiview. */
export function App() {
  const [catalog] = useState(createCatalog);
  const featured = useMemo(() => createFeaturedStreamer(catalog), [catalog]);

  return (
    <SettingsProvider>
      <PinnedStreamsProvider>
        <ExpeditionProvider catalog={catalog}>
          <KickBossProvider catalog={catalog}>
            <BrowserRouter>
              <AppShell catalog={catalog} featured={featured} />
            </BrowserRouter>
          </KickBossProvider>
        </ExpeditionProvider>
      </PinnedStreamsProvider>
    </SettingsProvider>
  );
}
