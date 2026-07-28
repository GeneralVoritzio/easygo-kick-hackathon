import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { formatViewers, streamPills, type Livestream } from "../mock/api";
import { useRaid } from "../raid/RaidProvider";
import {
  advance,
  canReroll,
  candidateFor,
  castVote,
  channelOffline,
  justRaidThem,
  openTankVote,
  tryAnother,
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
      return "Raid tank is open";
    case "vote":
      return raid.poll?.picks === 2 ? "Chat is picking 2 of 10" : "Chat is voting";
    case "tank-accept":
      return "Waiting on the creators";
    case "tank-fork":
      return "One creator declined";
    case "tank-pitch":
      return `${nameOf(raid, raid.finalists[raid.pitchIndex])} is pitching`;
    case "reveal":
      return "And the raid goes to";
    case "countdown":
      return `Raiding ${target}`;
    case "landed":
      return `Raid landed on ${target}`;
    default:
      return "Raid cancelled";
  }
}

// Section 5.2: the banner carries the persistent state, because KICK's footer panels overlay
// the chat messages and a permanently open panel would hide chat for the whole raid.
export function RaidBanner({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { raid } = useRaid();
  if (!raid) return null;

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-outline-decorative bg-surface-highest px-3 py-2">
      <Icon name="dash-broadcast" className="size-4 shrink-0 text-primary-base" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
        {bannerText(raid)}
      </span>
      {raid.seconds > 0 && (
        <span className="shrink-0 text-sm font-bold tabular-nums text-primary-base">
          {clock(raid.seconds)}
        </span>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="state-layer-surface shrink-0 rounded px-2 py-1 text-sm font-semibold text-white"
      >
        {open ? "Hide" : "Open"}
      </button>
    </div>
  );
}

function PollRows({ raid, poll }: { raid: Raid; poll: Poll }) {
  const { act } = useRaid();
  const total = Object.values(poll.votes).reduce((sum, n) => sum + n, 0) || 1;

  return (
    <div className="flex flex-col gap-1.5">
      {poll.options.map((slug) => {
        const votes = poll.votes[slug] ?? 0;
        const percent = Math.round((votes / total) * 100);
        const mine = poll.myVote === slug;
        return (
          <button
            key={slug}
            type="button"
            disabled={Boolean(poll.myVote)}
            onClick={() => act((r) => castVote(r, slug))}
            className={`relative overflow-hidden rounded border px-2 py-1.5 text-left ${
              mine ? "border-primary-base" : "border-outline-decorative"
            } disabled:cursor-default`}
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary-base/20"
              style={{ width: `${percent}%` }}
            />
            <div className="relative flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                {nameOf(raid, slug)}
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-white">{percent}%</span>
              <span className="shrink-0 text-xs tabular-nums text-surface-onSurfaceSecondary">
                {formatViewers(votes)}
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
function Reel({ raid }: { raid: Raid }) {
  const names = raid.candidates.slice(0, 8).map((c) => c.stream.channel.username);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => i + 1), 90);
    return () => clearInterval(id);
  }, []);

  const landed = raid.seconds <= 1;
  const shown = landed ? nameOf(raid, raid.targetSlug) : names[index % names.length];

  return (
    <div className="flex h-16 items-center justify-center rounded bg-surface-lowest">
      <span
        className={`text-lg font-bold ${landed ? "text-primary-base" : "text-white opacity-60"}`}
      >
        {shown}
      </span>
    </div>
  );
}

function TargetCard({ raid }: { raid: Raid }) {
  const target = candidateFor(raid, raid.targetSlug ?? "");
  if (!target) return null;
  return (
    <div className="flex items-center gap-3">
      <img src={target.stream.channel.avatar} alt="" className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">
          {target.stream.channel.username}
        </span>
        <span className="block truncate text-xs text-surface-onSurfaceSecondary">
          {formatViewers(target.stream.viewer_count)} watching
        </span>
      </div>
    </div>
  );
}

function Countdown({ raid }: { raid: Raid }) {
  const { targetIsHidden, join, leave, joined, act } = useRaid();
  const target = candidateFor(raid, raid.targetSlug ?? "");
  if (!target) return null;

  return (
    <div className="flex flex-col gap-3">
      <TargetCard raid={raid} />
      {joined === false ? (
        <span className="text-sm text-surface-onSurfaceSecondary">
          You are staying here. Chat goes without you.
        </span>
      ) : targetIsHidden && joined !== true ? (
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
            onClick={() => act((r) => advance({ ...r, seconds: 0 }))}
            className="state-layer-base h-9 flex-1 rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
          >
            Go now
          </button>
          <button
            type="button"
            onClick={leave}
            className="h-9 flex-1 rounded bg-secondary-base text-sm font-semibold text-secondary-onSecondary"
          >
            Leave
          </button>
        </div>
      )}
    </div>
  );
}

function StreamerControls({ raid }: { raid: Raid }) {
  const { act } = useRaid();

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
    <div className="flex flex-col gap-2">
      <span className="text-sm text-surface-onSurfaceSecondary">
        {nameOf(raid, raid.declined[raid.declined.length - 1])} is out. Refill the slot, or take
        the raid to the creator who accepted.
      </span>
      <button
        type="button"
        disabled={!canReroll(raid)}
        onClick={() => act(tryAnother)}
        className="h-9 w-full rounded bg-secondary-base text-sm font-semibold text-secondary-onSecondary disabled:bg-disabled-base disabled:text-disabled-onSurface"
      >
        Try another ({raid.rerolls} of 3 used)
      </button>
      <button
        type="button"
        onClick={() => act(justRaidThem)}
        className="state-layer-base h-9 w-full rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
      >
        Just raid {nameOf(raid, raid.accepted[0])}
      </button>
    </div>
  );
}

function Body({ raid }: { raid: Raid }) {
  const { joined, targetIsHidden, openDialog, clear } = useRaid();

  switch (raid.phase) {
    case "preview":
      return (
        <span className="text-sm text-surface-onSurfaceSecondary">
          The poll is closed while the previews run. Everyone votes on the same information.
        </span>
      );
    case "tank-browse":
      return (
        <span className="text-sm text-surface-onSurfaceSecondary">
          {raid.viewer
            ? "Ten channels are in the player. The streamer opens the vote when they are ready."
            : "Ten channels are in the player. Watch any of them, then open the vote and chat picks two."}
        </span>
      );
    case "tank-fork":
      return raid.viewer ? (
        <span className="text-sm text-surface-onSurfaceSecondary">
          {nameOf(raid, raid.declined[raid.declined.length - 1])} is out. The streamer is
          deciding what happens to the open slot.
        </span>
      ) : null;
    case "vote":
      return raid.poll ? <PollRows raid={raid} poll={raid.poll} /> : null;
    case "tank-accept":
      return (
        <div className="flex flex-col gap-1.5">
          {raid.finalists.map((slug) => (
            <div key={slug} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                {nameOf(raid, slug)}
              </span>
              <span
                className={`shrink-0 text-xs font-semibold uppercase ${
                  raid.accepted.includes(slug)
                    ? "text-surface-onSurfacePositive"
                    : "text-surface-onSurfaceSecondary"
                }`}
              >
                {raid.accepted.includes(slug) ? "Accepted" : "Waiting"}
              </span>
            </div>
          ))}
        </div>
      );
    case "tank-pitch":
      return (
        <span className="text-sm text-surface-onSurfaceSecondary">
          {nameOf(raid, raid.finalists[raid.pitchIndex])} has 60 seconds to say why they deserve
          the raid. The vote opens after both pitches.
        </span>
      );
    case "reveal":
      return <Reel raid={raid} />;
    case "countdown":
      return <Countdown raid={raid} />;
    case "landed":
      return (
        <div className="flex flex-col gap-3">
          <TargetCard raid={raid} />
          <span className="text-sm text-surface-onSurfaceSecondary">
            {(joined ?? !targetIsHidden)
              ? "You were carried across with the rest of chat."
              : "You are still here. Nothing moved you."}
          </span>
          <button
            type="button"
            onClick={clear}
            className="h-9 w-full rounded bg-secondary-base text-sm font-semibold text-secondary-onSecondary"
          >
            Done
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
    { id: "tank", label: "Raid tank" },
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

// Section 5.2: the panel above the chat input carries the detail on demand. Closing it never
// cancels the raid.
export function RaidPanel({ onClose }: { onClose: () => void }) {
  const { raid, act } = useRaid();
  if (!raid) return null;

  const skippable = raid.seconds > 0;

  return (
    <div className="shrink-0 border-t border-outline-decorative bg-surface-base px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-bold text-white">{bannerText(raid)}</span>
        <button
          type="button"
          aria-label="Close raid panel"
          onClick={onClose}
          className="state-layer-surface flex size-6 shrink-0 items-center justify-center rounded text-white"
        >
          <Icon name="close" className="size-3" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Body raid={raid} />
        <StreamerControls raid={raid} />

        {/* Section 13: the logic is real, the timing is scripted, and the pitch says so. */}
        <div className="flex items-center gap-2 border-t border-outline-decorative pt-2">
          <span className="text-xs uppercase text-surface-onSurfaceSecondary">Demo</span>
          {skippable && (
            <button
              type="button"
              onClick={() => act((r) => advance({ ...r, seconds: 0 }))}
              className="rounded bg-secondary-base px-2 py-1 text-xs font-semibold text-secondary-onSecondary"
            >
              Skip ahead
            </button>
          )}
          {raid.phase === "countdown" && (
            <button
              type="button"
              onClick={() => act((r) => channelOffline(r, r.targetSlug ?? ""))}
              className="rounded bg-secondary-base px-2 py-1 text-xs font-semibold text-secondary-onSecondary"
            >
              Target goes offline
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
