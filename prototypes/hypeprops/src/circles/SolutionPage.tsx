import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import kickLogo from '../assets/kick-logo.svg'

/**
 * KICK Circles — 2-minute solution deck (hackathon deliverable #1).
 * 8 slides ≈ 15 seconds each. ← → / space / click to navigate.
 */

const BADGES = [
  { pct: 'Top 1%', label: 'OG', icon: '👑', cls: 'text-yellow-400 border-yellow-400/50' },
  { pct: 'Top 5%', label: 'Inner', icon: '★', cls: 'text-kick border-kick/60' },
  { pct: 'Top 10%', label: 'Core', icon: '◆', cls: 'text-kick border-kick/40' },
  { pct: 'Top 20%', label: 'Regular', icon: '●', cls: 'text-kick-text border-kick-border' },
]

function OrbitSketch() {
  return (
    <svg viewBox="0 0 320 190" className="mx-auto w-full max-w-sm" aria-label="orbit map sketch">
      <circle cx="160" cy="95" r="80" fill="none" stroke="#2a2a2a" strokeDasharray="3 5" />
      <circle cx="160" cy="95" r="48" fill="none" stroke="#2a2a2a" strokeDasharray="3 5" />
      <circle cx="160" cy="95" r="15" fill="#53fc18" />
      <text x="160" y="99" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0b0b0b">YOU</text>
      <circle cx="112" cy="60" r="20" fill="#161616" stroke="#53fc18" strokeWidth="2" />
      <text x="112" y="57" textAnchor="middle" fontSize="7.5" fill="#f5f5f5">IRL Chaos</text>
      <text x="112" y="68" textAnchor="middle" fontSize="7" fill="#53fc18">● LIVE · 92°</text>
      <circle cx="230" cy="116" r="16" fill="#161616" stroke="#2a2a2a" strokeWidth="1.5" />
      <text x="230" y="114" textAnchor="middle" fontSize="7.5" fill="#f5f5f5">Late Night</text>
      <text x="230" y="124" textAnchor="middle" fontSize="7" fill="#a3a3a3">quiet · 31°</text>
      <circle cx="180" cy="25" r="13" fill="#161616" stroke="#2a2a2a" strokeWidth="1.5" />
      <text x="180" y="23" textAnchor="middle" fontSize="7" fill="#f5f5f5">Clip Hunters</text>
      <text x="180" y="32" textAnchor="middle" fontSize="6.5" fill="#a3a3a3">57°</text>
    </svg>
  )
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-6 text-3xl font-black md:text-4xl">{children}</h2>
)

const SLIDES: React.ReactNode[] = [
  // 1 · title
  <div key="s1" className="text-center">
    <img src={kickLogo} alt="Kick" className="mx-auto mb-8 h-8 w-auto" />
    <h1 className="text-6xl font-black md:text-7xl">Circles</h1>
    <p className="mt-4 text-2xl font-bold text-kick md:text-3xl">Crews for the couch.</p>
    <p className="mx-auto mt-6 max-w-xl text-lg text-kick-text/85">
      Turn shared watch behaviour into crews that light up when their creators do.
    </p>
    <p className="mt-8 text-xs text-kick-muted">Easygo Mini Hackathon · powered by KICK · 1 Aug 2026</p>
  </div>,

  // 2 · what it is
  <div key="s2">
    <H>A Circle is a living crew</H>
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ['EARNED', 'No join button. Your watch behaviour qualifies you in — anyone can lurk, status must be earned.'],
        ['ALIVE', 'Every Circle has Heat: live creators + chat energy. Circles activate, peak, and cool like the streams they orbit.'],
        ['PAYS BACK', 'Showing up while it’s hot earns score, live rank badges, and collectibles — identity you’d lose by leaving.'],
      ].map(([t, d]) => (
        <div key={t} className="rounded-xl bg-kick-panel p-5">
          <div className="mb-2 text-sm font-black tracking-widest text-kick">{t}</div>
          <p className="text-[14px] leading-relaxed text-kick-text/85">{d}</p>
        </div>
      ))}
    </div>
  </div>,

  // 3 · signals
  <div key="s3">
    <H>Real signals, real pipes</H>
    <div className="space-y-2.5 text-[15px]">
      {[
        ['Co-watch minutes', 'watch telemetry (dummy in prototype)'],
        ['Follows', 'channel.followed webhook'],
        ['Chat participation', 'chat.message.sent webhook'],
        ['Tips & loyalty', 'kicks.gifted · channel.subscription.*'],
        ['Liveness & heat', 'livestream.status.updated · GET /public/v2/livestreams'],
      ].map(([s, src]) => (
        <div key={s} className="flex items-baseline justify-between gap-4 rounded-lg bg-kick-panel px-4 py-2.5">
          <span className="font-semibold">{s}</span>
          <span className="font-mono text-[12px] text-kick-muted">{src}</span>
        </div>
      ))}
    </div>
    <p className="mt-4 text-[12px] text-kick-muted">
      Every pipe verified against the docs — full inventory in <code className="text-kick">.claude/KICK-API-MAP.md</code>
    </p>
  </div>,

  // 4 · detection
  <div key="s4">
    <H>Detection: the co-watch graph</H>
    <ol className="list-decimal space-y-3 pl-6 text-lg">
      <li>Creators are nodes; edges = shared audience minutes, decayed over 30 days.</li>
      <li>Stable clusters of ≥3 creators become Circles — auto-named from tags + chat culture.</li>
      <li>
        Cross your personal affinity threshold and Kick nudges:{' '}
        <em className="text-kick">“You’re 82% into IRL Chaos Circle.”</em>
      </li>
    </ol>
    <p className="mt-6 text-[14px] text-kick-muted">
      Privacy floor: a Circle needs ≥500 attached viewers to exist — aggregates, never surveillance.
    </p>
  </div>,

  // 5 · score + live badges
  <div key="s5">
    <H>Circle Score — live rank, live badge</H>
    <div className="rounded-xl bg-kick-panel p-4 font-mono text-[14px]">
      score = watch_minutes·1 + chat·2 + active_attendance·5 + streak·10
      <div className="mt-1 text-kick">− 10% decay, every day</div>
    </div>
    <div className="mt-5 flex flex-wrap gap-3">
      {BADGES.map((b) => (
        <div key={b.label} className={`flex items-center gap-2 rounded-lg border bg-kick-panel px-4 py-2.5 ${b.cls}`}>
          <span className="text-lg">{b.icon}</span>
          <span className="font-bold">{b.label}</span>
          <span className="text-[12px] text-kick-muted">{b.pct}</span>
        </div>
      ))}
    </div>
    <p className="mt-5 text-lg">
      Badges are <strong className="text-kick">percentiles, computed live</strong> — your next chat message
      wears your new rank. Up <em>or</em> down.
    </p>
  </div>,

  // 6 · journey
  <div key="s6">
    <H>The journey</H>
    <OrbitSketch />
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg">
      <li>Nudge: “You’re 82% in.”</li>
      <li>My Circles: an orbit map — affinity is distance, Heat is glow.</li>
      <li>Show up while it’s hot → score, streak, this week’s collectible.</li>
    </ol>
  </div>,

  // 7 · return loop + safety
  <div key="s7" className="grid gap-6 md:grid-cols-2">
    <div>
      <H>Why they return</H>
      <ul className="list-disc space-y-2 pl-5 text-[15px]">
        <li>Notifications only when the Circle <strong>activates</strong> — a doorbell, not a digest.</li>
        <li>Daily decay + streaks: your badge is always a few quiet days from gone.</li>
        <li>Visible Heat — you can see the party you’re missing.</li>
        <li>Weekly leaderboard resets with collectible drops.</li>
      </ul>
    </div>
    <div>
      <H>Why it’s safe</H>
      <ul className="list-disc space-y-2 pl-5 text-[15px]">
        <li>≥500-viewer aggregate floor · one-tap opt-out.</li>
        <li>Circle chat inherits creators’ mod lists (Moderation API).</li>
        <li>Caps + server-side signals + daily decay kill farming.</li>
        <li>18+ categories age-gated, excluded from reward drops.</li>
      </ul>
    </div>
  </div>,

  // 8 · metrics + prototype
  <div key="s8">
    <H>How we’d know it works</H>
    <p className="text-xl">
      <span className="font-black text-kick">Primary:</span> weekly return rate of users following ≥1
      Circle vs. matched non-followers.
    </p>
    <p className="mt-3 text-[14px] text-kick-muted">
      Guardrails: notification open + opt-out rates · report rate per Circle · score-decay churn.
    </p>
    <div className="mt-8 rounded-xl border border-kick/40 bg-kick-panel p-5">
      <div className="text-sm font-black tracking-widest text-kick">LIVE PROTOTYPE</div>
      <p className="mt-2 text-[15px]">
        <Link to="/circles" className="font-bold text-kick underline underline-offset-4">/circles</Link> — the
        orbit map, Circle detail, live percentile badges and decaying score, running on this repo’s
        tested engine. Dummy data, real system.
      </p>
    </div>
  </div>,
]

export default function SolutionPage() {
  const [i, setI] = useState(0)
  const go = useCallback((d: number) => setI((v) => Math.max(0, Math.min(SLIDES.length - 1, v + d))), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  return (
    <div className="flex h-screen flex-col bg-kick-dark text-kick-text select-none">
      <div className="flex flex-1 items-center justify-center px-8" onClick={() => go(1)}>
        <div className="w-full max-w-3xl animate-slide-up" key={i}>
          {SLIDES[i]}
        </div>
      </div>
      <footer className="flex items-center justify-between px-6 py-4 text-kick-muted">
        <img src={kickLogo} alt="Kick" className="h-4 w-auto opacity-60" />
        <div className="flex gap-1.5">
          {SLIDES.map((_, d) => (
            <button
              key={d}
              onClick={(e) => { e.stopPropagation(); setI(d) }}
              className={`h-1.5 rounded-full transition-all ${d === i ? 'w-6 bg-kick' : 'w-1.5 bg-kick-border'}`}
            />
          ))}
        </div>
        <span className="font-mono text-[11px]">{i + 1} / {SLIDES.length} · ← →</span>
      </footer>
    </div>
  )
}
