import type { StreamCard } from '../types';

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

interface StreamSurfaceProps {
  card: StreamCard;
  muted: boolean;
  /** 'thumbnail' (rail/grid cards — a static preview is completely normal
   *  there, real or not) vs 'player' (hero, watch page, multiview — where a
   *  viewer expects actual video, so a fictional card says so rather than
   *  pretending). */
  size?: 'thumbnail' | 'player';
  /** Whether the embed's own controls (volume, fullscreen) should receive
   *  pointer events. Off inside a tile whose gestures we own (multiview),
   *  on for a real single-stream view (hero, watch page). */
  interactive?: boolean;
  /** Whether to actually render live video right now. The hero, watch page,
   *  and multiview pass `true` unconditionally — the viewer explicitly
   *  chose to watch there. A rail thumbnail passes this only while hovered
   *  (see `StreamCardTile`), so a rail full of real channels isn't loading
   *  a dozen live iframes just because the cards are on screen. */
  playing: boolean;
}

/** The one place video actually renders. A real Kick channel (`embedId`
 *  set) gets a real live embed via `player.kick.com` when `playing` — same
 *  shape as `prototypes/kick-battles` and `prototypes/kick-recap`, no
 *  `parent` param needed. A fictional catalog entry has no real footage to
 *  show, so it gets a styled placeholder instead of a fake video surface —
 *  `playing` there just adds a subtle animated pan, not a fake feed. */
export function StreamSurface({ card, muted, size = 'player', interactive = false, playing }: StreamSurfaceProps) {
  if (card.embedId && playing) {
    return (
      <div className="relative h-full w-full overflow-hidden" style={{ backgroundImage: card.gradient }}>
        <iframe
          key={`${card.embedId}-${muted}`}
          src={`https://player.kick.com/${card.embedId}?autoplay=true&muted=${muted}`}
          title={`${card.name} live on Kick`}
          allow="autoplay; fullscreen"
          className={`absolute inset-0 h-full w-full border-0 ${interactive ? '' : 'pointer-events-none'}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
        playing ? 'animate-bg-pan bg-[length:200%_200%]' : ''
      }`}
      style={{ backgroundImage: card.gradient }}
    >
      <span className="select-none text-4xl font-black text-ink-bright/25">{initials(card.name)}</span>
      {size === 'player' && (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-page/70 px-3 py-1 text-[11px] text-ink-muted backdrop-blur-sm">
          No live broadcast — demo profile
        </span>
      )}
    </div>
  );
}
