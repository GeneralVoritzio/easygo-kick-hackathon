import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { formatViewers, livestreams, type Livestream } from "../mock/api";
import { colorFor } from "../mock/chatIdentities";
import { topMultiviews, type TopMultiview } from "../mock/topMultiviews";
import { usePinnedStreams, MAX_PINS } from "../expedition/PinnedStreamsContext";
import { AudioFocusButton } from "../expedition/AudioFocusButton";
import { MosaicGrid } from "../expedition/MosaicGrid";
import { StopPreview } from "../expedition/StopPreview";

// Shares the collapsed/expanded state with TopMultiviewCards below, but renders on its own —
// Multiview.tsx puts it in the same row as "Clear all" instead of stacking it above the cards.
function TopMultiviewToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-subtle transition-colors betterhover:hover:text-white"
    >
      <Icon name="chevron-right" className={`size-3 transition-transform ${collapsed ? "" : "rotate-90"}`} />
      Top Multiviews
    </button>
  );
}

/*
  fake-kick: other viewers' popular pin combos, not anything KICK itself publishes. Clicking a
  card pins every stream in it (skipping whatever's already pinned) instead of replacing your own
  pins outright — same "additive" reasoning a real multiview tool would use — and collapses the
  row out of the way (onPicked) since you've just told it what you want.

  Favoriting a combo (the small pin toggle, top-right of each card) is a separate action from
  picking it: it never touches your Multiview pins, it just keeps a combo you like at the front
  of this list, left of a divider, so you don't have to scroll past everything else to find it
  again next time.
*/
function TopMultiviewCards({
  onPick,
  onPicked,
}: {
  onPick: (combo: TopMultiview) => void;
  onPicked: () => void;
}) {
  const [pinnedComboIds, setPinnedComboIds] = useState<string[]>([]);

  function pick(combo: TopMultiview) {
    onPick(combo);
    onPicked();
  }

  function toggleComboPin(id: string) {
    setPinnedComboIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  const pinnedCombos = topMultiviews.filter((c) => pinnedComboIds.includes(c.id));
  const otherCombos = topMultiviews.filter((c) => !pinnedComboIds.includes(c.id));

  function renderCard(combo: TopMultiview) {
    const streams = combo.slugs
      .map((slug) => livestreams.find((s) => s.channel.slug === slug))
      .filter((s): s is Livestream => Boolean(s));
    const pinned = pinnedComboIds.includes(combo.id);
    return (
      <div
        key={combo.id}
        onClick={() => pick(combo)}
        className="relative flex w-52 shrink-0 cursor-pointer flex-col items-start gap-2 rounded-lg border border-outline-decorative bg-surface-base p-3 text-left transition-colors betterhover:hover:border-neutral-600"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleComboPin(combo.id);
          }}
          aria-pressed={pinned}
          aria-label={pinned ? `Unpin ${combo.name}` : `Pin ${combo.name}`}
          className={`absolute right-2 top-2 flex size-6 items-center justify-center rounded-full transition-colors ${
            pinned
              ? "bg-primary-base text-primary-onPrimary"
              : "bg-black/40 text-white betterhover:hover:bg-black/60"
          }`}
        >
          <Icon name="pin" className="size-3" />
        </button>
        <div className="flex -space-x-2">
          {streams.slice(0, 6).map((stream) => (
            <div
              key={stream.channel.slug}
              title={stream.channel.username}
              style={{ background: colorFor(stream.channel.username) }}
              className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-surface-base text-[9px] font-black text-black"
            >
              {stream.channel.username.slice(0, 2).toUpperCase()}
            </div>
          ))}
        </div>
        <span className="truncate pr-5 text-xs font-bold text-white">{combo.name}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-subtle">
          <span className="tabular-nums">{streams.length} streams</span>
          <span>·</span>
          <span className="tabular-nums">{formatViewers(combo.watching)} watching this combo</span>
        </span>
      </div>
    );
  }

  return (
    <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-3 pb-2">
      {pinnedCombos.map(renderCard)}
      {pinnedCombos.length > 0 && otherCombos.length > 0 && (
        <div className="w-px shrink-0 self-stretch bg-outline-decorative" />
      )}
      {otherCombos.map(renderCard)}
    </div>
  );
}

/*
  The watch party: every pinned stream at once, one grid. Tap a tile's speaker (top-left, or
  press 1-9 for the tile in that position) to move audio there — only one plays at a time; tap
  the tile itself to open that stream's full watch page. Ported from kick-web-redesign's
  MultiviewPage.tsx.
*/
export function Multiview() {
  const { pinnedSlugs, isPinned, togglePin, unpin, clearPins, audioActiveSlug, setAudioActiveSlug } =
    usePinnedStreams();
  const navigate = useNavigate();
  const [topMultiviewsCollapsed, setTopMultiviewsCollapsed] = useState(false);

  const pinnedStreams = pinnedSlugs
    .map((slug) => livestreams.find((s) => s.channel.slug === slug))
    .filter((s): s is Livestream => Boolean(s));

  // Additive, not a replace-all — togglePin itself caps at MAX_PINS, so a combo bigger than
  // whatever room is left just pins as many as will fit.
  function pinCombo(combo: TopMultiview) {
    for (const slug of combo.slugs) {
      if (!isPinned(slug)) togglePin(slug);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < pinnedStreams.length) {
        setAudioActiveSlug(pinnedStreams[index].channel.slug);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pinnedStreams, setAudioActiveSlug]);

  if (pinnedStreams.length === 0) {
    return (
      <div className="-mb-6 flex h-[calc(100vh-var(--navbar-height))] flex-col overflow-hidden">
        <div className="flex shrink-0 items-center px-3 py-2">
          <TopMultiviewToggle
            collapsed={topMultiviewsCollapsed}
            onToggle={() => setTopMultiviewsCollapsed((v) => !v)}
          />
        </div>
        {!topMultiviewsCollapsed && (
          <TopMultiviewCards onPick={pinCombo} onPicked={() => setTopMultiviewsCollapsed(true)} />
        )}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-white">Nothing added yet</p>
          <p className="max-w-xs text-xs text-subtle">
            Add streams while browsing (the grid icon on any card), or pick a Top Multiview above,
            up to {MAX_PINS} at once.
          </p>
          <Link
            to="/"
            className="mt-1 rounded-lg bg-primary-base px-4 py-2 text-sm font-bold text-primary-onPrimary"
          >
            Browse streams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-mb-6 flex h-[calc(100vh-var(--navbar-height))] flex-col overflow-y-auto">
      <div className="flex shrink-0 items-center justify-between px-3 py-2">
        <TopMultiviewToggle
          collapsed={topMultiviewsCollapsed}
          onToggle={() => setTopMultiviewsCollapsed((v) => !v)}
        />
        <button
          type="button"
          onClick={clearPins}
          className="text-xs font-semibold text-subtle betterhover:hover:text-white"
        >
          Clear all
        </button>
      </div>

      {!topMultiviewsCollapsed && (
        <TopMultiviewCards onPick={pinCombo} onPicked={() => setTopMultiviewsCollapsed(true)} />
      )}

      <div className="min-h-0 flex-1 p-2 pt-0">
        <MosaicGrid
          tiles={pinnedStreams.map((stream) => {
            const isAudioActive = audioActiveSlug === stream.channel.slug;
            return (
              <div
                key={stream.channel.slug}
                onClick={() => navigate(`/${stream.channel.slug}`)}
                className="relative h-full w-full cursor-pointer overflow-hidden rounded-lg border border-outline-decorative"
              >
                <StopPreview stream={stream} />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent p-2 text-xs font-bold text-white">
                  {stream.channel.username}
                </div>

                <AudioFocusButton
                  isAudioActive={isAudioActive}
                  streamName={stream.channel.username}
                  onFocus={() => setAudioActiveSlug(stream.channel.slug)}
                  size="sm"
                  className="absolute left-1.5 top-1.5"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    unpin(stream.channel.slug);
                  }}
                  aria-label={`Unpin ${stream.channel.username}`}
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                >
                  <Icon name="close" className="size-3.5" />
                </button>
              </div>
            );
          })}
        />
      </div>
    </div>
  );
}
