import { Compass, X } from 'lucide-react';
import type { Expedition } from '../types';
import { NotificationCountdownBar } from './NotificationCountdownBar';

interface ExpeditionPromptToastProps {
  expedition: Expedition;
  onJoin: () => void;
  onDismiss: () => void;
}

const NOTIFICATION_DURATION_MS = 12_000;

/** The idle/long-scroll nudge onto Kick Expedition. Always points at an
 *  expedition that's already `in-progress` (never a boarding one) — joining
 *  should read as "hop on what's happening right now," matching "20 other
 *  viewers on a kick expedition ... live now" rather than a wait to board.
 *
 *  Renders inside `NotificationStack`, which owns the fixed positioning —
 *  this is just the card. */
export function ExpeditionPromptToast({ expedition, onJoin, onDismiss }: ExpeditionPromptToastProps) {
  return (
    <div className="w-[min(92vw,340px)] rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-kick/15 text-kick">
            <Compass size={16} strokeWidth={2.25} />
          </span>
          <h3 className="text-sm font-extrabold text-ink-bright">Still deciding what to watch?</h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-ink-muted transition-colors hover:text-ink-bright"
        >
          <X size={16} strokeWidth={2.25} />
        </button>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-ink-muted">
        <span className="tabular font-semibold text-ink-bright">{expedition.viewerCount} other viewers</span> are on a
        Kick Expedition right now — a guided hop between random live streamers, one minute each. Stay on any stop you
        like.
      </p>

      <div className="mb-3 flex -space-x-2">
        {expedition.stops.slice(0, 6).map((card) => (
          <div
            key={card.id}
            title={card.name}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-surface text-[9px] font-black text-page"
            style={{ backgroundImage: card.gradient }}
          >
            {card.name.slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onJoin}
          className="flex-1 rounded-lg bg-kick px-3 py-2 text-xs font-bold text-page transition-colors hover:bg-kick-hover"
        >
          Join the expedition
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:text-ink-bright"
        >
          Not now
        </button>
      </div>

      <NotificationCountdownBar durationMs={NOTIFICATION_DURATION_MS} colorClass="bg-kick" onExpire={onDismiss} />
    </div>
  );
}
