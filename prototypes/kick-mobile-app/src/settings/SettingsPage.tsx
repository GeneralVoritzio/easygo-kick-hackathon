import { useState } from 'react';
import type { ReactNode } from 'react';
import youAvatar from '../assets/avatars/you.svg';
import { Toggle } from './Toggle';

function SectionHeader({ children }: { children: string }) {
  return <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">{children}</h3>;
}

interface SettingRowProps {
  label: string;
  description?: string;
  control: ReactNode;
}

function SettingRow({ label, description, control }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-bright">{label}</p>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      {control}
    </div>
  );
}

/** The Profile tab: basic app configuration, not a passport/card-collection
 *  screen. Every toggle is local UI state — there's no backend to persist
 *  it to, same as the rest of this prototype's mock-only settings. */
export function SettingsPage() {
  const [autoplay, setAutoplay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [pinnedAlerts, setPinnedAlerts] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4">
        <img src={youAvatar} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink-bright">@you</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Kick Mobile viewer</p>
        </div>
      </div>

      <section>
        <SectionHeader>Playback</SectionHeader>
        <div className="divide-y divide-line rounded-lg border border-line bg-surface">
          <SettingRow
            label="Autoplay"
            description="Start the next stream automatically while browsing"
            control={<Toggle checked={autoplay} onChange={setAutoplay} label="Autoplay" />}
          />
          <SettingRow
            label="Data saver"
            description="Reduce video quality on mobile data"
            control={<Toggle checked={dataSaver} onChange={setDataSaver} label="Data saver" />}
          />
        </div>
      </section>

      <section>
        <SectionHeader>Notifications</SectionHeader>
        <div className="divide-y divide-line rounded-lg border border-line bg-surface">
          <SettingRow
            label="Push notifications"
            description="Alerts for follows, events and drops"
            control={<Toggle checked={pushNotifications} onChange={setPushNotifications} label="Push notifications" />}
          />
          <SettingRow
            label="Pinned channel alerts"
            description="Notify when a pinned channel goes live"
            control={<Toggle checked={pinnedAlerts} onChange={setPinnedAlerts} label="Pinned channel alerts" />}
          />
        </div>
      </section>

      <section>
        <SectionHeader>About</SectionHeader>
        <div className="divide-y divide-line rounded-lg border border-line bg-surface">
          <SettingRow label="App version" control={<span className="text-xs text-ink-muted">1.0.0</span>} />
          <SettingRow label="Sign out" control={<span className="text-xs font-semibold text-danger">Sign out</span>} />
        </div>
      </section>
    </div>
  );
}
