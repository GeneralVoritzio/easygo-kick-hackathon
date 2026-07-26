import { Gift, Heart, Star } from 'lucide-react';
import type { StreamCard } from '../types';
import { PinButton } from './PinButton';

interface StreamVideoActionsProps {
  current: StreamCard;
  liked: boolean;
  onToggleLike: () => void;
  subscribed: boolean;
  onToggleSubscribe: () => void;
  pinned: boolean;
  canPinMore: boolean;
  onTogglePin: () => void;
  onOpenDonate: () => void;
}

/** Donate, Pin, Like and Subscribe live directly on the video, on every
 *  stream a viewer watches — the watch page and the Kick Expedition ride
 *  alike — not behind a menu. These are the actions a viewer reaches for
 *  most, so they get a one-tap button in plain sight, the same way
 *  `AudioFocusButton` already sits on every video surface in this app.
 *  Stacked top-right, clear of whatever badge sits top-left and
 *  `AudioFocusButton` (bottom-right). */
export function StreamVideoActions({
  current,
  liked,
  onToggleLike,
  subscribed,
  onToggleSubscribe,
  pinned,
  canPinMore,
  onTogglePin,
  onOpenDonate,
}: StreamVideoActionsProps) {
  return (
    <div className="absolute right-3 top-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={onOpenDonate}
        aria-label={`Gift Kicks to ${current.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-page/50 text-ink-bright backdrop-blur-sm transition-colors hover:bg-page/70"
      >
        <Gift size={16} strokeWidth={2.25} />
      </button>

      <PinButton pinned={pinned} disabled={!canPinMore} streamName={current.name} onToggle={onTogglePin} />

      <button
        type="button"
        onClick={onToggleLike}
        aria-pressed={liked}
        aria-label={liked ? `Unlike ${current.name}` : `Like ${current.name}`}
        className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
          liked ? 'bg-kick text-page' : 'bg-page/50 text-ink-bright hover:bg-page/70'
        }`}
      >
        <Heart size={16} strokeWidth={2.25} fill={liked ? 'currentColor' : 'none'} />
      </button>

      <button
        type="button"
        onClick={onToggleSubscribe}
        aria-pressed={subscribed}
        aria-label={subscribed ? `Unsubscribe from ${current.name}` : `Subscribe to ${current.name}`}
        className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
          subscribed ? 'bg-kick text-page' : 'bg-page/50 text-ink-bright hover:bg-page/70'
        }`}
      >
        <Star size={16} strokeWidth={2.25} fill={subscribed ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
