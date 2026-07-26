import { Volume2, VolumeX } from 'lucide-react';

interface AudioFocusButtonProps {
  isAudioActive: boolean;
  streamName: string;
  onFocus: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

/** The audio-focus control, shared by the discovery tile, dock thumbnails,
 *  and focus-mosaic tiles so all three look and behave the same.
 *  Translucent rather than a solid fill in either state, so it reads as a
 *  HUD overlay rather than a physical opaque tile sitting on the video.
 *
 *  Framer's tap gesture on the surrounding tile listens natively and fires
 *  during the real bubble phase, before a bubble-phase stopPropagation on
 *  this button would run — capture-phase stopPropagation fires first and
 *  actually pre-empts it, so this button's tap doesn't also open the tile. */
export function AudioFocusButton({ isAudioActive, streamName, onFocus, size = 'md', className = '' }: AudioFocusButtonProps) {
  const dimensions = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
  const iconSize = size === 'sm' ? 12 : 16;
  const Icon = isAudioActive ? Volume2 : VolumeX;

  return (
    <button
      type="button"
      onPointerDownCapture={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
      aria-label={isAudioActive ? `${streamName} audio on` : `Switch audio to ${streamName}`}
      className={`flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${dimensions} ${
        isAudioActive ? 'bg-kick/25 text-kick ring-1 ring-kick/50' : 'bg-page/35 text-ink'
      } ${className}`}
    >
      <Icon size={iconSize} strokeWidth={2.25} />
    </button>
  );
}
