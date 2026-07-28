import { useEffect, useMemo, useRef, useState } from "react";
import type { Candidate } from "../mock/raids";

// Reel geometry and timing lifted from prototypes/hypeprops's RouletteOverlay crate reel:
// one avatar in focus under a center marker, a fast launch decaying into a slow tick. With no
// commitSlug it rolls ambient forever, re-picking a fresh random winner each lap. With a
// commitSlug (the raid's real, already-decided target) it spins to that seat once, holds, and
// calls onLanded — used both for the Random-mode dialog roll and the chat-side reveal.
const ITEM_W = 85;
const COPIES = 16;
const LANDING_COPY = COPIES - 3;
const SPIN_MS = 4200;
const SPIN_EASING = "cubic-bezier(0.08, 0.82, 0.17, 1)";
const LANDED_HOLD_MS = 900;
const MAX_VISIBLE = 7;
const VIEWPORT_FALLBACK = 280;

function buildReelStrip(list: Candidate[]) {
  const out: { candidate: Candidate; key: string }[] = [];
  for (let copy = 0; copy < COPIES; copy++) {
    for (const c of list) out.push({ candidate: c, key: `${c.stream.channel.slug}-${copy}` });
  }
  return out;
}

// Guarantees the real winner has a seat on the strip, same as the prototype's buildDisplayed,
// since a top-N snapshot of the pool might not include it.
function buildDisplayedWithWinner(pool: Candidate[], winnerSlug: string): Candidate[] {
  if (pool.length <= MAX_VISIBLE) return pool;
  const winner = pool.find((c) => c.stream.channel.slug === winnerSlug);
  if (!winner) return pool.slice(0, MAX_VISIBLE);
  const rest = pool.filter((c) => c.stream.channel.slug !== winnerSlug);
  return [winner, ...rest.slice(0, MAX_VISIBLE - 1)];
}

export function RouletteReel({
  candidates,
  commitSlug,
  onLanded,
}: {
  candidates: Candidate[];
  commitSlug?: string | null;
  onLanded?: () => void;
}) {
  const displayed = useMemo(
    () => (commitSlug ? buildDisplayedWithWinner(candidates, commitSlug) : candidates.slice(0, MAX_VISIBLE)),
    [candidates, commitSlug],
  );
  const reelItems = useMemo(() => buildReelStrip(displayed), [displayed]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [landingIdx, setLandingIdx] = useState(0);
  const [landed, setLanded] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (displayed.length === 0) return;
    setLanded(false);
    const winnerIdx = commitSlug
      ? Math.max(0, displayed.findIndex((c) => c.stream.channel.slug === commitSlug))
      : Math.floor(Math.random() * displayed.length);
    const flatIdx = LANDING_COPY * displayed.length + winnerIdx;
    setLandingIdx(flatIdx);
    const viewportWidth = viewportRef.current?.clientWidth ?? VIEWPORT_FALLBACK;
    const start = viewportWidth / 2 - 0.5 * ITEM_W;
    const target = viewportWidth / 2 - (flatIdx + 0.5) * ITEM_W;

    setAnimating(false);
    setOffset(start);
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setAnimating(true);
        setOffset(target);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayed, cycle, commitSlug]);

  useEffect(() => {
    if (!landed) return;
    if (commitSlug) {
      const t = setTimeout(() => onLanded?.(), LANDED_HOLD_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCycle((c) => c + 1), LANDED_HOLD_MS);
    return () => clearTimeout(t);
  }, [landed, commitSlug, onLanded]);

  if (displayed.length === 0) return null;

  return (
    <div
      ref={viewportRef}
      className="relative w-full shrink-0 overflow-hidden rounded-lg bg-surface-lowest py-3"
    >
      <div
        className="flex"
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? `transform ${SPIN_MS}ms ${SPIN_EASING}` : "none",
        }}
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform") setLanded(true);
        }}
      >
        {reelItems.map(({ candidate, key }, i) => (
          <div key={key} className="flex shrink-0 flex-col items-center gap-1" style={{ width: ITEM_W }}>
            <div
              className={`size-14 overflow-hidden rounded-full ring-2 transition-transform duration-200 ${
                landed && i === landingIdx ? "scale-110 ring-primary-base" : "ring-black/40"
              }`}
            >
              <img src={candidate.stream.channel.avatar} alt="" className="h-full w-full object-cover" />
            </div>
            <span className="max-w-[76px] truncate text-[11px] font-semibold leading-none text-white">
              {candidate.stream.channel.username}
            </span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-primary-base shadow-[0_0_6px_rgba(83,252,24,0.9)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface-lowest to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface-lowest to-transparent" />
    </div>
  );
}
