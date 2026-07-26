import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { X } from 'lucide-react';
import type { StreamCard } from '../types';
import { usePinnedStreams, MAX_PINS } from '../context/PinnedStreamsContext';
import { shouldIgnoreShortcut } from '../keyboard';
import { StreamSurface } from '../components/StreamSurface';
import { AudioFocusButton } from '../components/AudioFocusButton';
import { MosaicGrid } from '../components/MosaicGrid';

interface MultiviewPageProps {
  catalog: StreamCard[];
}

/** The watch party: every pinned stream at once, one grid. Tap a tile's
 *  speaker (top-left, or press 1-9 for the tile in that position) to move
 *  audio there — only one plays at a time; tap the tile itself to open
 *  that stream's full watch page. */
export function MultiviewPage({ catalog }: MultiviewPageProps) {
  const { pinnedIds, unpin, audioActiveId, setAudioActiveId } = usePinnedStreams();
  const navigate = useNavigate();

  const pinnedCards = pinnedIds.map((id) => catalog.find((c) => c.id === id)).filter((c): c is StreamCard => !!c);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (shouldIgnoreShortcut(e)) return;
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < pinnedCards.length) {
        setAudioActiveId(pinnedCards[index].id);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinnedCards, setAudioActiveId]);

  if (pinnedCards.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-ink-bright">Nothing pinned yet</p>
        <p className="max-w-xs text-xs text-ink-muted">
          Pin streams while browsing (the pin icon on any card) to build a watch party here — up to {MAX_PINS} at once.
        </p>
        <Link to="/" className="mt-1 rounded-lg bg-kick px-4 py-2 text-sm font-bold text-page">
          Browse streams
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full p-2">
      <MosaicGrid
        tiles={pinnedCards.map((card) => {
          const isAudioActive = audioActiveId === card.id;
          return (
            <div
              key={card.id}
              onClick={() => navigate(`/watch/${card.id}`)}
              className="relative h-full w-full cursor-pointer overflow-hidden rounded-lg border border-line"
            >
              <StreamSurface card={card} muted={!isAudioActive} playing />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-page/85 to-transparent p-2 text-xs font-bold text-ink-bright">
                {card.name}
              </div>

              <AudioFocusButton
                isAudioActive={isAudioActive}
                streamName={card.name}
                onFocus={() => setAudioActiveId(card.id)}
                size="sm"
                className="absolute left-1.5 top-1.5"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  unpin(card.id);
                }}
                aria-label={`Unpin ${card.name}`}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-page/50 text-ink-bright backdrop-blur-sm"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      />
    </div>
  );
}
