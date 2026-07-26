import { useState } from "react";
import { SettingsLayout } from "../components/SettingsLayout";
import { SettingsSwitch } from "../components/SettingsSwitch";

type PreferenceKey = "poolsHotTubsBikinis" | "slotsCasino" | "vrChat";

const preferenceRows: { key: PreferenceKey; label: string }[] = [
  { key: "poolsHotTubsBikinis", label: "Hide Pools, Hot Tubs & Bikinis" },
  { key: "slotsCasino", label: "Hide Slots & Casino" },
  { key: "vrChat", label: "Hide VR Chat" },
];

export function SettingsPreferences() {
  const [preferences, setPreferences] = useState<Record<PreferenceKey, boolean>>({
    poolsHotTubsBikinis: false,
    slotsCasino: false,
    vrChat: false,
  });

  return (
    <SettingsLayout title="Preferences">
      <section className="flex flex-col gap-4 py-6">
        <h3 className="text-base font-bold leading-[1.2] text-white">Content Preferences</h3>
        <span className="text-sm text-surface-onSurfaceSecondary">
          Customize your experience by selecting the types of content you want to see less of on Kick.
        </span>
        <div className="flex flex-col">
          {preferenceRows.map((row) => {
            const labelId = `preference-${row.key}`;
            return (
              <div
                key={row.key}
                className="flex items-center justify-between gap-4 border-t border-outline-decorative py-4 first:border-t-0 first:pt-0"
              >
                <span id={labelId} className="text-sm font-semibold text-white">
                  {row.label}
                </span>
                <SettingsSwitch
                  checked={preferences[row.key]}
                  onCheckedChange={(checked) =>
                    setPreferences((current) => ({ ...current, [row.key]: checked }))
                  }
                  aria-labelledby={labelId}
                />
              </div>
            );
          })}
        </div>
      </section>
    </SettingsLayout>
  );
}
