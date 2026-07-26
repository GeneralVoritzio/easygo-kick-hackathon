import { createContext, useContext, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'kick-web-redesign:settings';

interface StoredSettings {
  bossAlertsEnabled: boolean;
  expeditionAlertsEnabled: boolean;
  /** Streamer ids that have opted their own channel out of ever hosting a
   *  Kick Boss / Kick Monster — see the toggle on `WatchPage`. There's no
   *  real per-channel auth in this prototype, so any viewer can flip this
   *  for the channel they're looking at; in a real product it would be
   *  gated to that streamer's own account. */
  bossOptOutStreamerIds: string[];
}

const DEFAULT_SETTINGS: StoredSettings = {
  bossAlertsEnabled: true,
  expeditionAlertsEnabled: true,
  bossOptOutStreamerIds: [],
};

function loadSettings(): StoredSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: StoredSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable (private browsing, quota) — the toggle
    // just won't survive a reload then, not worth surfacing as an error.
  }
}

interface SettingsContextValue {
  bossAlertsEnabled: boolean;
  setBossAlertsEnabled: (enabled: boolean) => void;
  expeditionAlertsEnabled: boolean;
  setExpeditionAlertsEnabled: (enabled: boolean) => void;
  isStreamerOptedOutOfBoss: (streamerId: string) => boolean;
  toggleStreamerBossOptOut: (streamerId: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Viewer- and streamer-level opt-outs for Kick Boss / Kick Expedition
 *  notifications, persisted to localStorage — "stop nudging me" should
 *  survive a reload, unlike the rest of this prototype's deliberately
 *  fresh mock data every load. Sits above `KickBossProvider`, which reads
 *  `isStreamerOptedOutOfBoss` to keep opted-out channels out of the random
 *  spawn pool entirely. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(loadSettings);

  const update = (patch: Partial<StoredSettings>) => {
    const next = { ...settings, ...patch };
    saveSettings(next);
    setSettings(next);
  };

  const value: SettingsContextValue = {
    bossAlertsEnabled: settings.bossAlertsEnabled,
    setBossAlertsEnabled: (enabled) => update({ bossAlertsEnabled: enabled }),
    expeditionAlertsEnabled: settings.expeditionAlertsEnabled,
    setExpeditionAlertsEnabled: (enabled) => update({ expeditionAlertsEnabled: enabled }),
    isStreamerOptedOutOfBoss: (streamerId) => settings.bossOptOutStreamerIds.includes(streamerId),
    toggleStreamerBossOptOut: (streamerId) => {
      const optedOut = settings.bossOptOutStreamerIds.includes(streamerId);
      const bossOptOutStreamerIds = optedOut
        ? settings.bossOptOutStreamerIds.filter((id) => id !== streamerId)
        : [...settings.bossOptOutStreamerIds, streamerId];
      update({ bossOptOutStreamerIds });
    },
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
