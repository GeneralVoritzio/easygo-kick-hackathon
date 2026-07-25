import { useEffect, useRef, useState } from 'react'
import { YOU_USER_ID, useInteraction } from '../engine/interactionStore'
import type { RouletteEntry, RouletteOutcome } from '../engine/roulette'

/** reel snapshot cap — guarantees the winner always has a seat on the strip */
const MAX_VISIBLE = 7
/** ambient marquee: visible-subset cap — never render the whole ~300-entry pool */
const MARQUEE_SUBSET = 12
/** ambient marquee tile width */
const MARQUEE_ITEM_W = 72
/** ambient marquee crawl speed, px per second */
const MARQUEE_SPEED = 35
/** half-strip must at least cover the card viewport for a seamless -50% loop */
const MARQUEE_MIN_BASE_PX = 360
/** reel viewport width before the ref has measured the mounted card */
const REEL_VIEWPORT_FALLBACK = 280
/** reel slot width: one avatar in focus at center, one peeking on either side */
const ITEM_W = 85
/** crate-opening cadence: fast launch, long decelerating tick onto the winner */
const SPIN_MS = 4200
const SPIN_EASING = 'cubic-bezier(0.08, 0.82, 0.17, 1)'
/** how many times the pool repeats along the reel strip — the spin never runs out of road */
const REEL_COPIES = 16
/** land a few copies before the strip's end so there's always run-up past the marker */
const REEL_LANDING_COPY = REEL_COPIES - 3
/** pause on the landed winner before handing off to the accept/decline body */
const LANDED_HOLD_MS = 650

const TOAST_COPY: Record<RouletteOutcome, string> = {
  accepted_done: 'dare done ✅ — acknowledged',
  accepted_not_done: 'not done — still counts as engagement',
  declined: 'declined — still counts as engagement',
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** DiceBear avatars, keyed by the stable user id — no npm dep, just an <img src> */
const DICEBEAR_STYLE = 'pixel-art'
function avatarUrl(user_id: string): string {
  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(user_id)}`
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** chunky stepped pixel L-bracket — one corner of the card's viewfinder frame */
function PixelCorner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M0 0h9v3H3v6H0z" />
      <rect x="5" y="5" width="3" height="3" />
    </svg>
  )
}

/** four pixel brackets framing the card, overlapping its edge by ~4px */
function PixelFrame() {
  return (
    <>
      <PixelCorner className="absolute -left-1 -top-1 h-5 w-5 text-kick" />
      <PixelCorner className="absolute -right-1 -top-1 h-5 w-5 rotate-90 text-kick" />
      <PixelCorner className="absolute -bottom-1 -right-1 h-5 w-5 rotate-180 text-kick" />
      <PixelCorner className="absolute -bottom-1 -left-1 h-5 w-5 -rotate-90 text-kick" />
    </>
  )
}

/** cap the pool snapshot, guaranteeing the winner has a seat on the reel */
function buildDisplayed(pool: RouletteEntry[], winner: RouletteEntry | null): RouletteEntry[] {
  if (pool.length <= MAX_VISIBLE) return pool
  if (!winner) return pool.slice(0, MAX_VISIBLE)
  const rest = pool.filter((e) => e.user_id !== winner.user_id)
  return [winner, ...rest.slice(0, MAX_VISIBLE - 1)]
}

/** repeat the pool end-to-end into one long crate strip */
function buildReel(list: RouletteEntry[]): { entry: RouletteEntry; key: string }[] {
  const out: { entry: RouletteEntry; key: string }[] = []
  for (let copy = 0; copy < REEL_COPIES; copy++) {
    for (const entry of list) out.push({ entry, key: `${entry.user_id}-${copy}` })
  }
  return out
}

/**
 * Ambient marquee base strip: a rotating ≤12-entry subset of the pool, repeated
 * until the half-strip covers the card viewport so the 0 → -50% loop is seamless.
 * The caller renders this base twice.
 */
function buildMarqueeBase(pool: RouletteEntry[], offset: number): { entry: RouletteEntry; key: string }[] {
  if (pool.length === 0) return []
  const start = offset % pool.length
  const subset: RouletteEntry[] = []
  for (let i = 0; i < Math.min(MARQUEE_SUBSET, pool.length); i++) {
    subset.push(pool[(start + i) % pool.length])
  }
  const out: { entry: RouletteEntry; key: string }[] = []
  let copy = 0
  while (out.length * MARQUEE_ITEM_W < MARQUEE_MIN_BASE_PX) {
    for (const entry of subset) out.push({ entry, key: `${entry.user_id}-mq${copy}` })
    copy++
  }
  return out
}

function MarqueeTile({ entry }: { entry: RouletteEntry }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1" style={{ width: MARQUEE_ITEM_W }}>
      <div
        className="h-12 w-12 overflow-hidden rounded-lg bg-kick-panel ring-1 ring-black/40"
        style={{ backgroundColor: entry.color }}
      >
        <img src={avatarUrl(entry.user_id)} alt="" className="h-full w-full object-cover" />
      </div>
      <span className="max-w-[64px] truncate text-[9px] leading-none text-kick-muted">{entry.username}</span>
    </div>
  )
}

/**
 * Interaction Roulette — a Kick "Drops campaign"-style card pinned at the top
 * of chat, collapsible, coherent with the rest of the platform chrome. The
 * spin phase reuses the existing CSGO-crate reel: one avatar in focus under a
 * center marker, neighbors peeking at either side, a fast launch decaying
 * into a slow tick that lands on the winner — then accept/decline and
 * verification take over the card body.
 */
export default function RouletteOverlay() {
  const phase = useInteraction((s) => s.phase)
  const pool = useInteraction((s) => s.pool)
  const roundEndsAt = useInteraction((s) => s.roundEndsAt)
  const roundLengthSec = useInteraction((s) => s.roundLengthSec)
  const filteredCount = useInteraction((s) => s.filteredCount)
  const drawn = useInteraction((s) => s.drawn)
  const lastOutcome = useInteraction((s) => s.lastOutcome)
  const yourOdds = useInteraction((s) => s.yourOdds)
  const spinNow = useInteraction((s) => s.spinNow)
  const finishSpin = useInteraction((s) => s.finishSpin)
  const acceptDare = useInteraction((s) => s.acceptDare)
  const declineDare = useInteraction((s) => s.declineDare)
  const verifyDare = useInteraction((s) => s.verifyDare)

  const [collapsed, setCollapsed] = useState(false)

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // reel snapshot — taken once per spin, immune to pool churn mid-spin
  const [displayed, setDisplayed] = useState<RouletteEntry[]>([])
  const reelViewportRef = useRef<HTMLDivElement>(null)
  const [reelOffset, setReelOffset] = useState(0)
  const [reelAnimating, setReelAnimating] = useState(false)
  const [landingIdx, setLandingIdx] = useState(0)
  const [landed, setLanded] = useState(false)

  useEffect(() => {
    if (phase !== 'spinning') return
    const { pool: snapshotPool, drawn: winner } = useInteraction.getState()
    const list = buildDisplayed(snapshotPool, winner)
    setDisplayed(list)
    setLanded(false)
    if (list.length === 0) {
      finishSpin()
      return
    }
    const winnerIdx = Math.max(0, winner ? list.findIndex((e) => e.user_id === winner.user_id) : 0)
    const flatIdx = REEL_LANDING_COPY * list.length + winnerIdx
    setLandingIdx(flatIdx)
    const viewportWidth = reelViewportRef.current?.clientWidth ?? REEL_VIEWPORT_FALLBACK
    const start = viewportWidth / 2 - 0.5 * ITEM_W
    const target = viewportWidth / 2 - (flatIdx + 0.5) * ITEM_W

    setReelAnimating(false)
    setReelOffset(start)
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setReelAnimating(true)
        setReelOffset(target)
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [phase, finishSpin])

  // hold on the landed winner for a beat, then hand off to the accept/decline body
  useEffect(() => {
    if (!landed) return
    const t = setTimeout(() => finishSpin(), LANDED_HOLD_MS)
    return () => clearTimeout(t)
  }, [landed, finishSpin])

  // outcome line, fired inline in the collecting body on the transition back into it;
  // each new round also rotates which pool subset the ambient marquee shows
  const [toast, setToast] = useState<RouletteOutcome | null>(null)
  const [marqueeOffset, setMarqueeOffset] = useState(0)
  const prevPhase = useRef(phase)
  useEffect(() => {
    const came = prevPhase.current
    prevPhase.current = phase
    if (came === 'collecting' || phase !== 'collecting') return
    setMarqueeOffset((o) => o + MARQUEE_SUBSET)
    if (lastOutcome) setToast(lastOutcome)
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [phase, lastOutcome])

  const myOdds = yourOdds(YOU_USER_ID)
  const reelItems = phase === 'spinning' ? buildReel(displayed) : []

  const marqueeBase = phase === 'collecting' ? buildMarqueeBase(pool, marqueeOffset) : []
  const marqueeDurationSec = (marqueeBase.length * MARQUEE_ITEM_W) / MARQUEE_SPEED

  const subtitle =
    phase === 'collecting'
      ? `${pool.length} dares in the pool`
      : phase === 'spinning'
        ? 'spinning…'
        : phase === 'presenting' && drawn
          ? `@${drawn.username} drew the dare`
          : phase === 'verifying' && drawn
            ? `waiting on @${drawn.username}`
            : ''

  const progressPct =
    phase === 'collecting'
      ? Math.max(0, Math.min(100, ((roundEndsAt - now) / (roundLengthSec * 1000)) * 100))
      : 100

  return (
    <div className="animate-slide-up relative overflow-visible border border-kick-border bg-kick-panel-2">
      <PixelFrame />

      {/* header — always visible */}
      <div className="flex items-center gap-2 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kick">
          <span className="text-[15px] font-black leading-none text-black">K</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold leading-tight text-kick-text">Interaction Roulette</div>
          <div className="truncate text-[12px] leading-tight text-kick-muted">{subtitle}</div>
        </div>
        <button
          type="button"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 rounded p-0.5 text-kick-muted transition-colors hover:text-kick-text"
        >
          <ChevronIcon className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-3.5 pt-0">
          {phase === 'collecting' &&
            (toast ? (
              <div className="py-2 text-center text-[12px] font-semibold text-kick-text">{TOAST_COPY[toast]}</div>
            ) : (
              <>
                <div className="text-[13px] font-bold text-kick-text">How to enter</div>
                <p className="mt-1 text-[12px] leading-snug text-kick-muted">
                  Type <span className="text-kick-text">/interact &lt;dare&gt;</span> in chat — one live entry per
                  person. Waiting rounds boost your odds.
                </p>

                {/* ambient reel: the pool slowly turning under the fixed center pointer —
                    a ≤12-entry subset duplicated twice, 0 → -50% linear loop at ~35px/s */}
                <div className="relative mt-3 overflow-hidden py-1">
                  {marqueeBase.length === 0 ? (
                    <div className="py-3 text-center text-[11px] text-kick-muted">waiting for entries…</div>
                  ) : (
                    <>
                      <style>{`@keyframes roulette-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
                      <div
                        className="flex w-max"
                        style={{ animation: `roulette-marquee ${marqueeDurationSec}s linear infinite` }}
                      >
                        {marqueeBase.map(({ entry, key }) => (
                          <MarqueeTile key={`${key}-a`} entry={entry} />
                        ))}
                        {marqueeBase.map(({ entry, key }) => (
                          <MarqueeTile key={`${key}-b`} entry={entry} />
                        ))}
                      </div>
                      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-kick shadow-[0_0_6px_rgba(83,252,24,0.9)]" />
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-kick-panel-2 to-transparent" />
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-kick-panel-2 to-transparent" />
                    </>
                  )}
                </div>

                <div className="mt-3 text-[12px] font-semibold leading-snug">
                  {myOdds !== null ? (
                    <span className="text-kick">
                      You're in! <span className="font-mono font-bold">1 in {myOdds}</span> this round
                    </span>
                  ) : (
                    <span className="text-kick-muted">You haven't entered yet</span>
                  )}
                </div>

                {filteredCount > 0 && (
                  <div className="mt-1 text-[11px] text-kick-muted">🛡 {filteredCount} filtered on arrival</div>
                )}

                <div className="mt-2 flex items-center gap-1.5 text-[12px] text-kick-muted">
                  <span aria-hidden="true">🕐</span>
                  Pool closes in{' '}
                  <span className="font-mono font-bold text-kick-text">{formatCountdown(roundEndsAt - now)}</span>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-kick-muted transition-colors hover:bg-white/5"
                  >
                    Dismiss
                  </button>
                  {pool.length > 0 && (
                    <button
                      type="button"
                      onClick={spinNow}
                      className="rounded-lg bg-kick px-3 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-kick-dim"
                    >
                      Spin now
                    </button>
                  )}
                </div>
              </>
            ))}

          {phase === 'spinning' && (
            <div className="flex flex-col gap-2 py-1">
              <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-kick-muted">
                Rolling…
              </span>

              {/* crate reel: strip scrolls under a fixed center marker */}
              <div ref={reelViewportRef} className="relative w-full overflow-hidden py-2">
                <div
                  className="flex"
                  style={{
                    transform: `translateX(${reelOffset}px)`,
                    transition: reelAnimating ? `transform ${SPIN_MS}ms ${SPIN_EASING}` : 'none',
                  }}
                  onTransitionEnd={(e) => {
                    if (e.propertyName === 'transform') setLanded(true)
                  }}
                >
                  {reelItems.map(({ entry, key }, i) => (
                    <div key={key} className="flex shrink-0 flex-col items-center gap-1" style={{ width: ITEM_W }}>
                      <div
                        className={`h-14 w-14 overflow-hidden rounded-full ring-2 transition-transform duration-200 ${
                          landed && i === landingIdx ? 'scale-110 ring-kick' : 'ring-black/40'
                        }`}
                        style={{ backgroundColor: entry.color }}
                      >
                        <img src={avatarUrl(entry.user_id)} alt="" className="h-full w-full object-cover" />
                      </div>
                      <span className="max-w-[76px] truncate text-[10px] font-semibold leading-[1.1] text-kick-text">
                        {entry.username}
                      </span>
                    </div>
                  ))}
                </div>

                {/* center marker + edge fades keep exactly one avatar in focus */}
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-kick shadow-[0_0_6px_rgba(83,252,24,0.9)]" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-kick-panel-2 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-kick-panel-2 to-transparent" />
              </div>

              <span className="text-center text-[10px] text-kick-muted">who's it gonna be?</span>
            </div>
          )}

          {phase === 'presenting' && drawn && (
            <div className="py-1">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-kick"
                  style={{ backgroundColor: drawn.color }}
                >
                  <img src={avatarUrl(drawn.user_id)} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-kick">@{drawn.username}</div>
                  <div className="text-[13px] leading-snug text-kick-text">{drawn.text}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-kick-muted">declining is free — engagement is the metric</div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={declineDare}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-kick-muted transition-colors hover:bg-white/5"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={acceptDare}
                  className="rounded-lg bg-kick px-3 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-kick-dim"
                >
                  Accept
                </button>
              </div>
            </div>
          )}

          {phase === 'verifying' && drawn && (
            <div className="py-1">
              <div className="text-[13px] font-semibold text-kick-text">@{drawn.username} — did it happen?</div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => verifyDare(false)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-kick-muted transition-colors hover:bg-white/5"
                >
                  Not done
                </button>
                <button
                  type="button"
                  onClick={() => verifyDare(true)}
                  className="rounded-lg bg-kick px-3 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-kick-dim"
                >
                  Done ✅
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* progress bar — round-time-remaining while collecting, full otherwise.
          Isolated overflow-hidden wrapper so the bar clips cleanly while the
          card itself stays overflow-visible for the pixel corner brackets. */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden">
        <div className="h-full bg-kick transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  )
}
