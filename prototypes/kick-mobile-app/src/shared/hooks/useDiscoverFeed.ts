import { useEffect, useState } from 'react';
import type { DiscoverEvent, TrendingMultiview } from '../types';
import { createMockDiscoverEvents, createMockTrendingMultiviews } from '../mock/mockData';

interface UseDiscoverFeedResult {
  events: DiscoverEvent[];
  trendingMultiviews: TrendingMultiview[];
  loading: boolean;
}

/**
 * The Discover tab is mock-only, same as useLiveStreams — no backend
 * contract yet for cross-creator events or multiview popularity.
 */
export function useDiscoverFeed(): UseDiscoverFeedResult {
  const [events, setEvents] = useState<DiscoverEvent[]>([]);
  const [trendingMultiviews, setTrendingMultiviews] = useState<TrendingMultiview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (cancelled) return;
      setEvents(createMockDiscoverEvents());
      setTrendingMultiviews(createMockTrendingMultiviews());
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, trendingMultiviews, loading };
}
