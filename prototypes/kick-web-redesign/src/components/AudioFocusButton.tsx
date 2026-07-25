import { Volume2, VolumeX } from 'lucide-react';

interface AudioFocusButtonProps {
  isAudioActive: boolean;
  streamName: string;
  onFocus: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

/** Same visual language as `prototypes/kick-mobile-app`'s audio button:
 *  translucent in both states. Everything here uses plain `onClick` (no
 *  framer-motion `onTap` gesture on the surrounding tiles), so an ordinary
 *  bubble-phase `stopPropagation` is enough to stop this tap from also
 *  triggering the tile underneath. Only one tile has audio at a time,
 *  everywhere it's used. */
export function AudioFocusButton({ isAudioActive, streamName, onFocus, size = 'md', className = '' }: AudioFocusButtonProps) {
  const dimensions = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 14 : 18;
  const Icon = isAudioActive ? Volume2 : VolumeX;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onFocus();
      }}
      aria-label={isAudioActive ? `${streamName} audio on` : `Switch audio to ${streamName}`}
      className={`flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${dimensions} ${
        isAudioActive ? 'bg-kick/25 text-kick ring-1 ring-kick/50' : 'bg-page/50 text-ink'
      } ${className}`}
    >
      <Icon size={iconSize} strokeWidth={2.25} />
    </button>
  );
}
