import kickLogo from '../assets/kick-logo.svg'

/**
 * KICK Circles — solution presentation page (hackathon deliverable #1).
 * One scrollable page, built to be read aloud in under two minutes.
 */

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-kick-border/60 py-8">
      <h2 className="mb-4 flex items-baseline gap-3 text-lg font-bold">
        <span className="font-mono text-sm text-kick">{String(n).padStart(2, '0')}</span>
        {title}
      </h2>
      <div className="space-y-3 text-[14px] leading-relaxed text-kick-text/90">{children}</div>
    </section>
  )
}

function OrbitSketch() {
  return (
    <svg viewBox="0 0 320 200" className="mx-auto w-full max-w-md" aria-label="orbit map sketch">
      <circle cx="160" cy="100" r="86" fill="none" stroke="#2a2a2a" strokeDasharray="3 5" />
      <circle cx="160" cy="100" r="52" fill="none" stroke="#2a2a2a" strokeDasharray="3 5" />
      {/* you */}
      <circle cx="160" cy="100" r="15" fill="#53fc18" />
      <text x="160" y="104" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0b0b0b">
        YOU
      </text>
      {/* circles at varying affinity + heat */}
      <circle cx="108" cy="62" r="20" fill="#161616" stroke="#53fc18" strokeWidth="2" />
      <text x="108" y="59" textAnchor="middle" fontSize="7.5" fill="#f5f5f5">
        IRL Chaos
      </text>
      <text x="108" y="70" textAnchor="middle" fontSize="7" fill="#53fc18">
        ● LIVE · 92°
      </text>
      <circle cx="235" cy="121" r="16" fill="#161616" stroke="#2a2a2a" strokeWidth="1.5" />
      <text x="235" y="119" textAnchor="middle" fontSize="7.5" fill="#f5f5f5">
        Late Night
      </text>
      <text x="235" y="129" textAnchor="middle" fontSize="7" fill="#a3a3a3">
        quiet · 31°
      </text>
      <circle cx="176" cy="26" r="13" fill="#161616" stroke="#2a2a2a" strokeWidth="1.5" />
      <text x="176" y="24" textAnchor="middle" fontSize="7" fill="#f5f5f5">
        Clip Hunters
      </text>
      <text x="176" y="33" textAnchor="middle" fontSize="6.5" fill="#a3a3a3">
        57°
      </text>
    </svg>
  )
}

const SIGNALS: { signal: string; source: string; feeds: string }[] = [
  { signal: 'Watch sessions (channel, minutes, time-of-day)', source: 'client telemetry · dummy data in prototype', feeds: 'detection + score' },
  { signal: 'Live status & viewer counts', source: 'GET /public/v2/livestreams · livestream.status.updated webhook', feeds: 'activation + heat' },
  { signal: 'Follow graph', source: 'channel.followed webhook', feeds: 'detection' },
  { signal: 'Chat participation & velocity', source: 'chat.message.sent webhook (identity, replies, created_at)', feeds: 'score + heat' },
  { signal: 'Loyalty (subs, gift subs)', source: 'channel.subscription.new / renewal / gifts webhooks', feeds: 'score' },
  { signal: 'Support (KICKs tips)', source: 'kicks.gifted webhook · GET /public/v1/kicks/leaderboard', feeds: 'score + leaderboard' },
  { signal: 'Interest clusters (category, tags)', source: 'GET /public/v2/categories · custom_tags on channels', feeds: 'detection + naming' },
  { signal: 'Collectible claims', source: 'Channel Rewards APIs + channel.reward.redemption.updated', feeds: 'rewards shelf' },
]

export default function SolutionPage() {
  return (
    <div className="min-h-screen bg-kick-dark text-kick-text">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="pb-8">
          <div className="mb-6 flex items-center gap-3">
            <img src={kickLogo} alt="Kick" className="h-5 w-auto" />
            <span className="rounded bg-kick-panel-2 px-2 py-0.5 text-[11px] font-semibold text-kick-muted">
              Circles — solution page
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight">
            Circles: <span className="text-kick">crews for the couch.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-kick-text/90">
            Kick already knows which viewers keep showing up to the same streams together. Circles makes
            that invisible crowd <em>visible</em>: auto-detected communities around clusters of creators,
            with a live pulse — when a Circle's creators go live, the Circle lights up and its people come
            back. Not "recommended for you." <strong>Here is where you belong on Kick.</strong>
          </p>
          <p className="mt-3 text-[12px] text-kick-muted">
            Easygo Mini Hackathon · powered by KICK · 1 Aug 2026 · Fortress Melbourne
          </p>
        </header>

        <Section n={1} title="What our version of Circles is">
          <p>
            A Circle is a <strong>living crew</strong>, not a follower list. It has three properties no
            static community has:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>It's earned.</strong> You don't join a Circle — your watch behaviour qualifies you
              into it. Anyone can follow and lurk; status only comes from showing up.
            </li>
            <li>
              <strong>It's alive.</strong> A Circle has <span className="text-kick">Heat</span> — a
              real-time energy meter driven by how many of its creators are live and how loud its chat is.
              Circles activate, peak, and cool down like the streams they orbit.
            </li>
            <li>
              <strong>It pays you back.</strong> Participation while a Circle is active earns Circle Score,
              streaks, and collectibles — durable identity you'd lose by leaving.
            </li>
          </ul>
        </Section>

        <Section n={2} title="Data signals we'd use">
          <p className="text-[13px] text-kick-muted">
            Every signal below maps to a documented Kick API surface (full inventory:{' '}
            <code className="text-kick">docs/KICK_API_MAP.md</code>). The prototype runs on dummy data;
            the pipes are real.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="text-kick-muted">
                  <th className="py-2 pr-4 font-semibold">Signal</th>
                  <th className="py-2 pr-4 font-semibold">Real source</th>
                  <th className="py-2 font-semibold">Feeds</th>
                </tr>
              </thead>
              <tbody>
                {SIGNALS.map((s) => (
                  <tr key={s.signal} className="border-t border-kick-border/50 align-top">
                    <td className="py-2 pr-4">{s.signal}</td>
                    <td className="py-2 pr-4 font-mono text-[11px] text-kick-text/75">{s.source}</td>
                    <td className="py-2 text-kick-muted">{s.feeds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section n={3} title="How Circles are detected">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Build a <strong>co-watch graph</strong>: creators are nodes; edge weight = overlap of unique
              co-watchers' minutes across the last 30 days (time-decayed, so Circles drift with taste).
            </li>
            <li>
              Run <strong>community detection</strong> (label propagation / Louvain) over the graph. A
              cluster becomes a Circle when it's stable across a week, has ≥3 creators, and shows a
              coherent category/tag signature.
            </li>
            <li>
              <strong>Auto-name</strong> from dominant tags + chat culture ("IRL Chaos Circle", "Late
              Night Watchers"), with creator override.
            </li>
            <li>
              Attach viewers by their personal watch-minute distribution vs. the cluster: cross a
              threshold and the app nudges — <em>"You're 82% into IRL Chaos Circle."</em>
            </li>
          </ol>
          <p className="text-[13px] text-kick-muted">
            Floor rule: a Circle must have ≥500 attached viewers before it's ever shown — communities are
            aggregates, never small-group surveillance.
          </p>
        </Section>

        <Section n={4} title="How Circle Score works">
          <p>Per user, per Circle, per week:</p>
          <div className="rounded-lg bg-kick-panel p-4 font-mono text-[12.5px] leading-relaxed">
            score = watch_minutes<span className="text-kick-muted">(capped/day)</span> ·1{' '}
            + chat_messages<span className="text-kick-muted">(capped, anti-spam)</span> ·2{' '}
            + active_attendance<span className="text-kick-muted">(was there while Circle was hot)</span> ·5{' '}
            + streak_bonus ·10 + subs_and_kicks_multiplier
            <span className="text-kick"> — 10% decay every week</span>
          </div>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Levels: <strong>Lurker → Regular → Core → OG</strong>, shown on your chat badge inside the
              Circle's channels.
            </li>
            <li>
              The <strong>weekly decay</strong> is the retention engine: status isn't owned, it's
              maintained. Skip two weeks and you feel it.
            </li>
            <li>
              Circle <strong>Heat</strong> (the Circle-level meter) reuses a decaying hype-score engine we
              already built and unit-tested for live overlays: sustained energy in, exponential decay out.
            </li>
          </ul>
        </Section>

        <Section n={5} title="The user journey">
          <OrbitSketch />
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Watch like normal → nudge: "You're 82% into IRL Chaos Circle — 2,140 people like you."</li>
            <li>
              Open <strong>My Circles</strong>: an orbit map — you at the center, your Circles orbiting by
              affinity, glowing by live Heat.
            </li>
            <li>Tap a Circle → detail view: who's live now, Circle chat, leaderboard, trending clips, collectible shelf.</li>
            <li>Follow it → you now get one notification when the Circle activates (its creators go live together).</li>
            <li>Show up while it's hot → score, streak, and this week's collectible drop.</li>
          </ol>
        </Section>

        <Section n={6} title="Why users come back">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Activation notifications</strong> land at the exact moment there's something live to
              return to — not a digest, a doorbell.
            </li>
            <li>
              <strong>Decaying score + streaks</strong>: loss aversion beats novelty. Your OG badge is
              always four quiet weeks from gone.
            </li>
            <li>
              <strong>Visible Heat</strong>: the orbit map shows the party you're missing in real time.
            </li>
            <li>
              <strong>Weekly leaderboard resets</strong> with collectible drops for the top slice — a
              fresh race every Monday.
            </li>
          </ul>
        </Section>

        <Section n={7} title="Key risks & mitigations">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Creepiness / privacy</strong> — only aggregates are ever shown (≥500-viewer floor,
              no individual watch history exposed, one-tap opt out of detection entirely).
            </li>
            <li>
              <strong>Toxicity / echo chambers</strong> — Circle chat inherits the member creators' mod
              lists via the Moderation API + <code>moderation.banned</code> webhook; Circles with anomalous
              report rates get quarantined from discovery.
            </li>
            <li>
              <strong>Score gaming</strong> — per-day caps, server-side signals only, chat anti-spam, and
              decay; paid signals (KICKs) are inherently costly to fake.
            </li>
            <li>
              <strong>Gambling-adjacent categories</strong> — Circles in 18+ categories are age-gated and
              excluded from score-driven reward drops.
            </li>
            <li>
              <strong>Cold start</strong> — seed Circles from category + follow-graph overlap before
              watch-minute data accrues; creators can bless a seed Circle to bootstrap it.
            </li>
          </ul>
        </Section>

        <Section n={8} title="Success metrics">
          <p>
            <strong className="text-kick">Primary (per the brief):</strong> weekly return rate of users
            who follow ≥1 Circle, vs. a matched cohort of non-followers.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>D7 / D30 retention lift for Circle followers.</li>
            <li>Open rate on Circle-activation notifications (health of the doorbell).</li>
            <li>Median watch minutes per active member per week.</li>
            <li>% of chat messages sent by Circle members inside Circle channels.</li>
            <li>Guardrails: report rate per Circle, notification opt-out rate, score-decay churn.</li>
          </ul>
        </Section>

        <footer className="border-t border-kick-border/60 py-8 text-[12px] text-kick-muted">
          Deliverable #2 (working prototype, dummy data): My Circles orbit map · Circle detail view ·
          Circle Score — built on this repo's Kick-accurate UI shell, live chat system, and tested
          decaying-score engine.
        </footer>
      </div>
    </div>
  )
}
