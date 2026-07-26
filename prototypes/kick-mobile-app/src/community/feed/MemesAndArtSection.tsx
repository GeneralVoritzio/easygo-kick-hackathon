import type { CommunityThread } from '@shared/types';
import { MediaTile } from './MediaTile';

interface MemesAndArtSectionProps {
  threads: CommunityThread[];
}

export function MemesAndArtSection({ threads }: MemesAndArtSectionProps) {
  if (threads.length === 0) return null;

  return (
    <section>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">😂🎨 Memes &amp; Fan Art</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {threads.map((thread) => (
          <MediaTile key={thread.id} thread={thread} />
        ))}
      </div>
    </section>
  );
}
