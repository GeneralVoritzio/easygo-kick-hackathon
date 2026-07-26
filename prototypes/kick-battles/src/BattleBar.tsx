import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import type { BattleSide } from '@shared/types';
import type { BattleEvent } from '@shared/hooks/useBattle';
import type { ScoreSnapshot } from './useScoreHistory';
import { ContributionLabel } from './ContributionLabel';
import { gradientForPlacement, glowForPlacement, textIsLightForPlacement } from './palette';

interface BattleBarProps {
  sides: BattleSide[];
  order: string[];
  percents: Record<string, number>;
  leaderId: string | null;
  isClose: boolean;
  isBlowout: boolean;
  glowDurationSec: number;
  comebackPulseKey: number;
  finalStretch: boolean;
  events: BattleEvent[];
  ghostSnapshot: ScoreSnapshot | null;
}

const SEGMENT_SKEW_DEG = -12;

function cumulativeBefore(sideId: string, order: string[], source: Record<string, number>): number {
  let sum = 0;
  for (const id of order) {
    if (id === sideId) break;
    sum += source[id] ?? 0;
  }
  return sum;
}

function sideTotal(side: BattleSide): number {
  return side.streamers.reduce((sum, s) => sum + s.score, 0);
}

function findSideForStreamer(sides: BattleSide[], streamerId: string): BattleSide | undefined {
  return sides.find((side) => side.streamers.some((s) => s.streamerId === streamerId));
}

/** The segmented share-of-total bar. Each segment is a "side" — a solo
 *  streamer or a team whose members' scores are summed — rendered as a
 *  skewed chevron (an inner counter-skewed wrapper keeps its text upright)
 *  with a metallic gold/silver/bronze/gunmetal gradient fill keyed to
 *  current standing (not a fixed team position) and a glowing top edge.
 *  No border or backing fill on the outer frame — the segments' own
 *  gradients are the only visible surface, so nothing shows through the
 *  skewed ends. Spring-animated widths, a 30s-ago ghost boundary, flying
 *  contribution labels with an on-impact bump, a periodic light-sweep, and
 *  glow / blowout / comeback-shake states on top. */
export function BattleBar({
  sides,
  order,
  percents,
  leaderId,
  isClose,
  isBlowout,
  glowDurationSec,
  comebackPulseKey,
  finalStretch,
  events,
  ghostSnapshot,
}: BattleBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mountedRef = useRef(false);

  const byId = new Map(sides.map((s) => [s.sideId, s]));

  // Gold/silver/bronze/gunmetal track current standing, not a fixed team
  // position — recomputed every render so a segment's color updates live
  // as the lead changes.
  const totalsById = new Map(sides.map((s) => [s.sideId, sideTotal(s)]));
  const placementOrder = [...order].sort((a, b) => (totalsById.get(b) ?? 0) - (totalsById.get(a) ?? 0));
  const placementById = new Map(placementOrder.map((id, i) => [id, i]));

  const handleImpact = (streamerId: string) => {
    const side = findSideForStreamer(sides, streamerId);
    const el = side && segmentRefs.current[side.sideId];
    if (!el) return;
    animate(
      el,
      { scale: [1, 1.08, 1], filter: ['brightness(1)', 'brightness(1.7)', 'brightness(1)'] },
      { duration: 0.35, ease: 'easeOut' }
    );
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (comebackPulseKey === 0) return;
    if (barRef.current) {
      animate(barRef.current, { x: [0, -7, 6, -5, 3, 0] }, { duration: finalStretch ? 0.32 : 0.5, ease: 'easeInOut' });
    }
    if (flashRef.current) {
      animate(flashRef.current, { opacity: [0, 1, 0] }, { duration: finalStretch ? 0.6 : 0.9, ease: 'easeOut' });
    }
  }, [comebackPulseKey, finalStretch]);

  const effectiveGlowDuration = finalStretch ? glowDurationSec * 0.55 : glowDurationSec;

  return (
    <div className="w-[min(92vw,640px)]">
      <motion.div
        ref={barRef}
        className="relative"
        animate={
          isClose
            ? {
                boxShadow: [
                  '0 0 0px 0px rgba(83,252,24,0)',
                  '0 0 18px 3px rgba(83,252,24,0.35)',
                  '0 0 0px 0px rgba(83,252,24,0)',
                ],
              }
            : isBlowout
              ? { boxShadow: '0 0 16px 3px rgba(255,176,32,0.25)' }
              : { boxShadow: '0 0 0px 0px rgba(0,0,0,0)' }
        }
        transition={isClose ? { duration: effectiveGlowDuration, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      >
        <div className="relative flex h-12 w-full overflow-hidden">
          {order.map((id) => {
            const side = byId.get(id);
            if (!side) return null;
            const pct = percents[id] ?? 0;
            const placement = placementById.get(id) ?? 0;
            const gradient = gradientForPlacement(placement, id, isBlowout, leaderId);
            const glow = glowForPlacement(placement, id, isBlowout, leaderId);
            const textLight = textIsLightForPlacement(placement, isBlowout, id, leaderId);
            const isTeam = side.streamers.length > 1;

            return (
              <motion.div
                key={id}
                ref={(el) => {
                  segmentRefs.current[id] = el;
                }}
                className="relative h-full"
                style={{
                  background: gradient,
                  flexGrow: 0,
                  flexShrink: 0,
                  skewX: SEGMENT_SKEW_DEG,
                }}
                animate={{ flexBasis: `${pct}%` }}
                transition={{ type: 'spring', bounce: 0.35, duration: 0.7 }}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: glow, boxShadow: `0 0 8px 1px ${glow}` }}
                />

                <div
                  className="flex h-full flex-col items-center justify-center overflow-hidden"
                  style={{ transform: `skewX(${-SEGMENT_SKEW_DEG}deg)` }}
                >
                  {pct > 14 ? (
                    <>
                      <span
                        className={`truncate px-2 text-[11px] font-bold uppercase leading-tight tracking-wide ${
                          textLight ? 'text-ink-bright' : 'text-page/85'
                        }`}
                      >
                        {side.name}
                      </span>
                      <span
                        className={`tabular truncate px-2 font-mono text-[11px] leading-tight ${
                          textLight ? 'text-ink-bright/90' : 'text-page/70'
                        }`}
                      >
                        {Math.round(sideTotal(side)).toLocaleString()}
                      </span>
                      {isTeam && pct > 24 && (
                        <span
                          className={`truncate px-2 text-[9px] font-semibold leading-tight opacity-80 ${
                            textLight ? 'text-ink-bright' : 'text-page/85'
                          }`}
                        >
                          {side.streamers.map((s) => s.name).join(' + ')}
                        </span>
                      )}
                    </>
                  ) : pct > 6 ? (
                    <span
                      className={`tabular font-mono text-[10px] font-bold ${textLight ? 'text-ink-bright' : 'text-page/85'}`}
                    >
                      {Math.round(sideTotal(side)).toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </motion.div>
            );
          })}

          <motion.div
            className="pointer-events-none absolute inset-y-0 w-1/4"
            style={{ background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.4), transparent)' }}
            initial={{ left: '-30%', opacity: 0 }}
            animate={{ left: ['-30%', '130%'], opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 4.5, ease: 'easeInOut' }}
          />
        </div>

        {ghostSnapshot &&
          order.slice(0, -1).map((id, idx) => {
            const cum = cumulativeBefore(order[idx + 1], order, ghostSnapshot.percents);
            return (
              <motion.div
                key={`ghost-${id}`}
                className="absolute top-0 h-12 w-[2px] bg-ink-bright/50"
                initial={{ left: `${cum}%`, opacity: 0.5 }}
                animate={{ left: `${cum}%`, opacity: [0.5, 0.2, 0.5] }}
                transition={{
                  left: { type: 'spring', bounce: 0.2, duration: 1 },
                  opacity: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                }}
              />
            );
          })}

        <div
          ref={flashRef}
          className="pointer-events-none absolute inset-[-8px] rounded-full opacity-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,214,0,0.55), transparent 70%)' }}
        />

        <AnimatePresence>
          {events.map((event) => {
            const side = findSideForStreamer(sides, event.streamerId);
            if (!side) return null;
            const before = cumulativeBefore(side.sideId, order, percents);
            const segPct = percents[side.sideId] ?? 0;
            const left = before + segPct / 2;
            const glow = glowForPlacement(placementById.get(side.sideId) ?? 0, side.sideId, isBlowout, leaderId);
            const targetStreamer = side.streamers.find((s) => s.streamerId === event.streamerId);
            const targetLabel = side.streamers.length > 1 ? targetStreamer?.name : undefined;
            return (
              <ContributionLabel
                key={event.id}
                event={event}
                leftPercent={left}
                color={glow}
                targetLabel={targetLabel}
                onLanded={handleImpact}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isBlowout && leaderId && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1 text-right"
          >
            <span
              className="inline-block rounded-md border bg-page/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
              style={{ borderColor: `${glowForPlacement(0, leaderId, false, leaderId)}4D`, color: glowForPlacement(0, leaderId, false, leaderId) }}
            >
              {byId.get(leaderId)?.name} is dominating
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
