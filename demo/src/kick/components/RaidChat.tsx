import { Link } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import { formatViewers, profileFor, streamPills, type Livestream } from "../mock/api";
import { interactivityPercent, type Candidate } from "../mock/raids";
import { usePrefs } from "../prefs";
import { useRaid } from "../raid/RaidProvider";
import { RouletteReel } from "./RouletteReel";
import {
  advance,
  candidateFor,
  castVote,
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
    case "showdown-browse":
      return "Showdown is open";
    case "vote":
      return raid.poll?.picks === 2 ? "Chat is voting for top 2" : "Chat is voting";
    case "showdown-accept":
      return "Creators are deciding";
    case "showdown-pitch":
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
  // Section 5.3: the row order stays exactly as the poll opened it. Ranking by live votes
  // would make cards jump around mid-vote, so "leading" is a badge on the row with the most
  // votes, never a reshuffle a click could land on the wrong card.
  const maxVotes = Math.max(0, ...poll.options.map((slug) => poll.votes[slug] ?? 0));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex max-h-40 flex-col gap-1 overflow-y-auto p-1">
        {poll.options.map((slug) => {
          const c = candidateFor(raid, slug);
          const votes = poll.votes[slug] ?? 0;
          const percent = Math.round((votes / total) * 100);
          const mine = poll.myVote === slug;
          const leading = votes > 0 && votes === maxVotes;
          return (
            <button
              key={slug}
              type="button"
              disabled={Boolean(poll.myVote)}
              onClick={() => act((r) => castVote(r, slug))}
              className={`relative flex shrink-0 items-center gap-2 overflow-hidden rounded-lg bg-surface-lowest p-1 text-left transition-all duration-500 disabled:cursor-default ${
                mine ? "ring-2 ring-primary-base" : ""
              }`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary-base/20 transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
              <div className="relative flex w-full items-center gap-2">
                {c && (
                  <img
                    src={c.stream.channel.avatar}
                    alt=""
                    className={`shrink-0 rounded-full ring-2 transition-all duration-300 ${
                      leading ? "size-7 ring-primary-base" : "size-6 opacity-80 ring-transparent"
                    }`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="min-w-0 truncate text-xs font-bold text-white">
                      {nameOf(raid, slug)}
                    </span>
                    {leading && (
                      <span className="shrink-0 rounded-full bg-primary-base px-1 py-0.5 text-[9px] font-bold uppercase leading-none text-primary-onPrimary">
                        Leading
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-surface-onSurfaceSecondary">
                    {formatViewers(votes)} votes
                  </span>
                </div>
                <span className="shrink-0 text-sm font-black tabular-nums text-primary-base">
                  {percent}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <span className="shrink-0 text-xs text-surface-onSurfaceSecondary">
        {poll.myVote
          ? "Your vote is locked."
          : poll.picks === 2
            ? "One vote each, and it locks. Top 2 will pitch-off"
            : "One vote each, and it locks."}
      </span>
    </div>
  );
}

// Section 5.3: the winner is revealed by a spin reel inside the chat card, never a takeover.
// A depleting ring around the target's avatar, so the countdown reads at a glance instead of
// needing to be read as digits. Same visual language as the dialog roulette's landed ring.
function CountdownRing({ seconds, total, size = 64 }: { seconds: number; total: number; size?: number }) {
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

// Section 5.2: every mode had its own big moment mid-flight, the roulette reel, the preview
// race, the VS matchup, except the final handoff, which always fell back to a plain target
// row. This is that moment staged the same way for all four modes: a spotlight card, badged
// with how the target got chosen.
const REVEAL_BADGE: Record<RaidMode, { label: string; icon?: KickIconName }> = {
  random: { label: "Randomly selected" },
  pick: { label: "Handpicked by the streamer", icon: "pin" },
  chat: { label: "Chosen by chat" },
  showdown: { label: "Won the showdown" },
};

function RevealSpotlight({ raid }: { raid: Raid }) {
  const target = candidateFor(raid, raid.targetSlug ?? "");
  if (!target) return null;
  const [category] = streamPills(target.stream);
  const badge = REVEAL_BADGE[raid.mode];
  return (
    <div className="animate-pick-reveal relative flex flex-col gap-1.5 overflow-hidden rounded-lg bg-surface-lowest px-2.5 py-2.5">
      <div className="animate-pick-glow pointer-events-none absolute inset-x-0 top-0 h-10 bg-[radial-gradient(ellipse_at_top,rgba(83,252,24,0.4),transparent_70%)]" />
      <span className="relative inline-flex w-fit items-center gap-1 rounded-full bg-primary-base py-0.5 pl-1.5 pr-2 text-[10px] font-bold text-primary-onPrimary">
        {badge.icon && <Icon name={badge.icon} className="size-2.5" />}
        {badge.label}
      </span>
      <div className="relative flex items-center gap-2.5">
        <div className="relative flex size-11 shrink-0 items-center justify-center">
          <img src={target.stream.channel.avatar} alt="" className="size-9 rounded-full" />
          <CountdownRing seconds={raid.seconds} total={TIMING.countdown} size={44} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-white">
            {target.stream.channel.username}
          </span>
          <span className="block truncate text-[11px] text-surface-onSurfaceSecondary">
            {formatViewers(target.stream.viewer_count)} watching{category ? ` · ${category}` : ""}
          </span>
        </div>
        <span className="shrink-0 text-lg font-bold tabular-nums text-primary-base">{raid.seconds}</span>
      </div>
    </div>
  );
}

// Section 5.2: landed reuses the reveal's own visual language, glow, pop-in, ringed avatar, so
// the raid's outcome reads as the same kind of moment, not a plain row bolted on at the end.
function LandedCard({ raid }: { raid: Raid }) {
  const { joined, targetIsHidden, clear } = useRaid();
  const target = candidateFor(raid, raid.targetSlug ?? "");
  if (!target) return null;
  const [category] = streamPills(target.stream);
  const swept = joined ?? !targetIsHidden;
  return (
    <div className="flex flex-col gap-3">
      <div className="animate-pick-reveal relative flex items-center gap-2.5 overflow-hidden rounded-lg bg-surface-lowest px-2.5 py-2.5">
        <div className="animate-pick-glow pointer-events-none absolute inset-x-0 top-0 h-10 bg-[radial-gradient(ellipse_at_top,rgba(83,252,24,0.4),transparent_70%)]" />
        <div className="relative flex size-11 shrink-0 items-center justify-center">
          <img
            src={target.stream.channel.avatar}
            alt=""
            className="size-11 rounded-full ring-2 ring-primary-base"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary-base text-[9px] font-bold text-primary-onPrimary">
            ✓
          </span>
        </div>
        <div className="relative min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-white">
            {target.stream.channel.username}
          </span>
          <span className="block truncate text-[11px] text-surface-onSurfaceSecondary">
            {formatViewers(target.stream.viewer_count)} watching{category ? ` · ${category}` : ""}
          </span>
        </div>
      </div>
      <span className="text-sm text-surface-onSurfaceSecondary">
        {swept
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
}

function Countdown({ raid }: { raid: Raid }) {
  const { targetIsHidden, join, leave, joined } = useRaid();
  const target = candidateFor(raid, raid.targetSlug ?? "");
  if (!target) return null;

  return (
    <div className="flex flex-col gap-3">
      <RevealSpotlight raid={raid} />
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


// Hover card: username, how interactive they run their chat, and what they usually stream,
// so a curious viewer can size someone up before the vote without leaving the preview.
const CARD_ALIGN = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
} as const;

const CARD_TAIL_ALIGN = {
  start: "left-4",
  center: "left-1/2 -translate-x-1/2",
  end: "right-4",
} as const;

function AvatarInfoCard({
  candidate,
  align = "center",
}: {
  candidate: Candidate;
  align?: "start" | "center" | "end";
}) {
  const pct = interactivityPercent(candidate);
  const categories = profileFor(candidate.stream.channel.slug)?.recent_categories ?? [
    candidate.stream.category,
  ];
  return (
    <div
      className={`z-popover pointer-events-none absolute bottom-full mb-2 w-52 rounded-lg bg-surface-highest p-3 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 ${CARD_ALIGN[align]}`}
    >
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
      <div className={`absolute top-full -mt-1 size-2 rotate-45 bg-surface-highest ${CARD_TAIL_ALIGN[align]}`} />
    </div>
  );
}

function PreviewTracker({ raid }: { raid: Raid }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-3">
        {raid.featured.map((slug, i) => {
          const c = candidateFor(raid, slug);
          if (!c) return null;
          const active = raid.stage === slug;
          const align = i === 0 ? "start" : i === raid.featured.length - 1 ? "end" : "center";
          return (
            <div key={slug} className="group relative flex flex-col items-center gap-1">
              <AvatarInfoCard candidate={c} align={align} />
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
// out, green and checked once accepted.
function FinalistBadge({
  raid,
  slug,
  align,
}: {
  raid: Raid;
  slug: string;
  align: "start" | "end";
}) {
  const c = candidateFor(raid, slug);
  const accepted = raid.accepted.includes(slug);
  return (
    <div className="group relative flex flex-1 flex-col items-center gap-1.5">
      {c && <AvatarInfoCard candidate={c} align={align} />}
      <div
        className={`relative flex size-14 shrink-0 items-center justify-center rounded-full ring-2 ${
          accepted ? "ring-primary-base" : "ring-outline-decorative"
        }`}
      >
        {c && (
          <img src={c.stream.channel.avatar} alt="" className="size-full rounded-full object-cover" />
        )}
        <span
          className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
            accepted
              ? "bg-primary-base text-primary-onPrimary"
              : "animate-pulse bg-surface-highest text-surface-onSurfaceSecondary"
          }`}
        >
          {accepted ? "✓" : "…"}
        </span>
      </div>
      <span className="max-w-[84px] truncate text-xs font-semibold text-white">
        {nameOf(raid, slug)}
      </span>
      <span
        className={`text-[10px] font-semibold uppercase ${
          accepted ? "text-primary-base" : "text-surface-onSurfaceSecondary"
        }`}
      >
        {accepted ? "Accepted" : "Waiting"}
      </span>
    </div>
  );
}

function Matchup({ raid }: { raid: Raid }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <FinalistBadge raid={raid} slug={raid.finalists[0]} align="start" />
      <span className="shrink-0 text-xs font-black text-surface-onSurfaceSecondary">VS</span>
      <FinalistBadge raid={raid} slug={raid.finalists[1]} align="end" />
    </div>
  );
}

// The vote opens on the clock, not on the streamer clicking anything, so the countdown itself
// is the only thing telling chat how long they have to go watch a tile before it opens.
// The roster reads as the same zoom-meeting grid the player shows, shrunk to fit the chat
// card, with the currently-previewed tile ringed. The countdown is a badge, not a bar, so it
// reads at a glance the same way the reveal's ring does.
function ShowdownBrowseTimer({ raid }: { raid: Raid }) {
  const roster = raid.candidates.slice(0, 6);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="mx-auto grid w-full max-w-[186px] grid-cols-3 gap-1">
        {roster.map((c, i) => {
          const slug = c.stream.channel.slug;
          const active = raid.stage === slug;
          const col = i % 3;
          const align = col === 0 ? "start" : col === 2 ? "end" : "center";
          return (
            <div key={slug} className="group relative">
              <AvatarInfoCard candidate={c} align={align} />
              <div
                className={`relative aspect-square overflow-hidden rounded bg-surface-lowest transition-all duration-300 ${
                  active ? "ring-2 ring-primary-base" : "ring-1 ring-outline-decorative"
                }`}
              >
                <img
                  src={c.stream.channel.avatar}
                  alt=""
                  className={`h-full w-full object-cover transition-opacity ${active ? "" : "opacity-70"}`}
                />
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 animate-pick-glow bg-primary-base" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-surface-lowest px-2 py-1.5">
        <div className="relative flex size-6 shrink-0 items-center justify-center">
          <CountdownRing seconds={raid.seconds} total={TIMING.showdownBrowse} size={24} />
          <span className="relative text-[10px] font-black tabular-nums text-primary-base">
            {raid.seconds}
          </span>
        </div>
        <span className="min-w-0 flex-1 text-xs leading-snug text-surface-onSurfaceSecondary">
          Voting will begin soon.
        </span>
      </div>
    </div>
  );
}

function Body({ raid }: { raid: Raid }) {
  const { openDialog, clear } = useRaid();

  switch (raid.phase) {
    case "preview":
      return <PreviewTracker raid={raid} />;
    case "showdown-browse":
      return <ShowdownBrowseTimer raid={raid} />;
    case "vote":
      return raid.poll ? <PollRows raid={raid} poll={raid.poll} /> : null;
    case "showdown-accept":
      return <Matchup raid={raid} />;
    case "showdown-pitch":
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
      return <LandedCard raid={raid} />;
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
// Floats in the same bottom-left slot RaidDevControls uses once a raid is running: before
// one starts there is nothing to skip, so the two never compete for the spot.
export function RaidPreviewAsViewer({ host }: { host: Livestream }) {
  const { raid, startAsViewer, act } = useRaid();
  const modes: { id: RaidMode; label: string }[] = [
    { id: "random", label: "Random" },
    { id: "pick", label: "Streamer pick" },
    { id: "chat", label: "Chat picks" },
    { id: "showdown", label: "Showdown" },
  ];

  if (raid && raid.seconds > 0) {
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

  if (raid) return null;

  return (
    <div className="z-popover fixed bottom-4 left-4 flex w-64 flex-col gap-2 rounded-lg bg-surface-highest p-3 shadow-2xl">
      <span className="text-xs font-semibold uppercase text-surface-onSurfaceSecondary">
        Demo: preview as viewer
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => startAsViewer(host, mode.id)}
            className="h-8 rounded bg-secondary-base text-xs font-semibold text-secondary-onSecondary betterhover:hover:bg-surface-lowest"
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SHOWDOWN_STEPS = ["Browse", "Vote", "Pitch", "Winner", "Go"] as const;

function showdownStepIndex(raid: Raid): number {
  switch (raid.phase) {
    case "showdown-browse":
      return 0;
    case "vote":
      return raid.poll?.round === 2 ? 3 : 1;
    case "showdown-accept":
      return 1;
    case "showdown-pitch":
      return 2;
    case "countdown":
    case "landed":
      return 4;
    default:
      return 0;
  }
}

// Section 5.2: the showdown is the only mode with enough steps to need a tracker. The other
// three modes already say where they are in the banner text alone.
function ShowdownProgress({ raid }: { raid: Raid }) {
  const index = showdownStepIndex(raid);
  return (
    <div className="mb-1.5 flex gap-1" aria-hidden="true">
      {SHOWDOWN_STEPS.map((step, i) => (
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
    raid.phase === "countdown"
      ? "Raid incoming"
      : raid.phase === "landed"
        ? "Mission accomplished"
        : bannerText(raid);

  return (
    <div className="shrink-0 border-t border-outline-decorative bg-surface-base px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">{panelHeader}</span>
        {raid.seconds > 0 && raid.phase !== "countdown" && raid.phase !== "showdown-browse" && (
          <span className="shrink-0 text-xs font-bold tabular-nums text-primary-base">
            {clock(raid.seconds)}
          </span>
        )}
      </div>

      {raid.mode === "showdown" && <ShowdownProgress raid={raid} />}

      <div className="flex flex-col gap-2">
        <Body raid={raid} />
      </div>
    </div>
  );
}

// Section 13: a floating, out-of-the-way way to skip any raid timer, since real countdowns,
// previews, and pitches run to the real clock. Mounted once at the app root so it works
// wherever a raid is running, not just inside the chat column.
export function RaidDevControls() {
  const { raid, act, invite, inviteShowdown, skipInvite } = useRaid();
  const [prefs] = usePrefs();
  const running = raid && raid.seconds > 0;

  return (
    <div className="z-popover fixed bottom-4 left-4 flex items-center gap-2 rounded-lg bg-surface-highest px-3 py-2 shadow-2xl">
      <span className="text-xs font-semibold uppercase text-surface-onSurfaceSecondary">Demo</span>
      {(running || invite) && (
        <button
          type="button"
          onClick={() => {
            if (running) act((r) => advance({ ...r, seconds: 0 }));
            if (invite) skipInvite();
          }}
          className="state-layer-base rounded bg-primary-base px-2 py-1 text-xs font-semibold text-primary-onPrimary"
        >
          Skip timer
        </button>
      )}
      <button
        type="button"
        onClick={inviteShowdown}
        disabled={Boolean(invite) || !prefs.joinShowdowns}
        title={
          prefs.joinShowdowns
            ? "A bigger channel puts you in a showdown"
            : "Join showdowns is off in Settings, so no invite can arrive"
        }
        className="state-layer-surface rounded border border-outline-decorative px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
      >
        Incoming showdown
      </button>
    </div>
  );
}
