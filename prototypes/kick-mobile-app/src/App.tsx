import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { LiveStream } from '@shared/types';
import { CommunityFeed } from './community/feed/CommunityFeed';
import { ProfilePage } from './community/passport/ProfilePage';
import { HomeTab } from './HomeTab';
import { StreamView } from './StreamView';
import { BottomTabBar } from './BottomTabBar';
import { TABS, type Tab } from './tabs';

/** The mobile app shell: three pages — Community, Home (Progressive Mosaic
 *  Discovery), Profile — behind a bottom tab bar, swipeable horizontally via
 *  native CSS scroll-snap. No header: on mobile that's what the footer nav
 *  is for. Tapping any stream card in Home opens it fullscreen with chat;
 *  that fullscreen view is a single app-level overlay (not scoped to the
 *  Home tab) so it covers the tab bar too. */
export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [openStream, setOpenStream] = useState<LiveStream | null>(null);
  const pagerRef = useRef<HTMLDivElement>(null);

  // Land on Home by default (index 1) without an animated scroll on mount.
  useEffect(() => {
    const el = pagerRef.current;
    if (el) el.scrollLeft = el.clientWidth * TABS.indexOf('home');
  }, []);

  const scrollToTab = (tab: Tab) => {
    const el = pagerRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * TABS.indexOf(tab), behavior: 'smooth' });
    setActiveTab(tab);
  };

  const handleScroll = () => {
    const el = pagerRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    const tab = TABS[Math.min(TABS.length - 1, Math.max(0, index))];
    if (tab !== activeTab) setActiveTab(tab);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden font-display">
      <div
        ref={pagerRef}
        onScroll={handleScroll}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        <section className="h-full w-full shrink-0 snap-center overflow-y-auto p-4">
          <CommunityFeed />
        </section>
        <section className="h-full w-full shrink-0 snap-center overflow-hidden">
          <HomeTab onOpenStream={setOpenStream} />
        </section>
        <section className="h-full w-full shrink-0 snap-center overflow-y-auto p-4">
          <ProfilePage />
        </section>
      </div>

      <BottomTabBar active={activeTab} onSelect={scrollToTab} />

      <AnimatePresence>
        {openStream && <StreamView key={openStream.id} stream={openStream} onClose={() => setOpenStream(null)} />}
      </AnimatePresence>
    </div>
  );
}
