import { Icon } from "../Icon";

/*
  The speaker toggle used on a Multiview tile and the Expedition ride. Only one stream holds
  audio focus at a time, everywhere this is used. Ported from kick-web-redesign's
  AudioFocusButton.tsx, using our own Icon set instead of lucide-react.
*/
export function AudioFocusButton({
  isAudioActive,
  streamName,
  onFocus,
  size = "md",
  className = "",
}: {
  isAudioActive: boolean;
  streamName: string;
  onFocus: () => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const dimensions = size === "sm" ? "size-7" : "size-9";
  const iconSize = size === "sm" ? "size-3.5" : "size-[18px]";

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
        isAudioActive
          ? "bg-primary-base/25 text-primary-base ring-1 ring-primary-base/50"
          : "bg-black/50 text-white"
      } ${className}`}
    >
      <Icon name={isAudioActive ? "volume" : "mute"} className={iconSize} />
    </button>
  );
}
