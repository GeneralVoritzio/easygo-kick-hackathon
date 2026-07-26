import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Bell, Compass, Keyboard, Layers, Search } from 'lucide-react';
import { usePinnedStreams } from '../context/PinnedStreamsContext';
import { NotificationSettingsPopover } from './NotificationSettingsPopover';

interface NavbarProps {
  onOpenShortcuts: () => void;
}

/** Persistent top nav. `Multiview` carries a pinned-count badge so it's
 *  always clear how many streams are waiting there, without having to
 *  visit the page to check. The keyboard icon is the mouse-click way in to
 *  the same shortcuts list "?" opens — every shortcut has a visible way to
 *  reach it too, not just a hidden key combo. */
export function Navbar({ onOpenShortcuts }: NavbarProps) {
  const { pathname } = useLocation();
  const { pinnedIds } = usePinnedStreams();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-page px-4 sm:px-6">
      <Link to="/" className="shrink-0 text-lg font-extrabold text-ink-bright">
        Kick<span className="text-kick">.</span>
      </Link>

      <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-ink-muted sm:flex">
        <Search size={14} strokeWidth={2.25} />
        <span className="truncate text-xs">Search streamers, categories</span>
      </div>

      <nav className="ml-auto flex shrink-0 items-center gap-1">
        <Link
          to="/"
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            pathname === '/' ? 'text-ink-bright' : 'text-ink-muted hover:text-ink-bright'
          }`}
        >
          Home
        </Link>
        <Link
          to="/multiview"
          className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            pathname === '/multiview' ? 'text-ink-bright' : 'text-ink-muted hover:text-ink-bright'
          }`}
        >
          <Layers size={16} strokeWidth={2.25} />
          Multiview
          {pinnedIds.length > 0 && (
            <span className="tabular flex h-4 min-w-4 items-center justify-center rounded-full bg-kick px-1 text-[10px] font-bold text-page">
              {pinnedIds.length}
            </span>
          )}
        </Link>
        <Link
          to="/expeditions"
          title="Kick Expedition — desktop only"
          className={`hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors lg:flex ${
            pathname.startsWith('/expedition') ? 'text-ink-bright' : 'text-ink-muted hover:text-ink-bright'
          }`}
        >
          <Compass size={16} strokeWidth={2.25} />
          Expeditions
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label="Notification settings"
            title="Notification settings"
            className="rounded-lg p-2 text-ink-muted transition-colors hover:text-ink-bright"
          >
            <Bell size={18} strokeWidth={2.25} />
          </button>
          {settingsOpen && <NotificationSettingsPopover onClose={() => setSettingsOpen(false)} />}
        </div>
        <button
          type="button"
          onClick={onOpenShortcuts}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          className="rounded-lg p-2 text-ink-muted transition-colors hover:text-ink-bright"
        >
          <Keyboard size={18} strokeWidth={2.25} />
        </button>
      </nav>

      <div className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-bold text-ink-bright">
        Y
      </div>
    </header>
  );
}
