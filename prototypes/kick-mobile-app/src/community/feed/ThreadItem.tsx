import type { CommunityThread } from '@shared/types';

const KIND_ICON: Record<CommunityThread['kind'], string> = {
  discussion: '💬',
  meme: '😂',
  fan_art: '🎨',
  announcement: '📢',
};

function timeAgo(iso: string): string {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

interface ThreadItemProps {
  thread: CommunityThread;
}

/** One post in the feed — a discussion, meme, fan art, or announcement, all
 *  in the same stream rather than split across other platforms. */
export function ThreadItem({ thread }: ThreadItemProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        thread.pinned ? 'border-kick/40 bg-kick/5' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none">{KIND_ICON[thread.kind]}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-ink-muted">
            {thread.pinned && <span className="font-bold uppercase tracking-wide text-kick">Pinned</span>}
            <span className="font-semibold text-ink">{thread.authorName}</span>
            <span>· {timeAgo(thread.createdAt)}</span>
          </div>
          <h4 className="mt-1 text-sm font-bold text-ink-bright">{thread.title}</h4>
          {thread.bodyPreview && <p className="mt-1 text-xs text-ink-muted">{thread.bodyPreview}</p>}
          <div className="mt-2 flex gap-4 text-[11px] text-ink-muted">
            <span>💬 {thread.replyCount}</span>
            <span>❤️ {thread.reactionCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
