import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { FeaturedStreamer, StreamCard } from '../types';
import { CATEGORY_POOL, groupByCategory, interleaveForDiscovery } from '../mock/catalog';
import { useExpeditions } from '../context/ExpeditionContext';
import { useKickBoss } from '../context/KickBossContext';
import { useSettings } from '../context/SettingsContext';
import { useIdleNudge } from '../hooks/useIdleNudge';
import { FeaturedHero } from '../components/FeaturedHero';
import { DiscoveryRail } from '../components/DiscoveryRail';
import { ExpeditionPromptToast } from '../components/ExpeditionPromptToast';
import { KickBossAnnouncement } from '../components/KickBossAnnouncement';
import { NotificationStack } from '../components/NotificationStack';

interface HomePageProps {
  catalog: StreamCard[];
  featured: FeaturedStreamer | null;
}

const INITIAL_CATEGORY_ROWS = 4;
const CATEGORY_ROWS_PER_BATCH = 3;
/** Safety cap, same reasoning as `DiscoveryRail`'s MAX_CYCLES: high enough
 *  that no real scrolling session reaches it. */
const MAX_CATEGORY_ROWS = 60;

/** Home: the week's featured streamer, two named rails, then an infinite
 *  vertical list of category rows — scroll down and a new category (and
 *  its own horizontally-scrolling rail) keeps appearing, cycling through
 *  `CATEGORY_POOL` rather than requiring a click into a category page.
 *  "Live Now" mixes tiers so small streamers get regular placement in the
 *  main feed, not just their own separate row; "Rising Talent" is that
 *  separate row anyway, for anyone who specifically wants to find
 *  something new. */
export function HomePage({ catalog, featured }: HomePageProps) {
  const liveNow = useMemo(() => interleaveForDiscovery(catalog), [catalog]);
  const rising = useMemo(() => catalog.filter((c) => c.tier === 'rising'), [catalog]);
  const byCategory = useMemo(() => groupByCategory(catalog), [catalog]);

  const [categoryRows, setCategoryRows] = useState(INITIAL_CATEGORY_ROWS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { expeditions, join } = useExpeditions();
  const { activeBoss } = useKickBoss();
  const { bossAlertsEnabled, expeditionAlertsEnabled } = useSettings();
  const { shouldPrompt } = useIdleNudge(scrollRef);
  const [closedBossId, setClosedBossId] = useState<string | null>(null);
  const [closedExpeditionId, setClosedExpeditionId] = useState<string | null>(null);
  const bossNudge = bossAlertsEnabled && activeBoss?.status === 'active' ? activeBoss : null;
  const expeditionNudge = expeditionAlertsEnabled ? expeditions.find((e) => e.status === 'in-progress') : undefined;
  const showBoss = shouldPrompt && bossNudge && bossNudge.id !== closedBossId;
  const showExpedition = shouldPrompt && expeditionNudge && expeditionNudge.id !== closedExpeditionId;

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCategoryRows((n) => Math.min(MAX_CATEGORY_ROWS, n + CATEGORY_ROWS_PER_BATCH));
        }
      },
      { root, rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto pb-10">
      {featured && <FeaturedHero featured={featured} />}
      <DiscoveryRail title="Live Now" subtitle="Big and small, mixed together" cards={liveNow} catalog={catalog} />
      <DiscoveryRail title="Rising Talent" subtitle="Small streamers worth a look" cards={rising} catalog={catalog} />

      {Array.from({ length: categoryRows }).map((_, i) => {
        const category = CATEGORY_POOL[i % CATEGORY_POOL.length];
        return (
          <DiscoveryRail key={`${category}::${i}`} title={category} cards={byCategory[category] ?? []} catalog={catalog} />
        );
      })}

      <div ref={sentinelRef} aria-hidden className="h-px" />

      <NotificationStack>
        {showBoss && bossNudge && (
          <KickBossAnnouncement
            boss={bossNudge}
            onJump={() => setClosedBossId(bossNudge.id)}
            onDismiss={() => setClosedBossId(bossNudge.id)}
          />
        )}
        {showExpedition && expeditionNudge && (
          <ExpeditionPromptToast
            expedition={expeditionNudge}
            onJoin={() => {
              setClosedExpeditionId(expeditionNudge.id);
              join(expeditionNudge.id);
              navigate(`/expedition/${expeditionNudge.id}`);
            }}
            onDismiss={() => setClosedExpeditionId(expeditionNudge.id)}
          />
        )}
      </NotificationStack>
    </div>
  );
}
