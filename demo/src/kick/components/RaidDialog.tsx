import { useEffect, useMemo, useState } from "react";
import { Icon } from "../Icon";
import { RouletteReel } from "./RouletteReel";
import { formatDuration, formatViewers, liveSeconds, streamPills, timeAgo } from "../mock/api";
import {
  findHandle,
  raidHistoryFor,
  recommendationsFor,
  tankCandidates,
  type Candidate,
} from "../mock/raids";
import { useRaid } from "../raid/RaidProvider";
import { BREAK_DURATION_DEFAULT, BREAK_DURATION_PRESETS } from "../raid/break";
import { MIN_HOST_VIEWERS, type RaidMode } from "../raid/machine";

const modes: { id: RaidMode; label: string; outcome: string; timing: string; action: string }[] = [
  {
    id: "random",
    label: "Random",
    outcome: "Kick picks a channel at random.",
    timing: "15s countdown. No preview, no vote.",
    action: "Roll and raid",
  },
  {
    id: "pick",
    label: "Pick",
    outcome: "You choose the channel.",
    timing: "Search, filter, or type a handle.",
    action: "Raid",
  },
  {
    id: "chat",
    label: "Chat pick",
    outcome: "Chat votes for the best of three, after a preview.",
    timing: "Pick 3, then 30s preview each, one vote.",
    action: "Chat pick",
  },
  {
    id: "tank",
    label: "Raid tank",
    outcome: "Pick 10. Chat votes 2 into a pitch off.",
    timing: "60s pitch each, then chat picks the winner.",
    action: "Open the raid tank",
  },
];

const maxPicksFor = (mode: RaidMode) => ({ random: 0, pick: 1, chat: 3, tank: 10 })[mode];

type SortKey = "recommended" | "viewers" | "live" | "az" | "lastRaided" | "mostRaids";
type ViewMode = "grid" | "list";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "viewers", label: "Most viewers" },
  { id: "live", label: "Longest live" },
  { id: "az", label: "A to Z" },
  { id: "lastRaided", label: "Last raided" },
  { id: "mostRaids", label: "Most raids from" },
];

function sortCandidates(candidates: Candidate[], sort: SortKey): Candidate[] {
  const list = [...candidates];
  switch (sort) {
    case "viewers":
      return list.sort((a, b) => b.stream.viewer_count - a.stream.viewer_count);
    case "live":
      return list.sort(
        (a, b) => new Date(a.stream.started_at).getTime() - new Date(b.stream.started_at).getTime(),
      );
    case "az":
      return list.sort((a, b) => a.stream.channel.username.localeCompare(b.stream.channel.username));
    case "lastRaided":
      return list.sort((a, b) => {
        const aAt = raidHistoryFor(a.stream.channel.slug).lastAt;
        const bAt = raidHistoryFor(b.stream.channel.slug).lastAt;
        return (bAt ? new Date(bAt).getTime() : 0) - (aAt ? new Date(aAt).getTime() : 0);
      });
    case "mostRaids":
      return list.sort(
        (a, b) =>
          raidHistoryFor(b.stream.channel.slug).count - raidHistoryFor(a.stream.channel.slug).count,
      );
    default:
      return list;
  }
}

const HOST_CATEGORY_SLUG = "just-chatting";

function EventTag({ event }: { event?: string }) {
  if (!event) return null;
  return (
    <span className="whitespace-nowrap rounded bg-primary-base px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-onPrimary">
      {event}
    </span>
  );
}

function HighlightPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-primary-base px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-onPrimary">
      {children}
    </span>
  );
}

function CandidateCard({
  candidate,
  picked,
  view,
  mostSimilar,
  mostRecentRaider,
  onSelect,
}: {
  candidate: Candidate;
  picked: boolean;
  view: ViewMode;
  mostSimilar: boolean;
  mostRecentRaider: boolean;
  onSelect: () => void;
}) {
  const { channel, viewer_count, session_title, thumbnail, hide_viewer_count, started_at, event } =
    candidate.stream;
  const liveFor = formatDuration(liveSeconds(started_at));
  const pills = streamPills(candidate.stream);
  const history = raidHistoryFor(channel.slug);

  if (view === "list") {
    return (
      <button
        type="button"
        aria-pressed={picked}
        onClick={onSelect}
        className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
          picked ? "bg-surface-highest" : "bg-transparent betterhover:hover:bg-surface-highest"
        }`}
      >
        <div className="aspect-video w-56 shrink-0 overflow-hidden rounded-lg bg-surface-lowest">
          <img src={thumbnail} alt="" className="h-full w-full object-cover" />
        </div>
        <img src={channel.avatar} alt="" className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-white">{channel.username}</span>
            {channel.verified && <Icon name="verified" className="size-3.5 shrink-0" />}
          </div>
          <span className="block truncate text-sm text-white">{session_title}</span>
          <span className="block truncate text-sm text-surface-onSurfaceSecondary">
            {candidate.reason}
          </span>
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <EventTag event={event} />
            {mostSimilar && <HighlightPill>Most similar to you</HighlightPill>}
            {mostRecentRaider && <HighlightPill>Most recent raider</HighlightPill>}
            {pills.map((pill) => (
              <span
                key={pill}
                className="whitespace-nowrap rounded-full bg-secondary-base px-1.5 py-0.5 text-[11px] leading-none text-secondary-onSecondary"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {!hide_viewer_count && (
            <span className="flex items-center gap-1 text-sm font-semibold text-white">
              <span className="size-2 rounded-full bg-red-500" />
              {formatViewers(viewer_count)}
            </span>
          )}
          <span className="text-xs text-surface-onSurfaceSecondary">Live {liveFor}</span>
          {history.count > 0 && (
            <span className="text-xs font-bold text-primary-base">Raided you {history.count}x</span>
          )}
          {history.lastAt && (
            <span className="text-xs text-surface-onSurfaceSecondary">
              Last raided {timeAgo(history.lastAt)}
            </span>
          )}
        </div>
        {picked && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-base text-sm font-bold text-primary-onPrimary">
            &#10003;
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={picked}
      onClick={onSelect}
      className={`flex flex-col gap-2 rounded-lg p-2 text-left transition-colors ${
        picked ? "bg-surface-highest" : "bg-transparent betterhover:hover:bg-surface-highest"
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-lowest">
        <img src={thumbnail} alt="" className="h-full w-full object-cover" />
        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1 text-xs font-semibold uppercase leading-5 text-primary-base">
          Live
        </span>
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1 text-xs font-semibold leading-5 text-white">
          {liveFor}
        </span>
        {!hide_viewer_count && (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/70 px-1 text-xs font-semibold leading-5 text-white">
            <span className="size-2 rounded-full bg-red-500" />
            {formatViewers(viewer_count)}
          </span>
        )}
        {picked && (
          <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary-base text-sm font-bold text-primary-onPrimary">
            &#10003;
          </span>
        )}
      </div>
      <div className="flex items-start gap-2">
        <img src={channel.avatar} alt="" className="size-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-white">{channel.username}</span>
            {channel.verified && <Icon name="verified" className="size-3.5 shrink-0" />}
          </div>
          <span className="block truncate text-xs text-surface-onSurfaceSecondary">{session_title}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <EventTag event={event} />
        {mostSimilar && <HighlightPill>Most similar to you</HighlightPill>}
        {mostRecentRaider && <HighlightPill>Most recent raider</HighlightPill>}
        {pills.map((pill) => (
          <span
            key={pill}
            className="whitespace-nowrap rounded-full bg-secondary-base px-1.5 py-0.5 text-[11px] leading-none text-secondary-onSecondary"
          >
            {pill}
          </span>
        ))}
      </div>
      <span className="truncate text-xs text-surface-onSurfaceSecondary">{candidate.reason}</span>
      {history.count > 0 && (
        <span className="truncate text-xs font-bold text-primary-base">
          Raided you {history.count}x
        </span>
      )}
      {history.lastAt && (
        <span className="truncate text-xs text-surface-onSurfaceSecondary">
          Last raided {timeAgo(history.lastAt)}
        </span>
      )}
    </button>
  );
}

function CandidateBrowse({
  candidates,
  picked,
  maxPicks,
  onToggle,
}: {
  candidates: Candidate[];
  picked: string[];
  maxPicks: number;
  onToggle: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [view, setView] = useState<ViewMode>("list");

  const categories = useMemo(
    () => [...new Set(candidates.map((c) => c.stream.category.name))].sort(),
    [candidates],
  );

  // Section 7.4: candidates arrive already sorted by recommendation score, so the first one
  // is the closest content match for this host.
  const mostSimilarSlug = useMemo(
    () => candidates.find((c) => c.stream.category.slug === HOST_CATEGORY_SLUG)?.stream.channel.slug,
    [candidates],
  );
  const mostRecentRaiderSlug = useMemo(() => {
    let best: { slug: string; at: number } | null = null;
    for (const c of candidates) {
      const history = raidHistoryFor(c.stream.channel.slug);
      if (!history.lastAt) continue;
      const at = new Date(history.lastAt).getTime();
      if (!best || at > best.at) best = { slug: c.stream.channel.slug, at };
    }
    return best?.slug;
  }, [candidates]);

  const q = query.trim().toLowerCase();
  const filtered = candidates.filter((c) => {
    if (category && c.stream.category.name !== category) return false;
    if (!q) return true;
    return (
      c.stream.channel.username.toLowerCase().includes(q) ||
      c.stream.session_title.toLowerCase().includes(q) ||
      c.stream.category.name.toLowerCase().includes(q)
    );
  });
  const sorted = sortCandidates(filtered, sort);
  const handleResult = q ? findHandle(query) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2 pr-12">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search channels or type a handle"
          className="h-9 flex-1 rounded-md bg-surface-lowest px-4 text-sm text-white outline-none"
        />
        <div className="relative h-9 w-40 shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 w-full appearance-none rounded-md bg-surface-lowest py-2 pl-3 pr-8 text-sm text-white outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-right"
            className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 rotate-90 text-surface-onSurfaceSecondary"
          />
        </div>
        <div className="flex h-9 shrink-0 items-center gap-0.5 rounded-md bg-surface-lowest p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex h-full items-center rounded px-3 text-xs font-semibold transition-colors ${view === "list" ? "bg-secondary-base text-white" : "text-surface-onSurfaceSecondary"}`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex h-full items-center rounded px-3 text-xs font-semibold transition-colors ${view === "grid" ? "bg-secondary-base text-white" : "text-surface-onSurfaceSecondary"}`}
          >
            Grid
          </button>
        </div>
        {maxPicks > 1 && (
          <span className="shrink-0 text-sm font-semibold text-surface-onSurfaceSecondary">
            {picked.length} of {maxPicks} picked
          </span>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            category === null
              ? "bg-secondary-base text-white"
              : "bg-surface-lowest text-surface-onSurfaceSecondary betterhover:hover:bg-surface-highest"
          }`}
        >
          All categories
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(category === c ? null : c)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
              category === c
                ? "bg-secondary-base text-white"
                : "bg-surface-lowest text-surface-onSurfaceSecondary betterhover:hover:bg-surface-highest"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {sorted.length > 0 ? (
          <div className={view === "grid" ? "grid grid-cols-3 gap-2" : "flex flex-col gap-1"}>
            {sorted.map((c) => (
              <CandidateCard
                key={c.stream.channel.slug}
                candidate={c}
                view={view}
                picked={picked.includes(c.stream.channel.slug)}
                mostSimilar={c.stream.channel.slug === mostSimilarSlug}
                mostRecentRaider={c.stream.channel.slug === mostRecentRaiderSlug}
                onSelect={() => onToggle(c.stream.channel.slug)}
              />
            ))}
          </div>
        ) : handleResult?.found && !handleResult.live ? (
          <div className="flex items-center gap-3 rounded-lg bg-surface-lowest p-2">
            <img src={handleResult.avatar} alt="" className="size-10 shrink-0 rounded-full grayscale" />
            <span className="flex-1 text-sm font-bold text-white">{handleResult.username}</span>
            <span className="rounded bg-secondary-base px-2 py-1 text-xs font-semibold uppercase text-secondary-onSecondary">
              Offline
            </span>
          </div>
        ) : (
          <p className="text-sm text-surface-onSurfaceSecondary">
            {q ? "No channel with that handle." : "No live channels match these filters."}
          </p>
        )}
      </div>
    </div>
  );
}

function RandomPool({
  candidates,
  commitSlug,
  onLanded,
}: {
  candidates: Candidate[];
  commitSlug?: string | null;
  onLanded?: () => void;
}) {
  const pool = candidates.slice(0, 16);
  if (pool.length === 0) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <span className="shrink-0 text-sm text-surface-onSurfaceSecondary">
        {commitSlug ? "Rolling..." : "Rolls from channels that are live now."}
      </span>
      <RouletteReel candidates={pool} commitSlug={commitSlug} onLanded={onLanded} />
      <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-4 gap-2 overflow-y-auto">
        {pool.map((c) => (
          <div
            key={c.stream.channel.slug}
            className="flex items-center gap-2 rounded-lg bg-surface-lowest p-2"
          >
            <img src={c.stream.channel.avatar} alt="" className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">
                {c.stream.channel.username}
              </span>
              <span className="block truncate text-xs text-surface-onSurfaceSecondary">
                {formatViewers(c.stream.viewer_count)} watching
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RaidDialog() {
  const { dialog, dismissDialog, start, startBreak, hostViewers, hostSlug, setPreview } = useRaid();
  const [mode, setMode] = useState<RaidMode>("random");
  const [picked, setPicked] = useState<string[]>([]);
  const [rollingSlug, setRollingSlug] = useState<string | null>(null);
  const [breakDuration, setBreakDuration] = useState(BREAK_DURATION_DEFAULT);
  const [customBreak, setCustomBreak] = useState(false);

  // Section 5.1: the dialog never unmounts, it just stops rendering, so closing it (a
  // dismiss, or a raid actually starting) has to clear its own picks and roll state. Without
  // this a second raid opens mid-roll, every button disabled, until the page is refreshed.
  useEffect(() => {
    if (dialog) return;
    setMode("random");
    setPicked([]);
    setRollingSlug(null);
    setBreakDuration(BREAK_DURATION_DEFAULT);
    setCustomBreak(false);
  }, [dialog]);

  if (!dialog) return null;

  const all = recommendationsFor(hostSlug, hostViewers);
  const candidates = mode === "tank" ? tankCandidates(all) : all;
  const enough = hostViewers >= MIN_HOST_VIEWERS;
  const current = modes.find((m) => m.id === mode)!;
  const maxPicks = maxPicksFor(mode);
  // A break dialog never touches `mode` (it stays at its default), so it needs its own cap
  // instead of maxPicksFor("random"), which is 0.
  const pickCap = dialog === "break" ? 3 : maxPicks;
  const pickedCandidate = candidates.find((c) => c.stream.channel.slug === picked[0]);
  const ready = enough && (maxPicks === 0 || picked.length === maxPicks) && !rollingSlug;
  const action =
    rollingSlug
      ? "Rolling..."
      : mode === "pick" && pickedCandidate
        ? `Raid ${pickedCandidate.stream.channel.username}`
        : maxPicks > 1 && picked.length < maxPicks
          ? `Select ${maxPicks - picked.length} more`
          : current.action;

  function chooseMode(next: RaidMode) {
    setMode(next);
    setPicked([]);
    setPreview(null);
    setRollingSlug(null);
  }

  function rollAndRaid() {
    const pool = candidates.slice(0, 10);
    if (pool.length === 0) return;
    const winner = pool[Math.floor(Math.random() * pool.length)];
    setRollingSlug(winner.stream.channel.slug);
  }

  function handleRolled() {
    if (!rollingSlug) return;
    setPreview(null);
    start("random", rollingSlug);
  }

  function toggle(slug: string) {
    setPicked((prev) => {
      if (pickCap === 1) return [slug];
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= pickCap) return prev;
      return [...prev, slug];
    });
    setPreview(slug);
  }

  function autoSelectTen() {
    setPicked(candidates.slice(0, 10).map((c) => c.stream.channel.slug));
  }

  if (dialog === "break") {
    const breakReady = enough && picked.length > 0 && picked.length <= 3;
    return (
      <div className="z-popover fixed inset-0 flex items-center justify-center bg-surfaceOverlay-base p-4">
        <div className="relative flex max-h-full w-full max-w-[820px] flex-col overflow-hidden rounded-xl bg-surface-base shadow-2xl">
          <div className="absolute right-5 top-[17px] z-20">
            <button
              type="button"
              aria-label="Close"
              onClick={dismissDialog}
              className="flex size-8 items-center justify-center text-white"
            >
              <Icon name="close" className="size-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3 p-5 pb-0">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold leading-5 text-white">Take a break</h2>
              <span className="text-sm text-surface-onSurfaceSecondary">
                Pick up to 3 channels to offer chat while you're away. Nobody is
                forced off your channel.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold uppercase text-surface-onSurfaceSecondary">
                Back in
              </span>
              {BREAK_DURATION_PRESETS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => {
                    setCustomBreak(false);
                    setBreakDuration(seconds);
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    !customBreak && breakDuration === seconds
                      ? "bg-secondary-base text-white"
                      : "bg-surface-lowest text-surface-onSurfaceSecondary betterhover:hover:bg-surface-highest"
                  }`}
                >
                  {seconds / 60} min
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomBreak(true)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  customBreak
                    ? "bg-secondary-base text-white"
                    : "bg-surface-lowest text-surface-onSurfaceSecondary betterhover:hover:bg-surface-highest"
                }`}
              >
                Custom
              </button>
              {customBreak && (
                <div className="flex items-center gap-1.5 rounded-full bg-surface-lowest py-1 pl-2.5 pr-1.5">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={Math.round(breakDuration / 60)}
                    onChange={(e) => {
                      const minutes = Math.min(60, Math.max(1, Number(e.target.value) || 1));
                      setBreakDuration(minutes * 60);
                    }}
                    className="h-5 w-8 bg-transparent text-right text-xs font-semibold text-white outline-none"
                  />
                  <span className="text-xs font-semibold text-surface-onSurfaceSecondary">min</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex h-[440px] flex-col p-5">
            {!enough ? (
              <p className="text-sm leading-6 text-surface-onSurfaceSecondary">
                A break needs at least {MIN_HOST_VIEWERS} viewers. You have{" "}
                {formatViewers(hostViewers)}.
              </p>
            ) : (
              <CandidateBrowse candidates={candidates} picked={picked} maxPicks={3} onToggle={toggle} />
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t-2 border-outline-decorative p-5">
            <button
              type="button"
              disabled={!breakReady}
              onClick={() => {
                setPreview(null);
                startBreak(picked, breakDuration);
              }}
              className="state-layer-base h-11 w-full rounded-md bg-primary-base text-base font-semibold text-primary-onPrimary disabled:bg-disabled-base disabled:text-disabled-onSurface"
            >
              {picked.length === 0 ? "Pick at least one channel" : `Start break with ${picked.length}`}
            </button>
            <button
              type="button"
              onClick={dismissDialog}
              className="h-9 w-full rounded-md text-sm font-semibold text-surface-onSurfaceSecondary betterhover:hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="z-popover fixed inset-0 flex items-center justify-center bg-surfaceOverlay-base p-4">
      <div className="relative flex max-h-full w-full max-w-[1180px] overflow-hidden rounded-xl bg-surface-base shadow-2xl">
        <div className="absolute right-5 top-[17px] z-20">
          <button
            type="button"
            aria-label="Close"
            onClick={dismissDialog}
            className="flex size-8 items-center justify-center text-white"
          >
            <Icon name="close" className="size-3.5" />
          </button>
        </div>

        <div className="flex w-64 shrink-0 flex-col gap-4 bg-surface-lowest p-5">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-lg font-bold leading-5 text-white">
              {dialog === "end" ? "Send your viewers somewhere" : "Raid channel"}
            </h2>
            <span className="text-sm text-surface-onSurfaceSecondary">
              {dialog === "end"
                ? "Your stream is ending. Hand your chat to a live creator."
                : "Send your chat to another live channel."}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!enough || Boolean(rollingSlug)}
                onClick={() => chooseMode(m.id)}
                className={`flex w-full flex-col items-start gap-1 rounded-lg p-3 text-left transition-colors disabled:cursor-default disabled:opacity-50 ${
                  m.id === mode
                    ? "bg-secondary-base"
                    : "bg-transparent betterhover:hover:bg-surface-highest"
                }`}
              >
                <span className="text-sm font-bold text-white">{m.label}</span>
                <span className="text-xs leading-snug text-surface-onSurfaceSecondary">{m.outcome}</span>
                <span className="text-xs leading-snug text-surface-onSurfaceSecondary">{m.timing}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="flex h-[500px] flex-col gap-3 overflow-hidden">
            {!enough ? (
              <p className="text-sm leading-6 text-surface-onSurfaceSecondary">
                A raid needs at least {MIN_HOST_VIEWERS} viewers. You have{" "}
                {formatViewers(hostViewers)}, so the raid controls stay off until more people
                arrive.
              </p>
            ) : mode === "random" ? (
              <RandomPool candidates={candidates} commitSlug={rollingSlug} onLanded={handleRolled} />
            ) : (
              <CandidateBrowse
                candidates={candidates}
                picked={picked}
                maxPicks={maxPicks}
                onToggle={toggle}
              />
            )}
          </div>

          <div className="mt-auto flex shrink-0 flex-col gap-2 pt-4">
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                if (mode === "random") {
                  rollAndRaid();
                  return;
                }
                setPreview(null);
                if (mode === "pick") start(mode, picked[0]);
                else if (mode === "chat" || mode === "tank") start(mode, undefined, picked);
              }}
              className="state-layer-base h-11 w-full rounded-md bg-primary-base text-base font-semibold text-primary-onPrimary disabled:bg-disabled-base disabled:text-disabled-onSurface"
            >
              {action}
            </button>
            <button
              type="button"
              onClick={dismissDialog}
              className="h-9 w-full rounded-md text-sm font-semibold text-surface-onSurfaceSecondary betterhover:hover:text-white"
            >
              {dialog === "end" ? "End without raiding" : "Not now"}
            </button>
          </div>
        </div>
      </div>

      {mode === "tank" && (
        // Section 5.1: bottom-4 left-4 is also where the skip-timer panel sits when a previous
        // raid is still active behind this dialog. Stacked higher, so the two never overlap.
        <div className="z-popover fixed bottom-20 left-4 flex items-center gap-2 rounded-lg bg-surface-highest px-3 py-2 shadow-2xl">
          <span className="text-xs font-semibold uppercase text-surface-onSurfaceSecondary">Demo</span>
          <button
            type="button"
            onClick={autoSelectTen}
            className="state-layer-base rounded bg-primary-base px-2 py-1 text-xs font-semibold text-primary-onPrimary"
          >
            Auto-select 10
          </button>
        </div>
      )}
    </div>
  );
}
