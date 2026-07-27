import { useState } from "react";
import { SettingsLayout } from "../components/SettingsLayout";
import { SettingsCard } from "../components/SettingsCard";
import { SettingsSwitch } from "../components/SettingsSwitch";

const rows = [
  { key: "pools", label: "Hide Pools, Hot Tubs & Bikinis" },
  { key: "slots", label: "Hide Slots & Casino" },
  { key: "vrchat", label: "Hide VR Chat" },
];

export function SettingsPreferences() {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  return (
    <SettingsLayout title="Preferences">
      <SettingsCard
        title="Content Preferences"
        description="Customize your experience by selecting the types of content you'd like to hide"
        bodyClass={null}
      >
        {rows.map((row) => {
          const labelId = `preference-${row.key}`;
          return (
            <div
              key={row.key}
              className="p-4 flex w-full items-center justify-between gap-4 py-4"
            >
              <span id={labelId} className="text-base leading-6">
                {row.label}
              </span>
              <SettingsSwitch
                checked={hidden[row.key] ?? false}
                onCheckedChange={(checked) =>
                  setHidden((current) => ({ ...current, [row.key]: checked }))
                }
                aria-labelledby={labelId}
              />
            </div>
          );
        })}
      </SettingsCard>
    </SettingsLayout>
  );
}
