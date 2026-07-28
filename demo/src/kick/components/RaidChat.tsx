import { Link } from "react-router-dom";
import { formatViewers, profileFor, streamPills, type Livestream } from "../mock/api";
import { interactivityPercent, type Candidate } from "../mock/raids";
import { useRaid } from "../raid/RaidProvider";
import { RouletteReel } from "./RouletteReel";
import {
  advance,
  candidateFor,
  castVote,
  openTankVote,
  REROLL_CAP,
  TIMING,
  type Poll,
  type Raid,
  type RaidMode,
} from "../raid/machine";

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const nameOf = (raid: Raid, slug?: string) =>
  slug ? (candidateFor(raid, slug)?.stream.channel.username ?? slug) : "";

function bannerText(raid: Raid) {
  const target = nameOf(raid, raid.targetSlug);
  switch (raid.phase) {
    case "preview":
      return `Previewing ${raid.previewIndex + 1} of 3`;
    case "tank-browse":
      return "Showdown is open";
    case "vote":
      return raid.poll?.picks === 2 ? "Chat is picking 2 of 10" : "Chat is voting";
    case "tank-accept":
      return "Creators are deciding";
    case "tank-fork": {
      if (raid.viewer) return "Streamer is selecting another one";
      const stillOpen = raid.finalists.filter((s) => !raid.accepted.includes(s)).length;
      return stillOpen > 1 ? "Both creators declined" : "One creator declined";
    }
    case "tank-mass-invite":
      return "Sending mass invites";
    case "tank-pitch":
      return `${nameOf(raid, raid.finalists[raid.pitchIndex])} is pitching`;
    case "reveal":
      return "Rolling the raid";
    case "countdown":
      return `Raiding ${target}`;
    default:
      return "Raid cancelled";
  }
}

// A race, not a ballot: candidates re-rank live as votes land, the leader's avatar grows and
// lights up, so the vote reads as momentum instead of a static list of bars.
function PollRows({ raid, poll }: { raid: Raid; poll: Poll }) {
  const { act } = useRaid();
  const total = Object.values(poll.votes).reduce((sum, n) => sum + n, 0) || 1;
  const ranked = [...poll.options].sort((a, b) => (poll.votes[b] ?? 0) - (poll.votes[a] ?? 0));

  return (
    <div className="flex flex-col gap-2">
      {ranked.map((slug, i) => {
        const c = candidateFor(raid, slug);
        const votes = poll.votes[slug] ?? 0;
        const percent = Math.round((votes / total) * 100);
        const mine = poll.myVote === slug;
        const leading = i === 0 && votes > 0;
        return (
          <button
            key={slug}
            type="button"
            disabled={Boolean(poll.myVote)}
            onClick={() => act((r) => castVote(r, slug))}
            className={`relative flex items-center gap-3 overflow-hidden rounded-lg bg-surface-lowest p-2 text-left transition-all duration-500 disabled:cursor-default ${
              mine ? "ring-2 ring-primary-base" : ""
            }`}
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary-base/20 transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
            <div className="relative flex w-full items-center gap-3">
              {c && (
                <img
                  src={c.stream.channel.avatar}
                  alt=""
                  className={`shrink-0 rounded-full ring-2 transition-all duration-300 ${
                    leading ? "size-11 ring-primary-base" : "size-9 opacity-80 ring-transparent"
                  }`}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="min-w-0 truncate text-sm font-bold text-white">
                    {nameOf(raid, slug)}
                  </span>
                  {leading && (
                    <span className="shrink-0 rounded-full bg-primary-base px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-primary-onPrimary">
                      Leading
                    </span>
                  )}
                </div>
                <span className="text-xs text-surface-onSurfaceSecondary">
                  {formatViewers(votes)} votes
                </span>
              </div>
              <span className="shrink-0 text-2xl font-black tabular-nums text-primary-base">
                {percent}%
              </span>
            </div>
          </button>
        );
      })}
      <span className="text-xs text-surface-onSurfaceSecondary">
        {poll.myVote
          ? "Your vote is locked."
          : poll.picks === 2
            ? "Chat picks two. One vote each."
            : "One vote each, and it locks."}
      </span>
    </div>
  );
}

// Section 5.3: the winner is revealed by a spin reel inside the chat card, never a takeover.
// A depleting ring around the target's avatar, so the countdown reads at a glance instead of
// needing to be read as digits. Same visual language as the dialog roulette's landed ring.
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const size = 64;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, seconds / total));
  const offset = circumference * (1 - progress);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        className="stroke-surface-highest"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="stroke-primary-base transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
    </svg>
  );
}

function TargetCard({ raid, showCountdown }: { raid: Raid; showCountdown?: boolean }) {
  const target = candidateFor(raid, raid.targetSlug ?? "");
  if (!target) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex size-16 shrink-0 items-center justify-center">
        <img src={target.stream.channel.avatar} alt="" className="size-14 rounded-full" />
        {showCountdown && <CountdownRing seconds={raid.seconds} total={TIMING.countdown} />}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold text-white">
          {target.stream.channel.username}
        </span>
        <span className="block truncate text-sm text-surface-onSurfaceSecondary">
          {formatViewers(target.stream.viewer_count)} watching
        </span>
      </div>
      {showCountdown && (
        <span className="shrink-0 text-2xl font-bold tabular-nums text-primary-base">
          {raid.seconds}
        </span>
      )}
    </div>
  );
}

function Countdown({ raid }: { raid: Raid }) {
  const { targetIsHidden, join, leave, joined } = useRaid();
  const target = candidateFor(raid, raid.targetSlug ?? "");
  if (!target) return null;

  return (
    <div className="flex flex-col gap-3">
      <TargetCard raid={raid} showCountdown />
      {joined === false ? (
        <span className="text-sm text-surface-onSurfaceSecondary">
          You're staying here. Chat goes without you.
        </span>
      ) : joined === true ? (
        <span className="text-sm font-semibold text-primary-base">
          You're in. You'll be carried across with chat.
        </span>
      ) : targetIsHidden ? (
        <>
          {/* Section 5.4: nobody is auto-carried into a category they hid. */}
          <div className="flex flex-wrap gap-1">
            {streamPills(target.stream).map((pill) => (
              <span
                key={pill}
                className="rounded-full bg-secondary-base px-2 py-1 text-xs leading-none text-secondary-onSecondary"
              >
                {pill}
              </span>
            ))}
          </div>
          <span className="text-xs text-surface-onSurfaceSecondary">
            You hid this category, so you stay here unless you join.
          </span>
          <button
            type="button"
            onClick={join}
            className="state-layer-base h-9 w-full rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
          >
            Join the raid
          </button>
        </>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={leave}
            className="h-9 flex-1 rounded bg-secondary-base text-sm font-semibold text-secondary-onSecondary"
          >
            Leave
          </button>
          <button
            type="button"
            onClick={join}
            className="state-layer-base h-9 flex-1 rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
          >
            Enter
          </button>
        </div>
      )}
    </div>
  );
}

function StreamerControls({ raid }: { raid: Raid }) {
  const { act, openDialog } = useRaid();

  if (raid.viewer) return null;

  if (raid.phase === "tank-browse") {
    return (
      <button
        type="button"
        onClick={() => act(openTankVote)}
        className="state-layer-base h-9 w-full rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
      >
        Open the vote
      </button>
    );
  }

  if (raid.phase !== "tank-fork") return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-center text-xs text-surface-onSurfaceSecondary">
        {REROLL_CAP - raid.rerolls} of {REROLL_CAP} picks left
      </span>
      <button
        type="button"
        onClick={() => openDialog("raid")}
        className="state-layer-base h-9 w-full rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
      >
        Pick replacement
      </button>
    </div>
  );
}

// Hover card: username, how interactive they run their chat, and what they usually stream,
// so a curious viewer can size someone up before the vote without leaving the preview.
function AvatarInfoCard({ candidate }: { candidate: Candidate }) {
  const pct = interactivityPercent(candidate);
  const categories = profileFor(candidate.stream.channel.slug)?.recent_categories ?? [
    candidate.stream.category,
  ];
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg bg-surface-highest p-3 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
      <div className="flex items-center gap-2">
        <img src={candidate.stream.channel.avatar} alt="" className="size-8 shrink-0 rounded-full" />
        <span className="min-w-0 truncate text-sm font-bold text-white">
          {candidate.stream.channel.username}
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-surface-onSurfaceSecondary">
          <span>Interactivity</span>
          <span className="font-semibold text-primary-base">{pct}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-lowest">
          <div className="h-full bg-primary-base" style={{ width: `${pct}%` }} />
        </div>
        <span className="pt-0.5 text-xs text-surface-onSurfaceSecondary">Usually streams</span>
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <span
              key={cat.slug}
              className="whitespace-nowrap rounded-full bg-secondary-base px-1.5 py-0.5 text-[11px] leading-none text-secondary-onSecondary"
            >
              {cat.name}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute left-1/2 top-full -mt-1 size-2 -translate-x-1/2 rotate-45 bg-surface-highest" />
    </div>
  );
}

function PreviewTracker({ raid }: { raid: Raid }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-3">
        {raid.featured.map((slug) => {
          const c = candidateFor(raid, slug);
          if (!c) return null;
          const active = raid.stage === slug;
          return (
            <div key={slug} className="group relative flex flex-col items-center gap-1">
              <AvatarInfoCard candidate={c} />
              {active ? (
                <div className="relative flex size-16 shrink-0 items-center justify-center">
                  <img
                    src={c.stream.channel.avatar}
                    alt=""
                    className="size-14 rounded-full object-cover ring-2 ring-primary-base"
                  />
                  <CountdownRing seconds={raid.seconds} total={TIMING.chatPreview} />
                </div>
              ) : (
                <img
                  src={c.stream.channel.avatar}
                  alt=""
                  className="size-10 rounded-full object-cover opacity-40"
                />
              )}
              <span
                className={`max-w-[64px] truncate text-[11px] font-semibold ${
                  active ? "text-white" : "text-surface-onSurfaceSecondary"
                }`}
              >
                {c.stream.channel.username}
              </span>
            </div>
          );
        })}
      </div>
      <span className="text-center text-xs text-surface-onSurfaceSecondary">
        Previewing {raid.previewIndex + 1} of 3. Chat votes once all three have played.
      </span>
    </div>
  );
}

// One contender's avatar, ringed and badged by where they stand: pulsing while the invite is
// out, green and checked once accepted, dimmed and crossed if they drop. Reused for both the
// accept wait and the fork it opens into, so the matchup reads the same in either phase.
function FinalistBadge({ raid, slug }: { raid: Raid; slug: string }) {
  const c = candidateFor(raid, slug);
  const accepted = raid.accepted.includes(slug);
  const declined = raid.declined.includes(slug);
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <div
        className={`relative flex size-14 shrink-0 items-center justify-center rounded-full ring-2 ${
          accepted
            ? "ring-primary-base"
            : declined
              ? "opacity-50 ring-surface-onSurfaceNegative"
              : "ring-outline-decorative"
        }`}
      >
        {c && (
          <img src={c.stream.channel.avatar} alt="" className="size-full rounded-full object-cover" />
        )}
        <span
          className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
            accepted
              ? "bg-primary-base text-primary-onPrimary"
              : declined
                ? "bg-surface-onSurfaceNegative text-white"
                : "animate-pulse bg-surface-highest text-surface-onSurfaceSecondary"
          }`}
        >
          {accepted ? "✓" : declined ? "×" : "…"}
        </span>
      </div>
      <span className="max-w-[84px] truncate text-xs font-semibold text-white">
        {nameOf(raid, slug)}
      </span>
      <span
        className={`text-[10px] font-semibold uppercase ${
          accepted
            ? "text-primary-base"
            : declined
              ? "text-surface-onSurfaceNegative"
              : "text-surface-onSurfaceSecondary"
        }`}
      >
        {accepted ? "Accepted" : declined ? "Declined" : "Waiting"}
      </span>
    </div>
  );
}

function Matchup({ raid }: { raid: Raid }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <FinalistBadge raid={raid} slug={raid.finalists[0]} />
      <span className="shrink-0 text-xs font-black text-surface-onSurfaceSecondary">VS</span>
      <FinalistBadge raid={raid} slug={raid.finalists[1]} />
    </div>
  );
}

function Body({ raid }: { raid: Raid }) {
  const { joined, targetIsHidden, openDialog, clear } = useRaid();

  switch (raid.phase) {
    case "preview":
      return <PreviewTracker raid={raid} />;
    case "tank-browse":
      return (
        <span className="text-sm text-surface-onSurfaceSecondary">
          {raid.viewer
            ? "Ten channels are in the player. The streamer opens the vote when they are ready."
            : "Ten channels are in the player. Watch any of them, then open the vote and chat picks two."}
        </span>
      );
    case "tank-fork":
      return <Matchup raid={raid} />;
    case "tank-mass-invite":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {raid.massInvited.map((slug) => {
              const c = candidateFor(raid, slug);
              if (!c) return null;
              return (
                <img
                  key={slug}
                  src={c.stream.channel.avatar}
                  alt=""
                  className="size-9 animate-pulse rounded-full opacity-70"
                />
              );
            })}
          </div>
          <span className="text-center text-xs text-surface-onSurfaceSecondary">
            Sending invites to {raid.massInvited.length} channels. Whoever accepts first joins.
          </span>
        </div>
      );
    case "vote":
      return raid.poll ? <PollRows raid={raid} poll={raid.poll} /> : null;
    case "tank-accept":
      return <Matchup raid={raid} />;
    case "tank-pitch":
      return (
        <span className="text-sm text-surface-onSurfaceSecondary">
          {nameOf(raid, raid.finalists[raid.pitchIndex])} has 60 seconds to say why they deserve
          the raid. The vote opens after both pitches.
        </span>
      );
    case "reveal":
      return <RouletteReel candidates={raid.candidates} commitSlug={raid.targetSlug} />;
    case "countdown":
      return <Countdown raid={raid} />;
    case "landed":
      return (
        <div className="flex flex-col gap-3">
          <TargetCard raid={raid} />
          <span className="text-sm text-surface-onSurfaceSecondary">
            {(joined ?? !targetIsHidden)
              ? "You got swept up with the rest of chat. Enjoy the ride."
              : "You stayed put. Not even a gentle nudge."}
          </span>
          <button
            type="button"
            onClick={clear}
            className="h-9 w-full rounded bg-secondary-base text-sm font-semibold text-secondary-onSecondary"
          >
            Nice raid!
          </button>
        </div>
      );
    default:
      // Section 9: the streamer is told to pick someone else, the viewer is told they are
      // still here.
      return (
        <div className="flex flex-col gap-3">
          <span className="text-sm text-surface-onSurfaceNegative">
            {raid.viewer ? "The raid failed, so you are still here." : raid.note}
          </span>
          <div className="flex gap-2">
            {!raid.viewer && (
              <button
                type="button"
                onClick={() => {
                  clear();
                  openDialog("raid");
                }}
                className="state-layer-base h-9 flex-1 rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
              >
                Pick someone else
              </button>
            )}
            <Link
              to="/browse"
              onClick={clear}
              className="flex h-9 flex-1 items-center justify-center rounded bg-secondary-base text-sm font-semibold text-secondary-onSecondary"
            >
              Browse
            </Link>
          </div>
        </div>
      );
  }
}

// Section 13: the demo runs the raid from the viewer's seat. The streamer's decisions are
// scripted, and the viewer keeps the vote, the join and the leave.
export function RaidPreviewAsViewer({ host }: { host: Livestream }) {
  const { startAsViewer } = useRaid();
  const modes: { id: RaidMode; label: string }[] = [
    { id: "random", label: "Random" },
    { id: "chat", label: "Chat picks" },
    { id: "tank", label: "Showdown" },
  ];

  return (
    <div className="shrink-0 border-t border-outline-decorative bg-surface-base px-3 py-2">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xs uppercase text-surface-onSurfaceSecondary">Demo</span>
        <span className="min-w-0 truncate text-sm font-bold text-white">
          Preview as viewer: {host.channel.username} raids
        </span>
      </div>
      <div className="flex gap-1.5">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => startAsViewer(host, mode.id)}
            className="h-8 flex-1 rounded bg-secondary-base text-xs font-semibold text-secondary-onSecondary betterhover:hover:bg-surface-highest"
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const TANK_STEPS = ["Browse", "Vote", "Pitch", "Winner", "Go"] as const;

function tankStepIndex(raid: Raid): number {
  switch (raid.phase) {
    case "tank-browse":
      return 0;
    case "vote":
      return raid.poll?.round === 2 ? 3 : 1;
    case "tank-accept":
    case "tank-fork":
    case "tank-mass-invite":
      return 1;
    case "tank-pitch":
      return 2;
    case "countdown":
    case "landed":
      return 4;
    default:
      return 0;
  }
}

// Section 5.2: the Showdown is the only mode with enough steps to need a tracker. The other
// three modes already say where they are in the banner text alone.
function TankProgress({ raid }: { raid: Raid }) {
  const index = tankStepIndex(raid);
  return (
    <div className="mb-2 flex gap-1" aria-hidden="true">
      {TANK_STEPS.map((step, i) => (
        <div
          key={step}
          className={`h-1 flex-1 rounded-full ${i <= index ? "bg-primary-base" : "bg-surface-highest"}`}
        />
      ))}
    </div>
  );
}

// Section 5.2: the panel above the chat input is the only place the raid shows in chat now,
// so it carries the status, the countdown clock, and the detail together, always visible for
// as long as a raid is active.
export function RaidPanel() {
  const { raid } = useRaid();
  if (!raid) return null;

  // Section 5.2: countdown and landed already name the target in the rich card below, so the
  // header here stays generic instead of printing the same name twice in one card.
  const panelHeader =
    raid.phase === "countdown" ? "Raid incoming" : raid.phase === "landed" ? "Mission accomplished" : bannerText(raid);

  return (
    <div className="shrink-0 border-t border-outline-decorative bg-surface-base px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{panelHeader}</span>
        {raid.seconds > 0 && raid.phase !== "countdown" && (
          <span className="shrink-0 text-sm font-bold tabular-nums text-primary-base">
            {clock(raid.seconds)}
          </span>
        )}
      </div>

      {raid.mode === "tank" && <TankProgress raid={raid} />}

      <div className="flex flex-col gap-3">
        <Body raid={raid} />
        <StreamerControls raid={raid} />
      </div>
    </div>
  );
}

// Section 13: a floating, out-of-the-way way to skip any raid timer, since real countdowns,
// previews, and pitches run to the real clock. Mounted once at the app root so it works
// wherever a raid is running, not just inside the chat column.
export function RaidDevControls() {
  const { raid, act } = useRaid();
  if (!raid || raid.seconds <= 0) return null;

  return (
    <div className="z-popover fixed bottom-4 left-4 flex items-center gap-2 rounded-lg bg-surface-highest px-3 py-2 shadow-2xl">
      <span className="text-xs font-semibold uppercase text-surface-onSurfaceSecondary">Demo</span>
      <button
        type="button"
        onClick={() => act((r) => advance({ ...r, seconds: 0 }))}
        className="state-layer-base rounded bg-primary-base px-2 py-1 text-xs font-semibold text-primary-onPrimary"
      >
        Skip timer
      </button>
    </div>
  );
}
