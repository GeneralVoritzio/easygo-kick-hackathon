import { useMemo, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { createCatalog } from './mock/catalog';
import { createFeaturedStreamer } from './mock/featured';
import { PinnedStreamsProvider } from './context/PinnedStreamsContext';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { HomePage } from './pages/HomePage';
import { WatchPage } from './pages/WatchPage';
import { MultiviewPage } from './pages/MultiviewPage';
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
          </Routes>
        </main>
      </div>
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
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
    <PinnedStreamsProvider>
      <BrowserRouter>
        <AppShell catalog={catalog} featured={featured} />
      </BrowserRouter>
    </PinnedStreamsProvider>
  );
}
