import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { LiveStream } from '@shared/types';
import { ChannelBadge } from '@shared/components';
import { useLiveChat } from '@shared/hooks/useLiveChat';
import { StreamSurface } from './StreamSurface';
import { StreamSignalLabel } from './StreamSignalLabel';
import { StreamTagPills } from './StreamTagPills';

const SWIPE_THRESHOLD = 70;

interface StreamViewProps {
  stream: LiveStream;
  onClose: () => void;
}

/** Fullscreen stream + chat — reached by tapping any stream card, whether
 *  it's the discovery tile, a pinned dock thumbnail, or a focus-mosaic tile.
 *  Always unmuted: being open here is what makes a stream "audio focused"
 *  for whichever multi-tile view the viewer returns to.
 *
 *  Drag right anywhere on the sheet to go back, same threshold/rubber-band
 *  pattern as DiscoveryTile's vertical swipe. `drag="x"` makes framer set
 *  `touch-action: pan-y` on the root, so the chat list underneath still
 *  scrolls vertically without fighting the gesture. */
export function StreamView({ stream, onClose }: StreamViewProps) {
  const { messages, sendMessage } = useLiveChat();
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-page"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25 }}
      drag="x"
      dragElastic={0.3}
      dragSnapToOrigin
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) onClose();
      }}
    >
      <div className="relative aspect-video w-full shrink-0 bg-surface">
        <StreamSurface stream={stream} muted={false} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="absolute left-[calc(env(safe-area-inset-left)+0.5rem)] top-[calc(env(safe-area-inset-top)+0.5rem)] flex h-11 w-11 items-center justify-center rounded-full bg-page/70 text-xl text-ink-bright"
        >
          ←
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <ChannelBadge channel={stream} size="sm" />
      </div>
      <div className="px-3 py-1.5">
        <StreamTagPills tags={stream.tags} />
        {stream.signal && <StreamSignalLabel signal={stream.signal} className="mt-1 text-[11px]" />}
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
        {messages.map((m) => (
          <div key={m.id} className="text-xs leading-relaxed">
            <span className={`font-bold ${m.viewerName === 'you' ? 'text-kick' : 'text-ink'}`}>
              {m.viewerName}
            </span>
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
        className="flex shrink-0 items-center gap-2 border-t border-line p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
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
    </motion.div>
  );
}
