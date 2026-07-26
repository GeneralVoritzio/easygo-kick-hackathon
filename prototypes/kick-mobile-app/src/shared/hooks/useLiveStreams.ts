import { useEffect, useState } from 'react';
import type { LiveStream } from '../types';
import { createMockLiveStreams } from '../mock/mockData';

interface UseLiveStreamsResult {
  streams: LiveStream[];
  loading: boolean;
}

/**
 * The roster itself (which real streams are offered) is mock-only, same as
 * useCommunityFeed/useBounties — no backend contract yet. The video is
 * real: each `LiveStream.embedId` is embedded live by `StreamSurface` via
 * the platform's own player, so there's nothing here to poll/tick — the
 * embed reflects actual live state on its own.
 */
export function useLiveStreams(): UseLiveStreamsResult {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (cancelled) return;
      setStreams(createMockLiveStreams());
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { streams, loading };
}
