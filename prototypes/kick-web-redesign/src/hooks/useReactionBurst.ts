import { useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FloatingReaction {
  id: number;
  Icon: LucideIcon;
  colorClass: string;
  driftX: number;
}

export interface FireworkParticle {
  angle: number;
  distance: number;
  colorClass: string;
}

export interface Firework {
  id: number;
  particles: FireworkParticle[];
}

const REACTION_LIFETIME_MS = 1300;
const FIREWORK_LIFETIME_MS = 700;
const FIREWORK_PARTICLE_COUNT = 12;
const FIREWORK_COLORS = ['text-kick', 'text-live', 'text-info', 'text-ink-bright'];

/** One burst per tap, TikTok-style: a small icon spawns near the bottom of
 *  the video and floats up with a little sideways drift, fading out —
 *  "when someone likes a stream, a heart bubbles up." Used for Like,
 *  Follow, Donate and Share alike, just with a different icon and color
 *  each time; `<ReactionBurstOverlay>` renders whatever's currently in
 *  `reactions`.
 *
 *  Subscribing gets its own, bigger moment instead: `spawnFirework` pops a
 *  ring of colored sparks outward from the same spot rather than one icon
 *  drifting up, since becoming a subscriber is a bigger commitment than a
 *  like or a follow. */
export function useReactionBurst() {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const nextIdRef = useRef(0);
  const nextFireworkIdRef = useRef(0);

  const spawnReaction = (Icon: LucideIcon, colorClass = 'text-kick') => {
    const id = nextIdRef.current++;
    const driftX = Math.random() * 56 - 28;
    setReactions((prev) => [...prev, { id, Icon, colorClass, driftX }]);
    window.setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, REACTION_LIFETIME_MS);
  };

  const spawnFirework = () => {
    const id = nextFireworkIdRef.current++;
    const particles = Array.from({ length: FIREWORK_PARTICLE_COUNT }, (_, i) => ({
      angle: (360 / FIREWORK_PARTICLE_COUNT) * i + (Math.random() * 20 - 10),
      distance: 36 + Math.random() * 30,
      colorClass: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
    }));
    setFireworks((prev) => [...prev, { id, particles }]);
    window.setTimeout(() => {
      setFireworks((prev) => prev.filter((f) => f.id !== id));
    }, FIREWORK_LIFETIME_MS);
  };

  return { reactions, spawnReaction, fireworks, spawnFirework };
}
