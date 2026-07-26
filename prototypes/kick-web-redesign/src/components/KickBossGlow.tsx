interface KickBossGlowProps {
  /** 'active': the fight is on, calm red pulse. 'critical': HP below 25%,
   *  bigger and faster. 'victory': just defeated, green instead of red. */
  variant: 'active' | 'critical' | 'victory';
}

const ANIMATION_CLASS: Record<KickBossGlowProps['variant'], string> = {
  active: 'animate-boss-glow',
  critical: 'animate-boss-glow-critical',
  victory: 'animate-boss-glow-victory',
};

/** The same full-screen red glow this environment shows while an agent is
 *  actively driving the browser — reused here so a Kick Boss reads as
 *  "something urgent is happening on this screen" the same way. Fixed to
 *  the viewport, not the video, since a limited-time world event is bigger
 *  than any one element on the page; `pointer-events-none` so it never
 *  blocks the fight controls it's announcing. */
export function KickBossGlow({ variant }: KickBossGlowProps) {
  return <div aria-hidden className={`pointer-events-none fixed inset-0 z-30 ${ANIMATION_CLASS[variant]}`} />;
}
