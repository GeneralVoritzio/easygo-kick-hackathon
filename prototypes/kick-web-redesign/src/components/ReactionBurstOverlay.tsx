import { AnimatePresence, motion } from 'framer-motion';
import type { Firework, FloatingReaction } from '../hooks/useReactionBurst';

interface ReactionBurstOverlayProps {
  reactions: FloatingReaction[];
  fireworks?: Firework[];
}

/** Renders whatever `useReactionBurst` currently has in flight, rising up
 *  through the video from bottom-right and fading out — sits inside the
 *  video container as an `absolute inset-0` layer, above the stream but
 *  `pointer-events-none` so it never blocks the controls underneath.
 *
 *  Fireworks share the same anchor point as the bubbles (bottom-16
 *  right-12) but pop outward in a ring instead of drifting up, so a
 *  subscribe reads as a distinctly bigger moment. */
export function ReactionBurstOverlay({ reactions, fireworks = [] }: ReactionBurstOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            className={`absolute bottom-16 right-12 ${r.colorClass}`}
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.25, 1, 0.9], x: r.driftX, y: -220 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          >
            <r.Icon size={30} strokeWidth={2} fill="currentColor" />
          </motion.div>
        ))}
        {fireworks.map((f) => (
          <div key={f.id} className="absolute bottom-16 right-12">
            <motion.div
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-kick"
              initial={{ opacity: 1, scale: 0 }}
              animate={{ opacity: 0, scale: 3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
            {f.particles.map((p, i) => {
              const radians = (p.angle * Math.PI) / 180;
              const dx = Math.cos(radians) * p.distance;
              const dy = Math.sin(radians) * p.distance;
              return (
                <motion.span
                  key={i}
                  className={`absolute block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${p.colorClass}`}
                  style={{ backgroundColor: 'currentColor' }}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{ opacity: 0, x: dx, y: dy, scale: 0.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              );
            })}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
