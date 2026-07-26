import { useEffect, useRef, useState, type RefObject } from 'react';

/** Instant for demo purposes: a nudge should be there the moment a judge
 *  lands on Home, not after a real wait. A production build would set
 *  these back to something like 20s idle / 45s browsing. */
const IDLE_THRESHOLD_MS = 500;
const MAX_BROWSE_SESSION_MS = 500;
const CHECK_INTERVAL_MS = 250;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'wheel', 'touchstart'] as const;

function isDesktopViewport(): boolean {
  return window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches;
}

/** Home-page-only idle detector, shared by every "you're still deciding
 *  what to watch" nudge (Kick Expedition, Kick Boss) — both only make
 *  sense to surface while someone hasn't picked a stream yet, never once
 *  they're actually watching one. Kick Expedition is desktop-only per the
 *  brief, so this never fires below that viewport/pointer combination
 *  either, even though Kick Boss itself isn't desktop-restricted.
 *
 *  Only answers "has the viewer been on Home, undecided, long enough to
 *  nudge" — it doesn't own dismissal. Each nudge in `HomePage` tracks its
 *  own closed state per boss/expedition id instead, so closing one never
 *  hides the other. */
export function useIdleNudge(scrollRef: RefObject<HTMLElement | null>) {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const lastActivity = useRef(Date.now());
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (!isDesktopViewport()) return;

    const markActive = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));
    const scrollEl = scrollRef.current;
    scrollEl?.addEventListener('scroll', markActive, { passive: true });

    const check = () => {
      const now = Date.now();
      const idleFor = now - lastActivity.current;
      const browsingFor = now - mountedAt.current;
      if (idleFor >= IDLE_THRESHOLD_MS || browsingFor >= MAX_BROWSE_SESSION_MS) {
        setShouldPrompt(true);
      }
    };
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
      scrollEl?.removeEventListener('scroll', markActive);
      window.clearInterval(interval);
    };
  }, [scrollRef]);

  return { shouldPrompt };
}
