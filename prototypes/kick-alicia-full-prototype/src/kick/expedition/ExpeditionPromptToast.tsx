import type { ReactNode } from "react";
import { Icon } from "../Icon";
import { colorFor } from "../mock/chatIdentities";
import { NotificationCountdownBar } from "./NotificationCountdownBar";
import type { Expedition } from "./data";

const NOTIFICATION_DURATION_MS = 12_000;

/*
  The idle/long-browse nudge onto Kick Expedition, and also what a waitlist promotion reuses
  (same card, different copy and join label) — both point at a boarding expedition, "ready to
  depart," so joining reads as "get on before it leaves." Renders inside NotificationStack, which
  owns the fixed positioning; this is just the card. Ported from kick-web-redesign's
  ExpeditionPromptToast.tsx.
*/
export function ExpeditionPromptToast({
  expedition,
  title = "An expedition is about to depart",
  body,
  joinLabel = "Join the expedition",
  onJoin,
  onDismiss,
}: {
  expedition: Expedition;
  title?: string;
  body?: ReactNode;
  joinLabel?: string;
  onJoin: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="w-[min(92vw,340px)] rounded-2xl border border-outline-decorative bg-surface-base p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-base/15 text-primary-base">
            <Icon name="expedition" className="size-4" />
          </span>
          <h3 className="text-sm font-extrabold text-white">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-subtle transition-colors betterhover:hover:text-white"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-subtle">
        {body ?? (
          <>
            <span className="font-semibold text-white">{expedition.name}</span> departs in{" "}
            <span className="tabular-nums font-semibold text-white">{expedition.secondsRemaining}s</span> — a
            guided hop between random live streamers, one stop each. Stay on any stop you like.
          </>
        )}
      </p>

      <div className="mb-3 flex -space-x-2">
        {expedition.stops.slice(0, 6).map((stream) => (
          <div
            key={stream.channel.slug}
            title={stream.channel.username}
            style={{ background: colorFor(stream.channel.username) }}
            className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-surface-base text-[9px] font-black text-black"
          >
            {stream.channel.username.slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onJoin}
          className="flex-1 rounded-lg bg-primary-base px-3 py-2 text-xs font-bold text-primary-onPrimary transition-colors betterhover:hover:bg-green-400"
        >
          {joinLabel}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-subtle transition-colors betterhover:hover:text-white"
        >
          Not now
        </button>
      </div>

      <NotificationCountdownBar
        durationMs={NOTIFICATION_DURATION_MS}
        colorClass="bg-primary-base"
        onExpire={onDismiss}
      />
    </div>
  );
}
