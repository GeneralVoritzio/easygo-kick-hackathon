import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export const MAX_PINS = 9;

interface PinnedStreamsContextValue {
  pinnedIds: string[];
  isPinned: (id: string) => boolean;
  togglePin: (id: string) => void;
  /** Pins every id not already pinned, in order, up to `MAX_PINS` total —
   *  the rest are silently skipped rather than bumping anything already
   *  pinned. Used by "Add all to Multiview" on a streamer party. */
  pinMany: (ids: string[]) => void;
  unpin: (id: string) => void;
  /** The other half of "Add all to Multiview" — once every party member is
   *  pinned, the same button flips to "Remove all," and this drops them
   *  all in one click instead of one pin at a time. */
  unpinMany: (ids: string[]) => void;
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

  const pinMany = (ids: string[]) => {
    setPinnedIds((prev) => {
      const next = [...prev];
      for (const id of ids) {
        if (next.includes(id) || next.length >= MAX_PINS) continue;
        next.push(id);
      }
      if (audioActiveId === null && next.length > 0) setAudioActiveId(next[0]);
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

  const unpinMany = (ids: string[]) => {
    setPinnedIds((prev) => {
      const next = prev.filter((p) => !ids.includes(p));
      if (audioActiveId && ids.includes(audioActiveId)) setAudioActiveId(next[0] ?? null);
      return next;
    });
  };

  const value = useMemo<PinnedStreamsContextValue>(
    () => ({
      pinnedIds,
      isPinned: (id) => pinnedIds.includes(id),
      togglePin,
      pinMany,
      unpin,
      unpinMany,
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
