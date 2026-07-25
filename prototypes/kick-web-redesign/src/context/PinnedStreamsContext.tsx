import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export const MAX_PINS = 9;

interface PinnedStreamsContextValue {
  pinnedIds: string[];
  isPinned: (id: string) => boolean;
  togglePin: (id: string) => void;
  unpin: (id: string) => void;
  canPinMore: boolean;
  /** Which pinned stream currently has audio, across Multiview and the
   *  watch page — only one at a time, same rule everywhere in the app. */
  audioActiveId: string | null;
  setAudioActiveId: (id: string | null) => void;
}

const PinnedStreamsContext = createContext<PinnedStreamsContextValue | null>(null);

/** Pinned streams and which one has audio focus are global state — a pin
 *  made while browsing the homepage has to still be there when you
 *  navigate to /multiview, so this sits above the router, not inside a
 *  single page. */
export function PinnedStreamsProvider({ children }: { children: ReactNode }) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [audioActiveId, setAudioActiveId] = useState<string | null>(null);

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((p) => p !== id);
        if (audioActiveId === id) setAudioActiveId(next[0] ?? null);
        return next;
      }
      if (prev.length >= MAX_PINS) return prev;
      const next = [...prev, id];
      if (audioActiveId === null) setAudioActiveId(id);
      return next;
    });
  };

  const unpin = (id: string) => {
    setPinnedIds((prev) => {
      const next = prev.filter((p) => p !== id);
      if (audioActiveId === id) setAudioActiveId(next[0] ?? null);
      return next;
    });
  };

  const value = useMemo<PinnedStreamsContextValue>(
    () => ({
      pinnedIds,
      isPinned: (id) => pinnedIds.includes(id),
      togglePin,
      unpin,
      canPinMore: pinnedIds.length < MAX_PINS,
      audioActiveId,
      setAudioActiveId,
    }),
    [pinnedIds, audioActiveId]
  );

  return <PinnedStreamsContext.Provider value={value}>{children}</PinnedStreamsContext.Provider>;
}

export function usePinnedStreams(): PinnedStreamsContextValue {
  const ctx = useContext(PinnedStreamsContext);
  if (!ctx) throw new Error('usePinnedStreams must be used within PinnedStreamsProvider');
  return ctx;
}
