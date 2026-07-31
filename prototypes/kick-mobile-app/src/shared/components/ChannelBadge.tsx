import type { ChannelInfo } from '../types';

interface ChannelBadgeProps {
  channel: ChannelInfo;
  size?: 'sm' | 'md';
}

function formatViewerCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${count}`;
}

export function ChannelBadge({ channel, size = 'md' }: ChannelBadgeProps) {
  const avatarSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-2">
      <img
        src={channel.avatarUrl}
        alt=""
        className={`${avatarSize} shrink-0 rounded-full bg-raised object-cover`}
      />

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`truncate font-semibold text-ink-bright ${textSize}`}>{channel.name}</span>
          {channel.isLive && (
            <span className="flex items-center gap-1 rounded bg-live px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-white" />
              Live
            </span>
          )}
        </div>
        {typeof channel.viewerCount === 'number' && (
          <span className="tabular text-[11px] text-ink-muted">{formatViewerCount(channel.viewerCount)} viewers</span>
        )}
      </div>
    </div>
  );
}
