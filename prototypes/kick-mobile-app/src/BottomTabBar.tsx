import { Home, User, Users, type LucideIcon } from 'lucide-react';
import type { Tab } from './tabs';

interface BottomTabBarProps {
  active: Tab;
  onSelect: (tab: Tab) => void;
}

const TAB_CONFIG: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'community', label: 'Community', Icon: Users },
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'profile', label: 'Profile', Icon: User },
];

/** Footer nav — mobile apps live in the bottom bar, not a header. Icon-only
 *  (labels are `aria-label`s for screen readers, not visible text); the
 *  active tab gets a top bar in Kick green plus a filled-in icon color. */
export function BottomTabBar({ active, onSelect }: BottomTabBarProps) {
  return (
    <nav className="flex shrink-0 border-t border-line bg-page pb-[env(safe-area-inset-bottom)]">
      {TAB_CONFIG.map(({ id, label, Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-label={label}
            className={`relative flex flex-1 items-center justify-center py-1.5 transition-colors ${
              isActive ? 'text-kick' : 'text-ink-muted'
            }`}
          >
            {isActive && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-kick" />}
            <Icon size={20} strokeWidth={2.25} />
          </button>
        );
      })}
    </nav>
  );
}
