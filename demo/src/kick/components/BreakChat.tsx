import { useEffect } from "react";
import { Icon } from "../Icon";
import { formatDuration, formatViewers, liveStreamFor } from "../mock/api";
import type { Candidate } from "../mock/raids";
import { useRaid } from "../raid/RaidProvider";
import { AvatarInfoCard } from "./RaidChat";

const cardClass = (checked: boolean) =>
  `flex flex-col items-center gap-1 rounded-lg p-1.5 text-center transition-all ${
    checked
      ? "bg-surface-highest ring-2 ring-primary-base"
      : "bg-surface-lowest ring-1 ring-transparent betterhover:hover:bg-surface-highest"
  }`;

function StayCard({ checked, onSelect }: { checked: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={cardClass(checked)}>
      <span
        className={`flex size-7 items-center justify-center rounded-full ${
          checked ? "bg-primary-base/20" : "bg-surface-highest"
        }`}
      >
        <Icon
          name="home"
          className={`size-3.5 ${checked ? "text-primary-base" : "text-surface-onSurfaceSecondary"}`}
        />
      </span>
      <span className="text-[10px] font-bold text-white">Stay here</span>
    </button>
  );
}

function WatchCard({
  slug,
  votes,
  checked,
  align,
  onSelect,
}: {
  slug: string;
  votes: number;
  checked: boolean;
  align: "start" | "center" | "end";
  onSelect: () => void;
}) {
  const stream = liveStreamFor(slug);
  if (!stream) return null;
  const candidate: Candidate = { stream, score: 0, reason: "" };
  return (
    <button type="button" onClick={onSelect} className={`group relative ${cardClass(checked)}`}>
      <AvatarInfoCard candidate={candidate} align={align} />
      <span className="relative flex size-7 items-center justify-center">
        <img src={stream.channel.avatar} alt="" className="size-7 rounded-full" />
        {checked && (
          <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-primary-base text-[8px] font-bold text-primary-onPrimary">
            ✓
          </span>
        )}
      </span>
      <span className="max-w-full truncate text-[10px] font-bold text-white">
        {stream.channel.username}
      </span>
      <span className="text-[9px] text-surface-onSurfaceSecondary">
        {formatViewers(votes)} watching
      </span>
    </button>
  );
}

// Landed raids get a card, not a vanish, so returning from a break does too: it sits in chat
// until the viewer dismisses it, same shape as LandedCard's glow/pop-in/checkmark treatment.
function BreakEndedCard({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 5000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div className="animate-pick-reveal relative m-3 flex shrink-0 items-center gap-2 overflow-hidden rounded-lg bg-[radial-gradient(ellipse_at_center,rgba(83,252,24,0.45),rgba(83,252,24,0.14))] py-2 pl-2 pr-1.5">
      <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-base/20">
        <Icon name="live-dot" className="size-3.5 text-primary-base" />
      </span>
      <span className="relative min-w-0 flex-1 text-xs font-semibold leading-snug text-white">
        Streamer is back! Thanks for sticking around.
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="relative flex size-5 shrink-0 items-center justify-center text-surface-onSurfaceSecondary betterhover:hover:text-white"
      >
        <Icon name="close" className="size-2.5" />
      </button>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-surface-highest">
        <div className="animate-deplete h-full bg-primary-base" />
      </div>
    </div>
  );
}

// Section 5.1-style split: this is a viewer's own, private, always-changeable choice, never a
// locked vote like a raid poll. Picking a card both casts a vote (so others see what's
// trending) and sets where this viewer stands, and choosing Stay withdraws it just as freely.
export function BreakPanel() {
  const { breakRaid, chooseBreak, dismissBreak } = useRaid();
  if (!breakRaid) return null;

  if (breakRaid.ended) {
    return <BreakEndedCard onDismiss={dismissBreak} />;
  }

  const cardCount = breakRaid.options.length + 1;
  // Fewer picks means fewer cards, so the row stretches to fill instead of leaving the extra
  // grid-cols-4 slots looking empty and cramped.
  const gridCols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[cardCount] ?? "grid-cols-4";

  return (
    <div className="shrink-0 border-t border-outline-decorative bg-surface-base px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-bold text-white">
          Streamer will return in {formatDuration(breakRaid.seconds)}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-surface-onSurfaceSecondary">
          Want to discover someone while waiting?
        </span>
        <div className={`grid ${gridCols} gap-1`}>
          <StayCard checked={breakRaid.myChoice === null} onSelect={() => chooseBreak(null)} />
          {breakRaid.options.map((slug, i) => (
            <WatchCard
              key={slug}
              slug={slug}
              votes={breakRaid.votes[slug] ?? 0}
              checked={breakRaid.myChoice === slug}
              align={i + 1 === cardCount - 1 ? "end" : "center"}
              onSelect={() => chooseBreak(slug)}
            />
          ))}
        </div>
        <span className="text-[10px] text-surface-onSurfaceSecondary">
          We'll bring you back automatically.
        </span>
      </div>
    </div>
  );
}

// Bottom-left is also where the raid skip-timer panel lives, so this stacks above it the same
// way the tank auto-select panel does, in case a raid and a break are ever active at once.
export function BreakStreamerControls() {
  const { breakRaid, endBreak } = useRaid();
  if (!breakRaid || breakRaid.ended) return null;

  return (
    <div className="z-popover fixed bottom-20 left-4 flex items-center gap-2 rounded-lg bg-surface-highest px-3 py-2 shadow-2xl">
      <span className="text-xs font-semibold uppercase text-surface-onSurfaceSecondary">
        Break · {formatDuration(breakRaid.seconds)}
      </span>
      <button
        type="button"
        onClick={endBreak}
        className="state-layer-base rounded bg-primary-base px-2 py-1 text-xs font-semibold text-primary-onPrimary"
      >
        End break now
      </button>
    </div>
  );
}

// No toast component exists elsewhere in the app, this is the first one: small, self-dismissing,
// mounted once at the app root so it shows up wherever the viewer happens to be.
export function BreakNotice() {
  const { breakNotice } = useRaid();
  if (!breakNotice) return null;

  return (
    <div className="z-popover fixed left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-surface-highest px-4 py-3 shadow-2xl">
      <Icon name="live-dot" className="size-3 shrink-0 text-primary-base" />
      <span className="text-sm font-semibold text-white">{breakNotice}</span>
    </div>
  );
}
