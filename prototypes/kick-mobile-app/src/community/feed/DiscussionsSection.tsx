import type { CommunityThread } from '@shared/types';
import { ThreadItem } from './ThreadItem';

interface DiscussionsSectionProps {
  threads: CommunityThread[];
}

export function DiscussionsSection({ threads }: DiscussionsSectionProps) {
  if (threads.length === 0) return null;

  return (
    <section>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">💬 Discussions</h3>
      <div className="space-y-3">
        {threads.map((thread) => (
          <ThreadItem key={thread.id} thread={thread} />
        ))}
      </div>
    </section>
  );
}
