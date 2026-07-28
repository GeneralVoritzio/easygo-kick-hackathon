import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export const MAX_PINS = 9;

type PinnedStreamsContextValue = {
  /** Channel slugs, our own routing key, in place of the source's opaque ids. */
  pinnedSlugs: string[];
  isPinned: (slug: string) => boolean;
  togglePin: (slug: string) => void;
  unpin: (slug: string) => void;
  /** Drops every pin at once — Multiview's "Unpin all". */
  clearPins: () => void;
  canPinMore: boolean;
  /** Which pinned stream currently has audio, across Multiview and the Expedition ride — only
   *  one at a time, same rule everywhere in the app. */
  audioActiveSlug: string | null;
  setAudioActiveSlug: (slug: string | null) => void;
};

const PinnedStreamsContext = createContext<PinnedStreamsContextValue | null>(null);

/*
  Pinned streams and which one has audio focus are global state — a pin made while browsing the
  homepage has to still be there once you get to Multiview, so this sits above the router
  (src/main.tsx), not inside a single page. Ported from kick-web-redesign's
  PinnedStreamsContext.tsx.
*/
export function PinnedStreamsProvider({ children }: { children: ReactNode }) {
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>([]);
  const [audioActiveSlug, setAudioActiveSlug] = useState<string | null>(null);

  const togglePin = useCallback(
    (slug: string) => {
      setPinnedSlugs((prev) => {
        if (prev.includes(slug)) {
          const next = prev.filter((p) => p !== slug);
          if (audioActiveSlug === slug) setAudioActiveSlug(next[0] ?? null);
          return next;
        }
        if (prev.length >= MAX_PINS) return prev;
        const next = [...prev, slug];
        if (audioActiveSlug === null) setAudioActiveSlug(slug);
        return next;
      });
    },
    [audioActiveSlug],
  );

  const unpin = useCallback(
    (slug: string) => {
      setPinnedSlugs((prev) => {
        const next = prev.filter((p) => p !== slug);
        if (audioActiveSlug === slug) setAudioActiveSlug(next[0] ?? null);
        return next;
      });
    },
    [audioActiveSlug],
  );

  const clearPins = useCallback(() => {
    setPinnedSlugs([]);
    setAudioActiveSlug(null);
  }, []);

  const value = useMemo<PinnedStreamsContextValue>(
    () => ({
      pinnedSlugs,
      isPinned: (slug) => pinnedSlugs.includes(slug),
      togglePin,
      unpin,
      clearPins,
      canPinMore: pinnedSlugs.length < MAX_PINS,
      audioActiveSlug,
      setAudioActiveSlug,
    }),
    [pinnedSlugs, audioActiveSlug, togglePin, unpin, clearPins],
  );

  return <PinnedStreamsContext.Provider value={value}>{children}</PinnedStreamsContext.Provider>;
}

export function usePinnedStreams(): PinnedStreamsContextValue {
  const ctx = useContext(PinnedStreamsContext);
  if (!ctx) throw new Error("usePinnedStreams must be used within PinnedStreamsProvider");
  return ctx;
}
