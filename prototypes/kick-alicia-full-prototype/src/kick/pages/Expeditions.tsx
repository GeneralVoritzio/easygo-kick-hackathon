import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { PageShell } from "../components/Layout";
import { useExpeditions } from "../expedition/ExpeditionContext";
import { colorFor } from "../mock/chatIdentities";
import {
  ENDING_SOON_DEMO_EXPEDITION_ID,
  findHandoffCandidates,
  formatCountdown,
  waitlistSize,
  type Expedition,
  type ExpeditionKind,
  type ExpeditionVisibility,
  type StopDurationMode,
} from "../expedition/data";

type KickingFilter = "all" | "on" | "off";

// Only ever the one seeded expedition set aside to demo it — a plain threshold check would also
// light up on any other expedition whenever its own countdown happens to drift under 15s, which
// reads as random rather than a reliable demo.
function isEndingSoon(exp: Expedition): boolean {
  return exp.id === ENDING_SOON_DEMO_EXPEDITION_ID;
}

// What handing off leadership is doing right now, for whichever one card triggered it — a list
// to pick a new leader from, or, only once nobody is free to take over, the end-it fallback.
type LeadershipStep =
  | { kind: "picking"; candidates: string[]; selected: string }
  | { kind: "noCandidate" }
  | { kind: "confirmEnd" };

function FilterPill<T extends string>({
  value,
  current,
  onSelect,
  children,
}: {
  value: T;
  current: T;
  onSelect: (v: T) => void;
  children: ReactNode;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
        active
          ? "bg-primary-base text-primary-onPrimary"
          : "bg-surface-highest text-subtle betterhover:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-subtle">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// A saved-but-unpublished expedition: no countdown, no viewer count, nothing to join yet —
// just enough of a preview to tell drafts apart, plus the two things you can do with one.
// "Continue" goes back into the create form, prefilled, rather than publishing it outright.
function DraftCard({
  exp,
  onDelete,
}: {
  exp: Expedition;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-outline-decorative bg-surface-base p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-sm font-bold text-white">{exp.name}</h2>
        <span className="shrink-0 rounded-full border border-outline-decorative px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-subtle">
          Draft
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            exp.kind === "quick" ? "bg-secondary-base text-white" : "bg-purple-500/15 text-purple-300"
          }`}
        >
          {exp.kind === "quick" ? "Quick" : "Custom"}
        </span>
        {exp.visibility === "private" && (
          <span className="rounded-full border border-outline-decorative px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-subtle">
            Private
          </span>
        )}
      </div>

      {exp.stops.length > 0 && (
        <div className="flex -space-x-2">
          {exp.stops.slice(0, 6).map((stream) => (
            <div
              key={stream.channel.slug}
              title={stream.channel.username}
              style={{ background: colorFor(stream.channel.username) }}
              className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-surface-base text-[9px] font-black text-black"
            >
              {stream.channel.username.slice(0, 2).toUpperCase()}
            </div>
          ))}
        </div>
      )}

      <div className="mt-1 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-outline-decorative px-3 py-2 text-xs font-bold text-red-400 transition-colors betterhover:hover:bg-red-500/10"
        >
          Delete
        </button>
        <Link
          to={`/expeditions/new?draft=${exp.id}`}
          className="rounded-lg bg-primary-base px-3 py-2 text-xs font-bold text-primary-onPrimary betterhover:hover:bg-green-400"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}

/*
  The Kick Expedition lobby: every expedition on the platform right now, boarding or already
  under way. Joining a boarding one drops you into its waiting room to watch the departure timer
  count down; joining one that's in-progress drops you straight into the current stop, mid-
  journey. Ported from kick-web-redesign's ExpeditionsPage.tsx. The header follows the same
  plain page-title pattern every other page here uses (Following.tsx, SettingsProfile.tsx) —
  no icon badge beside the title, that reads as this project's own invention, not kick.com's.
*/
export function Expeditions() {
  const {
    expeditions: allExpeditions,
    join,
    joinWaitlist,
    waitlistedExpeditionId,
    provisionalRiderId,
    handOffLeadership,
    endExpedition,
    deleteDraft,
    kickedExpeditionIds,
  } = useExpeditions();
  // A draft only ever shows up for the viewer who saved it — nobody else ever creates one here.
  // Unlisted never shows up here at all — that's a Kick Break, reached only by the redirect that
  // starts it.
  const expeditions = allExpeditions.filter((e) => e.visibility !== "unlisted" && (!e.isDraft || e.createdByViewer));
  const draftExpeditions = expeditions.filter((e) => e.isDraft);
  const liveExpeditions = expeditions.filter((e) => !e.isDraft);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState<ExpeditionKind | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<ExpeditionVisibility | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState<StopDurationMode | "all">("all");
  const [kickingFilter, setKickingFilter] = useState<KickingFilter>("all");
  const [gatingId, setGatingId] = useState<string | null>(null);
  const [credential, setCredential] = useState("");
  const [gateError, setGateError] = useState(false);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [leadershipFor, setLeadershipFor] = useState<{ id: string; step: LeadershipStep } | null>(null);

  function startLeadershipTransfer(exp: Expedition) {
    const candidates = findHandoffCandidates(expeditions, exp.id);
    setLeadershipFor({
      id: exp.id,
      step: candidates.length > 0 ? { kind: "picking", candidates, selected: candidates[0] } : { kind: "noCandidate" },
    });
  }

  function confirmHandoff(exp: Expedition, candidate: string) {
    handOffLeadership(exp.id, candidate);
    setLeadershipFor(null);
  }

  function confirmEnd(exp: Expedition) {
    endExpedition(exp.id);
    setLeadershipFor(null);
  }

  // Only categories an expedition's route actually visits — never an empty filter option.
  const categoryOptions = useMemo(() => {
    const bySlug = new Map<string, string>();
    liveExpeditions.forEach((exp) => exp.stops.forEach((s) => bySlug.set(s.category.slug, s.category.name)));
    return Array.from(bySlug, ([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [liveExpeditions]);

  const activeFilterCount = [
    kindFilter !== "all",
    visibilityFilter !== "all",
    categoryFilter !== "all",
    durationFilter !== "all",
    kickingFilter !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setKindFilter("all");
    setVisibilityFilter("all");
    setCategoryFilter("all");
    setDurationFilter("all");
    setKickingFilter("all");
  }

  const filtered = liveExpeditions.filter((exp) => {
    if (!exp.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (kindFilter !== "all" && exp.kind !== kindFilter) return false;
    if (visibilityFilter !== "all" && exp.visibility !== visibilityFilter) return false;
    if (categoryFilter !== "all" && !exp.stops.some((s) => s.category.slug === categoryFilter)) return false;
    if (durationFilter !== "all" && exp.stopDurationMode !== durationFilter) return false;
    if (kickingFilter !== "all" && exp.allowKicking !== (kickingFilter === "on")) return false;
    return true;
  });
  const filteredYours = filtered.filter((exp) => exp.createdByViewer);
  const filteredOthers = filtered.filter((exp) => !exp.createdByViewer);

  function enter(exp: Expedition) {
    join(exp.id);
    navigate(`/expedition/${exp.id}`);
  }

  // A full boarding expedition takes a waitlist join instead — an in-progress one has no
  // departure moment to promote a waitlister at, so it just stays full.
  function isBoardingFull(exp: Expedition) {
    return exp.status === "boarding" && exp.viewerCount >= exp.maxViewers;
  }

  function requestJoin(exp: Expedition) {
    if (exp.visibility === "public" || unlocked.has(exp.id)) {
      if (isBoardingFull(exp)) joinWaitlist(exp.id);
      else enter(exp);
      return;
    }
    setGatingId(exp.id);
    setCredential("");
    setGateError(false);
  }

  function submitGate(exp: Expedition) {
    const ok = !!exp.password && credential === exp.password;
    if (!ok) {
      setGateError(true);
      return;
    }
    setUnlocked((prev) => new Set(prev).add(exp.id));
    setGatingId(null);
    if (isBoardingFull(exp)) joinWaitlist(exp.id);
    else enter(exp);
  }

  // Shared between the "Your Expeditions" and "All Other Expeditions" sections — same card,
  // whichever list it's drawn from.
  function renderExpeditionCard(exp: Expedition) {
    const full = exp.viewerCount >= exp.maxViewers;
    const boardingFull = isBoardingFull(exp);
    const waitlisted = waitlistedExpeditionId === exp.id;
    const provisional = provisionalRiderId === exp.id;
    const kicked = kickedExpeditionIds.has(exp.id);
    const firstStop = exp.stops[0];
    const nowAt = exp.stops[exp.stopIndex];
    const gating = gatingId === exp.id;
    const leadershipStep = leadershipFor?.id === exp.id ? leadershipFor.step : null;
    const handoffCandidates = leadershipStep?.kind === "picking" ? leadershipStep.candidates : [];
    const selectedCandidate = leadershipStep?.kind === "picking" ? leadershipStep.selected : "";

    return (
      <div
        key={exp.id}
        className="flex flex-col gap-3 rounded-xl border border-outline-decorative bg-surface-base p-4 transition-colors betterhover:hover:border-neutral-600"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-bold text-white">{exp.name}</h2>
          <div className="flex shrink-0 items-center gap-1.5">
            {isEndingSoon(exp) && (
              <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-400">
                <span className="size-1.5 animate-pulse rounded-full bg-orange-400" />
                Ending soon
              </span>
            )}
            {exp.status === "in-progress" ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400">
                <span className="size-1.5 rounded-full bg-red-500" />
                Under way
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-400">
                <span className="size-1.5 rounded-full bg-green-500" />
                Boarding
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[11px] text-subtle">
            By <span className="font-semibold text-white">{exp.createdByViewer ? "you" : exp.creator}</span>
          </p>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                exp.kind === "quick" ? "bg-secondary-base text-white" : "bg-purple-500/15 text-purple-300"
              }`}
            >
              {exp.kind === "quick" ? "Quick" : "Custom"}
            </span>
            {exp.visibility === "private" && (
              <span className="rounded-full border border-outline-decorative px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-subtle">
                Private
              </span>
            )}
            {exp.createdByViewer && (
              <span className="rounded-full border border-outline-decorative px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-base">
                Yours
              </span>
            )}
            {exp.wasHandedOff && (
              <span className="rounded-full border border-outline-decorative px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-subtle">
                Handed off
              </span>
            )}
            {exp.createdByViewer && !leadershipStep && (
              <button
                type="button"
                onClick={() => startLeadershipTransfer(exp)}
                className="text-[10px] font-bold uppercase tracking-wide text-red-400 transition-colors betterhover:hover:text-red-300"
              >
                Hand off
              </button>
            )}
          </div>
        </div>

        {leadershipStep?.kind === "picking" && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-outline-decorative bg-surface-highest px-3 py-2 text-xs text-subtle">
            <span>Hand off to</span>
            <select
              value={selectedCandidate}
              onChange={(e) =>
                setLeadershipFor({
                  id: exp.id,
                  step: { kind: "picking", candidates: handoffCandidates, selected: e.target.value },
                })
              }
              className="h-7 min-w-0 flex-1 rounded border border-outline-region bg-surface-lowest px-2 text-xs font-bold text-white outline-none focus:border-primary-base"
            >
              {handoffCandidates.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => confirmHandoff(exp, selectedCandidate)}
                className="font-bold text-primary-base"
              >
                Confirm
              </button>
              <button type="button" onClick={() => setLeadershipFor(null)} className="font-semibold text-subtle">
                Cancel
              </button>
            </div>
          </div>
        )}

        {leadershipStep?.kind === "noCandidate" && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-outline-decorative bg-surface-highest px-3 py-2 text-xs text-subtle">
            <span>Nobody's free to take over.</span>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setLeadershipFor({ id: exp.id, step: { kind: "confirmEnd" } })}
                className="font-bold text-red-400"
              >
                End instead
              </button>
              <button type="button" onClick={() => setLeadershipFor(null)} className="font-semibold text-subtle">
                Cancel
              </button>
            </div>
          </div>
        )}

        {leadershipStep?.kind === "confirmEnd" && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-400">
            <span>End for everyone?</span>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => confirmEnd(exp)} className="font-bold underline">
                Yes, end it
              </button>
              <button type="button" onClick={() => setLeadershipFor(null)} className="font-semibold text-subtle">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex shrink-0 -space-x-2">
            {exp.stops.slice(0, 6).map((stream) => (
              <div
                key={stream.channel.slug}
                title={stream.channel.username}
                style={{ background: colorFor(stream.channel.username) }}
                className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-surface-base text-[9px] font-black text-black"
              >
                {stream.channel.username.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          {exp.friendsHopping.length > 0 && (
            <div className="flex min-w-0 shrink items-center justify-end gap-1.5">
              <div className="flex shrink-0 -space-x-1.5">
                {exp.friendsHopping.slice(0, 4).map((name) => (
                  <span
                    key={name}
                    title={name}
                    style={{ background: colorFor(name) }}
                    className="grid size-5 shrink-0 place-items-center rounded-full border border-surface-base text-[8px] font-black text-black"
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </span>
                ))}
              </div>
              <span className="truncate text-[11px] text-subtle">
                {exp.friendsHopping.length} {exp.friendsHopping.length === 1 ? "friend" : "friends"} hopping
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-subtle">
          <p className="truncate">
            {exp.status === "boarding" ? (
              <>
                First stop: <span className="font-semibold text-white">{firstStop.channel.username}</span>
              </>
            ) : (
              <>
                Now at: <span className="font-semibold text-white">{nowAt.channel.username}</span>
              </>
            )}
          </p>
          <span className="flex shrink-0 items-center gap-1 tabular-nums">
            <Icon name="chatters" className="size-3" />
            {exp.viewerCount}/{exp.maxViewers}
          </span>
        </div>

        {gating ? (
          <div className="flex flex-col gap-1.5">
            <input
              autoFocus
              type="password"
              value={credential}
              onChange={(e) => {
                setCredential(e.target.value);
                setGateError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && submitGate(exp)}
              placeholder="Password"
              className={`h-9 w-full rounded border bg-surface-lowest px-3 text-xs text-white outline-none placeholder:text-subtle ${
                gateError ? "border-red-400" : "border-outline-region focus:border-primary-base"
              }`}
            />
            {gateError && <p className="text-[11px] text-red-400">That didn't match — try again.</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => submitGate(exp)}
                className="flex-1 rounded-lg bg-primary-base px-3 py-2 text-xs font-bold text-primary-onPrimary"
              >
                Unlock
              </button>
              <button
                type="button"
                onClick={() => setGatingId(null)}
                className="rounded-lg bg-secondary-base px-3 py-2 text-xs font-bold text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] tabular-nums text-subtle">
              {exp.status === "boarding"
                ? `Departs in ${formatCountdown(exp.secondsRemaining)}`
                : exp.stopDurationMode === "whole-stream"
                  ? "No fixed rotation"
                  : exp.stopDurationMode === "chat"
                    ? "Chat decides when to move on"
                    : `Next stop in ${formatCountdown(exp.secondsRemaining)}`}
            </span>
            <button
              type="button"
              disabled={kicked || waitlisted || (full && !boardingFull)}
              onClick={() => (provisional ? enter(exp) : requestJoin(exp))}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                kicked || waitlisted || (full && !boardingFull)
                  ? "cursor-not-allowed bg-disabled-base text-disabled-onSurface"
                  : boardingFull && !provisional
                    ? "bg-secondary-base text-white betterhover:hover:bg-neutral-700"
                    : "bg-primary-base text-primary-onPrimary betterhover:hover:bg-green-400"
              }`}
            >
              {kicked
                ? "You've been kicked off"
                : provisional
                  ? "Confirm your spot"
                  : waitlisted
                    ? "On the waitlist"
                    : boardingFull
                      ? `Join waitlist · ${waitlistSize(exp.id)} waiting`
                      : full
                        ? "Expedition full"
                        : exp.status === "boarding"
                          ? "Join expedition"
                          : "Jump in now"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold leading-8 text-white lg:text-2xl">Kick Expeditions</h2>
          <p className="text-sm text-subtle">
            Hop along with other viewers to a new random live streamer every minute.
          </p>
        </div>
        <Link
          to="/expeditions/new"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-base px-3 py-2 text-sm font-bold text-primary-onPrimary"
        >
          Create Expedition
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expeditions"
            className="h-9 w-full rounded-full border border-outline-region bg-surface-base pl-9 pr-3 text-sm text-white outline-none placeholder:text-subtle focus:border-primary-base"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            filtersOpen || activeFilterCount > 0
              ? "bg-primary-base text-primary-onPrimary"
              : "bg-surface-base text-subtle betterhover:hover:text-white"
          }`}
        >
          <Icon name="dash-filter" className="size-3" />
          Filters
          {activeFilterCount > 0 && (
            <span className="grid size-4 place-items-center rounded-full bg-black/20 text-[10px] tabular-nums">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <div className="flex flex-col gap-4 rounded-xl border border-outline-decorative bg-surface-base p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FilterGroup label="Type">
              <FilterPill value="all" current={kindFilter} onSelect={setKindFilter}>
                All
              </FilterPill>
              <FilterPill value="quick" current={kindFilter} onSelect={setKindFilter}>
                Quick
              </FilterPill>
              <FilterPill value="custom" current={kindFilter} onSelect={setKindFilter}>
                Custom
              </FilterPill>
            </FilterGroup>

            <FilterGroup label="Visibility">
              <FilterPill value="all" current={visibilityFilter} onSelect={setVisibilityFilter}>
                All
              </FilterPill>
              <FilterPill value="public" current={visibilityFilter} onSelect={setVisibilityFilter}>
                Public
              </FilterPill>
              <FilterPill value="private" current={visibilityFilter} onSelect={setVisibilityFilter}>
                Private
              </FilterPill>
            </FilterGroup>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-subtle">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 w-full rounded border border-outline-region bg-surface-lowest px-3 text-xs text-white outline-none focus:border-primary-base"
              >
                <option value="all">All categories</option>
                {categoryOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <FilterGroup label="Stop duration">
              <FilterPill value="all" current={durationFilter} onSelect={setDurationFilter}>
                All
              </FilterPill>
              <FilterPill value="1min" current={durationFilter} onSelect={setDurationFilter}>
                1 min each
              </FilterPill>
              <FilterPill value="custom" current={durationFilter} onSelect={setDurationFilter}>
                Custom
              </FilterPill>
              <FilterPill value="whole-stream" current={durationFilter} onSelect={setDurationFilter}>
                Whole stream
              </FilterPill>
              <FilterPill value="chat" current={durationFilter} onSelect={setDurationFilter}>
                Decide in chat
              </FilterPill>
            </FilterGroup>

            <FilterGroup label="Kicking">
              <FilterPill value="all" current={kickingFilter} onSelect={setKickingFilter}>
                All
              </FilterPill>
              <FilterPill value="on" current={kickingFilter} onSelect={setKickingFilter}>
                On
              </FilterPill>
              <FilterPill value="off" current={kickingFilter} onSelect={setKickingFilter}>
                Off
              </FilterPill>
            </FilterGroup>
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start text-xs font-semibold text-subtle transition-colors betterhover:hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {draftExpeditions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white">Your Drafts</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {draftExpeditions.map((exp) => (
              <DraftCard key={exp.id} exp={exp} onDelete={() => deleteDraft(exp.id)} />
            ))}
          </div>
        </div>
      )}

      {filteredYours.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white">Your Expeditions</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredYours.map(renderExpeditionCard)}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-white">All Other Expeditions</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredOthers.length > 0 ? (
            filteredOthers.map(renderExpeditionCard)
          ) : (
            <p className="text-sm text-subtle">No expeditions match your search or filters.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
