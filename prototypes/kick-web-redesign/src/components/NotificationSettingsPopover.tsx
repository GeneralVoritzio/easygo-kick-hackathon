import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Switch } from './Switch';

interface NotificationSettingsPopoverProps {
  onClose: () => void;
}

/** Lets a viewer opt out of being nudged at all — "toggle these
 *  notifications off so they don't get involved." Turning Kick Boss off
 *  also hides the fight itself (the glow, the panel) on any stream they
 *  visit, not just the Home nudge — see the gating in `WatchPage` and
 *  `ExpeditionPage`. Persisted via `SettingsContext`, so it stays off
 *  across a reload. */
export function NotificationSettingsPopover({ onClose }: NotificationSettingsPopoverProps) {
  const { bossAlertsEnabled, setBossAlertsEnabled, expeditionAlertsEnabled, setExpeditionAlertsEnabled } = useSettings();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-ink-bright">Notifications</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted transition-colors hover:text-ink-bright">
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-bright">Kick Boss alerts</p>
              <p className="text-[11px] leading-snug text-ink-muted">The idle nudge, and the fight itself if you visit that stream.</p>
            </div>
            <Switch checked={bossAlertsEnabled} onChange={setBossAlertsEnabled} label="Kick Boss alerts" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-bright">Kick Expedition nudges</p>
              <p className="text-[11px] leading-snug text-ink-muted">The idle nudge to join an expedition already under way.</p>
            </div>
            <Switch checked={expeditionAlertsEnabled} onChange={setExpeditionAlertsEnabled} label="Kick Expedition nudges" />
          </div>
        </div>
      </div>
    </>
  );
}
