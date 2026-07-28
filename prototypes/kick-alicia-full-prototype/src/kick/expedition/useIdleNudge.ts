import { useEffect, useRef, useState } from "react";

/*
  Fast for demo purposes: a nudge should be there shortly after a judge lands on Home, not after
  a real wait. A production build would set these back to something like 20s idle / 45s
  browsing. Ported from kick-web-redesign's useIdleNudge.ts.
*/
const IDLE_THRESHOLD_MS = 2000;
const MAX_BROWSE_SESSION_MS = 4000;
const CHECK_INTERVAL_MS = 250;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "wheel", "touchstart"] as const;

function isDesktopViewport(): boolean {
  return window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
}

/*
  Home-page-only idle detector for the Kick Expedition nudge: it only makes sense to surface
  while someone hasn't picked a stream yet, never once they're actually watching one. Desktop
  only, matching the working agreement's own "Kick Expedition — desktop only" framing.
  `#main-container` is Layout.tsx's own scroll container (every page shares it), not a ref this
  hook needs threaded in from the page.
*/
export function useIdleNudge() {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const lastActivity = useRef(Date.now());
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (!isDesktopViewport()) return;

    const markActive = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));
    const scrollEl = document.getElementById("main-container");
    scrollEl?.addEventListener("scroll", markActive, { passive: true });

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
      scrollEl?.removeEventListener("scroll", markActive);
      window.clearInterval(interval);
    };
  }, []);

  return { shouldPrompt };
}
