import type { CommunityThread } from '@shared/types';

const KIND_LABEL: Record<'meme' | 'fan_art', string> = { meme: 'Meme', fan_art: 'Fan Art' };
const KIND_EMOJI: Record<'meme' | 'fan_art', string> = { meme: '😂', fan_art: '🎨' };

interface MediaTileProps {
  thread: CommunityThread;
}

/** A meme/fan-art post shown as a media tile rather than a text row —
 *  these are things people share visually, so the gallery reads as a
 *  gallery instead of another discussion list. */
export function MediaTile({ thread }: MediaTileProps) {
  const kind = thread.kind as 'meme' | 'fan_art';

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-raised to-surface text-5xl">
        {KIND_EMOJI[kind]}
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold text-ink-bright">{thread.title}</p>
        <div className="mt-1 flex items-center justify-between text-[10px] text-ink-muted">
          <span className="truncate">
            {KIND_LABEL[kind]} · {thread.authorName}
          </span>
          <span className="shrink-0">❤️ {thread.reactionCount}</span>
        </div>
      </div>
    </div>
  );
}
