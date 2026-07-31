import { Eye } from 'lucide-react';
import type { LiveStream, TrendingMultiview } from '@shared/types';
import { StreamSurface } from '../StreamSurface';

interface TrendingMultiviewCardProps {
  multiview: TrendingMultiview;
  streams: LiveStream[];
  active: boolean;
  onOpen: () => void;
}

function formatWatching(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${count}`;
}

/** A combo other viewers currently have open in their own multiview.
 *  Tapping pins the same streams into the Home tab's focus mosaic. The
 *  preview is one real embed (the first stream), not every stream in the
 *  combo crammed into a mosaic too small to read — the avatar stack below
 *  shows who else is in it. */
export function TrendingMultiviewCard({ multiview, streams, active, onOpen }: TrendingMultiviewCardProps) {
  const combo = multiview.streamIds
    .map((id) => streams.find((s) => s.id === id))
    .filter((s): s is LiveStream => !!s);

  if (combo.length === 0) return null;
  const [primary, ...rest] = combo;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full overflow-hidden rounded-lg border border-line bg-surface text-left transition-colors hover:bg-raised"
    >
      <div className="relative h-36 w-full overflow-hidden">
        <StreamSurface stream={primary} muted active={active} />
        {rest.length > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-page/80 px-1.5 py-0.5 text-xs font-bold text-ink-bright backdrop-blur-sm">
            +{rest.length}
          </span>
        )}
      </div>
      <div className="p-4">
        <h4 className="truncate text-lg font-semibold text-ink-bright">{multiview.title}</h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {combo.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5">
              <img src={s.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
              <span className="text-sm text-ink-muted">{s.name}</span>
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
          <Eye size={14} strokeWidth={2.25} />
          <span className="tabular">{formatWatching(multiview.watching)} watching</span>
        </div>
      </div>
    </button>
  );
}
