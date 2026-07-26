import { Layers } from 'lucide-react';

interface PinButtonProps {
  pinned: boolean;
  disabled?: boolean;
  streamName: string;
  onToggle: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

/** Same `Layers` icon `Navbar` uses for the Multiview link — pinning is
 *  literally "add this to Multiview", so the icon should read as the same
 *  action, not a separate metaphor (a thumbtack) for the same thing. */
export function PinButton({ pinned, disabled, streamName, onToggle, size = 'md', className = '' }: PinButtonProps) {
  const dimensions = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 14 : 18;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle();
      }}
      disabled={disabled && !pinned}
      aria-pressed={pinned}
      aria-label={pinned ? `Unpin ${streamName}` : `Pin ${streamName} for Multiview`}
      title={disabled && !pinned ? 'Multiview is full — unpin something first' : undefined}
      className={`flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${dimensions} ${
        pinned
          ? 'bg-kick text-page'
          : disabled
            ? 'bg-page/50 text-ink-disabled'
            : 'bg-page/50 text-ink-bright hover:bg-page/70'
      } ${className}`}
    >
      <Layers size={iconSize} strokeWidth={2.25} fill={pinned ? 'currentColor' : 'none'} />
    </button>
  );
}
