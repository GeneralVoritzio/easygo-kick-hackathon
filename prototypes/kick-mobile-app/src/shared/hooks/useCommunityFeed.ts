import { useEffect, useState } from 'react';
import type { Community, CommunityEvent, CommunityGoal, CommunityPoll, CommunityThread } from '../types';
import {
  createMockCommunity,
  createMockCommunityEvents,
  createMockCommunityGoal,
  createMockCommunityPoll,
  createMockCommunityThreads,
} from '../mock/mockData';

interface UseCommunityFeedResult {
  community: Community | null;
  events: CommunityEvent[];
  threads: CommunityThread[];
  poll: CommunityPoll | null;
  goal: CommunityGoal | null;
  loading: boolean;
}

/**
 * Kick Communities is a new pitch with no backend contract yet — this is
 * mock-only so /community is renderable for the concept demo. Once a real
 * `/api/community` endpoint exists this should follow the same
 * REST-with-mock-fallback shape as usePreStreamReport.
 */
export function useCommunityFeed(): UseCommunityFeedResult {
  const [community, setCommunity] = useState<Community | null>(null);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [poll, setPoll] = useState<CommunityPoll | null>(null);
  const [goal, setGoal] = useState<CommunityGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (cancelled) return;
      setCommunity(createMockCommunity());
      setEvents(createMockCommunityEvents());
      setThreads(createMockCommunityThreads());
      setPoll(createMockCommunityPoll());
      setGoal(createMockCommunityGoal());
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { community, events, threads, poll, goal, loading };
}
