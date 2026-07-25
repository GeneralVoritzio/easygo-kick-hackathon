import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { StreamCard } from '../types';
import { usePinnedStreams } from '../context/PinnedStreamsContext';
import { useLiveChat } from '../hooks/useLiveChat';
import { shouldIgnoreShortcut } from '../keyboard';
import { StreamSurface } from '../components/StreamSurface';
import { PinButton } from '../components/PinButton';
import { AudioFocusButton } from '../components/AudioFocusButton';

interface WatchPageProps {
  catalog: StreamCard[];
}

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${count}`;
}

/** The classic streaming-site watch layout: video left, chat right (stacks
 *  on narrow screens). Reached by clicking any stream card, anywhere.
 *
 *  "M" toggles audio and "P" toggles the pin, from anywhere on the page —
 *  except while the chat input has focus, so typing "please" doesn't pin
 *  and unmute the stream mid-sentence. Muting here means remounting the
 *  embed with a new `muted` param (see `StreamSurface`); there's no other
 *  way to reach into a cross-origin player's own volume control. */
export function WatchPage({ catalog }: WatchPageProps) {
  const { id } = useParams<{ id: string }>();
  const card = catalog.find((c) => c.id === id);
  const { isPinned, togglePin, canPinMore } = usePinnedStreams();
  const { messages, sendMessage } = useLiveChat(id ?? '');
  const [draft, setDraft] = useState('');
  const [muted, setMuted] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    setMuted(true);
  }, [id]);

  useEffect(() => {
    if (!card) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (shouldIgnoreShortcut(e)) return;
      if (e.key === 'm' || e.key === 'M') {
        setMuted((m) => !m);
      } else if (e.key === 'p' || e.key === 'P') {
        togglePin(card!.id);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, togglePin]);

  if (!card) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-ink-muted">That stream doesn't exist.</p>
        <Link to="/" className="text-sm font-semibold text-kick">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-video w-full shrink-0 bg-surface lg:aspect-auto lg:flex-1">
          <StreamSurface card={card} muted={muted} size="player" interactive playing />
          <AudioFocusButton
            isAudioActive={!muted}
            streamName={card.name}
            onFocus={() => setMuted((m) => !m)}
            className="absolute bottom-3 right-3"
          />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-line p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black text-page"
              style={{ backgroundImage: card.gradient }}
            >
              {card.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold text-ink-bright">{card.name}</h1>
              <p className="truncate text-xs text-ink-muted">
                {card.category} · <span className="tabular">{formatViewers(card.viewerCount)} viewers</span>
              </p>
            </div>
          </div>
          <PinButton
            pinned={isPinned(card.id)}
            disabled={!canPinMore}
            streamName={card.name}
            onToggle={() => togglePin(card.id)}
          />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col border-line lg:h-full lg:w-80 lg:border-l">
        <div ref={listRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
          {messages.map((m) => (
            <div key={m.id} className="text-xs leading-relaxed">
              <span className={`font-bold ${m.viewerName === 'you' ? 'text-kick' : 'text-ink'}`}>{m.viewerName}</span>
              <span className="text-ink-muted">: </span>
              <span className="text-ink-bright">{m.text}</span>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(draft);
            setDraft('');
          }}
          className="flex shrink-0 items-center gap-2 border-t border-line p-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Send a message"
            className="min-w-0 flex-1 rounded-full border border-line bg-surface px-3 py-2 text-xs text-ink-bright placeholder:text-ink-muted focus:border-kick focus:outline-none"
          />
          <button type="submit" className="shrink-0 rounded-full bg-kick px-3 py-2 text-xs font-bold text-page">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
