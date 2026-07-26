import { Link } from 'react-router';
import { Flame, Skull, X } from 'lucide-react';
import type { KickBoss } from '../types';
import { NotificationCountdownBar } from './NotificationCountdownBar';

interface KickBossAnnouncementProps {
  boss: KickBoss;
  onJump: () => void;
  onDismiss: () => void;
}

const NOTIFICATION_DURATION_MS = 12_000;

/** The call-to-arms — Home page only, and only while the viewer is idle
 *  there (see `useIdleNudge`), same as the Kick Expedition nudge, and in
 *  the same bottom-right spot so every Home nudge lives in one place
 *  rather than scattered around the screen. Once someone's actually
 *  watching a stream or riding an expedition they're not "still deciding,"
 *  so this never interrupts that.
 *
 *  Renders inside `NotificationStack`, which owns the fixed positioning —
 *  this is just the card. */
export function KickBossAnnouncement({ boss, onJump, onDismiss }: KickBossAnnouncementProps) {
  const Icon = boss.kind === 'boss' ? Skull : Flame;
  const label = boss.kind === 'boss' ? 'Kick Boss' : 'Kick Monster';

  return (
    <div className="w-[min(92vw,340px)] rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-live/15 text-live">
            <Icon size={16} strokeWidth={2.25} className="animate-live-pulse" />
          </span>
          <h3 className="text-sm font-extrabold text-ink-bright">{label} appeared</h3>
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
        <span className="font-semibold text-ink-bright">{boss.name}</span> is attacking {boss.streamerName}'s stream.
        Jump in and help take it down!
      </p>

      <div className="flex gap-2">
        <Link
          to={`/watch/${boss.streamerId}`}
          onClick={onJump}
          className="flex-1 rounded-lg bg-live px-3 py-2 text-center text-xs font-bold text-white transition-colors hover:bg-live/85"
        >
          Jump in
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:text-ink-bright"
        >
          Not now
        </button>
      </div>

      <NotificationCountdownBar durationMs={NOTIFICATION_DURATION_MS} colorClass="bg-live" onExpire={onDismiss} />
    </div>
  );
}
