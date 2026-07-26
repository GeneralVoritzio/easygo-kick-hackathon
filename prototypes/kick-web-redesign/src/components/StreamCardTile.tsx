import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Sparkles, Users, Zap } from 'lucide-react';
import type { StreamCard } from '../types';
import { usePinnedStreams } from '../context/PinnedStreamsContext';
import { useKickBoss } from '../context/KickBossContext';
import { partyMatesOf } from '../mock/catalog';
import { BOOST_VIEWER_MULTIPLIER } from '../mock/kickBoss';
import { StreamSurface } from './StreamSurface';
import { PinButton } from './PinButton';
import { PartyMatesPanel } from './PartyMatesPanel';

interface StreamCardTileProps {
  card: StreamCard;
  /** The full catalog — needed to resolve this card's party mates, who may
   *  not all be present in whatever rail this tile happens to render in. */
  catalog: StreamCard[];
}

const HOVER_PLAY_DELAY_MS = 350;

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${count}`;
}

/** One card in a discovery rail. Clicking (or pressing Enter while it's
 *  focused) opens the stream; pressing "p" while it's focused pins it,
 *  without needing to tab further in to the pin button specifically. The
 *  pin button itself stops its click from also bubbling into the card's
 *  own link navigation.
 *
 *  Hovering plays the thumbnail — after a short delay, so a quick mouse
 *  sweep across the rail doesn't load a dozen live embeds at once.
 *
 *  The "streaming with" row sits outside the card's own `Link` rather than
 *  inside it — `PartyMatesPanel` renders a `Link` per party mate, and a
 *  link nested inside another link is invalid markup with undefined click
 *  behavior. */
export function StreamCardTile({ card, catalog }: StreamCardTileProps) {
  const { isPinned, togglePin, canPinMore } = usePinnedStreams();
  const { isBoosted } = useKickBoss();
  const pinned = isPinned(card.id);
  const boosted = isBoosted(card.id);
  const [playing, setPlaying] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);
  const partyMates = partyMatesOf(card, catalog);
  const displayedViewerCount = boosted ? Math.round(card.viewerCount * BOOST_VIEWER_MULTIPLIER) : card.viewerCount;

  const startHover = () => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setPlaying(true), HOVER_PLAY_DELAY_MS);
  };

  const endHover = () => {
    window.clearTimeout(hoverTimer.current);
    setPlaying(false);
  };

  return (
    <div
      onMouseEnter={startHover}
      onMouseLeave={endHover}
      onFocus={startHover}
      onBlur={endHover}
      className="group flex w-64 shrink-0 flex-col gap-2 rounded-xl p-1.5 transition-colors hover:bg-raised/60 focus-within:bg-raised/60"
    >
      <Link
        to={`/watch/${card.id}`}
        onKeyDown={(e) => {
          if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            togglePin(card.id);
          }
        }}
        className="flex flex-col gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-kick/60"
      >
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <StreamSurface card={card} muted size="thumbnail" playing={playing} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-page/60 via-transparent to-transparent" />

          {card.isLive && (
            <span className="absolute left-2 top-2 rounded bg-live px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Live
            </span>
          )}
          <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
            {card.tier === 'rising' && (
              <span className="flex items-center gap-1 rounded-full border border-kick/50 bg-page/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kick backdrop-blur-sm">
                <Sparkles size={10} strokeWidth={2.5} />
                Rising
              </span>
            )}
            {boosted && (
              <span className="flex items-center gap-1 rounded-full border border-kick/50 bg-page/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kick backdrop-blur-sm">
                <Zap size={10} strokeWidth={2.5} />
                Boosted
              </span>
            )}
          </div>
          <span className="tabular absolute bottom-2 left-2 rounded bg-page/70 px-1.5 py-0.5 text-[11px] font-semibold text-ink-bright backdrop-blur-sm">
            {formatViewers(displayedViewerCount)} viewers
          </span>

          <PinButton
            pinned={pinned}
            disabled={!canPinMore}
            streamName={card.name}
            onToggle={() => togglePin(card.id)}
            size="sm"
            className="absolute bottom-2 right-2"
          />
        </div>

        <div className="flex gap-2.5 px-1">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-black text-page"
            style={{ backgroundImage: card.gradient }}
          >
            {card.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[14px] font-bold text-ink-bright">{card.name}</div>
            <div className="truncate text-[12px] text-ink-muted">{card.category}</div>
          </div>
        </div>
      </Link>

      {partyMates.length > 0 && (
        <div className="relative px-1">
          <button
            type="button"
            onClick={() => setPartyOpen((o) => !o)}
            className="flex items-center gap-1 text-[11px] font-semibold text-ink-muted transition-colors hover:text-ink-bright"
          >
            <Users size={11} strokeWidth={2.5} />
            Streaming with {partyMates.length} {partyMates.length === 1 ? 'other' : 'others'}
          </button>

          {partyOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-xl border border-line bg-surface p-3 shadow-xl">
              <PartyMatesPanel card={card} mates={partyMates} onNavigate={() => setPartyOpen(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
