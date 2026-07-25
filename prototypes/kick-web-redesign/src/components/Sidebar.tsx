import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { StreamCard } from '../types';
import { COMMUNITIES, FOLLOWED_STREAMERS } from '../mock/sidebar';

interface SidebarProps {
  catalog: StreamCard[];
}

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${count}`;
}

/** Quick access to channels/communities you already follow, live status at
 *  a glance — a different job from the discovery rails (finding something
 *  new). Collapsible to an icon rail so it doesn't compete with discovery
 *  for width on narrower viewports. */
export function Sidebar({ catalog }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const followed = FOLLOWED_STREAMERS.map((f) => {
    const card = catalog.find((c) => c.name === f.name);
    return card ? { card, isLive: f.isLive } : null;
  }).filter((f): f is { card: StreamCard; isLive: boolean } => f !== null);

  return (
    <aside className={`flex shrink-0 flex-col border-r border-line bg-page transition-[width] ${collapsed ? 'w-16' : 'w-60'}`}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex items-center gap-2 border-b border-line p-3 text-ink-muted transition-colors hover:text-ink-bright"
      >
        {collapsed ? <ChevronsRight size={16} strokeWidth={2.25} /> : <ChevronsLeft size={16} strokeWidth={2.25} />}
        {!collapsed && <span className="text-xs font-semibold">Collapse</span>}
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          {!collapsed && (
            <h3 className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Following</h3>
          )}
          <div className="flex flex-col gap-0.5">
            {followed.map(({ card, isLive }) =>
              isLive ? (
                <Link
                  key={card.id}
                  to={`/watch/${card.id}`}
                  title={card.name}
                  className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-raised"
                >
                  <span className="relative shrink-0">
                    <span
                      className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-black text-page"
                      style={{ backgroundImage: card.gradient }}
                    >
                      {card.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-page bg-live" />
                  </span>
                  {!collapsed && (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-ink-bright">{card.name}</span>
                      <span className="tabular block truncate text-[10px] text-ink-muted">
                        {formatViewers(card.viewerCount)} viewers
                      </span>
                    </span>
                  )}
                </Link>
              ) : (
                <div
                  key={card.id}
                  title={`${card.name} — offline`}
                  className="flex items-center gap-2.5 rounded-lg p-2 opacity-45"
                >
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-black text-page grayscale"
                    style={{ backgroundImage: card.gradient }}
                  >
                    {card.name.slice(0, 2).toUpperCase()}
                  </span>
                  {!collapsed && (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-ink">{card.name}</span>
                      <span className="block truncate text-[10px] text-ink-muted">Offline</span>
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        <div>
          {!collapsed && (
            <h3 className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Communities</h3>
          )}
          <div className="flex flex-col gap-0.5">
            {COMMUNITIES.map((community) => (
              <div key={community.id} title={community.name} className="flex items-center gap-2.5 rounded-lg p-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-raised text-sm">
                  {community.icon}
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-ink-bright">{community.name}</span>
                    <span className="tabular flex items-center gap-1 truncate text-[10px] text-ink-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-live" />
                      {community.liveMemberCount} live now
                    </span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
