import { Icon } from "../Icon";

/*
  The pin toggle — add or remove a stream from Multiview. Shown wherever a stream already
  appears as a card or row, not only on the Expedition/Multiview pages themselves. Ported from
  kick-web-redesign's PinButton.tsx, which uses the same icon here as the sidebar's Multiview
  link — pinning is literally "add this to Multiview", so the two should read as one action.
*/
export function PinButton({
  pinned,
  disabled,
  streamName,
  onToggle,
  size = "md",
  className = "",
}: {
  pinned: boolean;
  disabled?: boolean;
  streamName: string;
  onToggle: () => void;
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
        onToggle();
      }}
      disabled={disabled && !pinned}
      aria-pressed={pinned}
      aria-label={pinned ? `Unpin ${streamName}` : `Pin ${streamName} for Multiview`}
      title={disabled && !pinned ? "Multiview is full — unpin something first" : undefined}
      className={`flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${dimensions} ${
        pinned
          ? "bg-primary-base text-primary-onPrimary"
          : disabled
            ? "bg-black/50 text-white/40"
            : "bg-black/50 text-white betterhover:hover:bg-black/70 betterhover:hover:text-primary-base"
      } ${className}`}
    >
      <Icon name="multiview" className={iconSize} />
    </button>
  );
}
