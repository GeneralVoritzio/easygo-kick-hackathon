import { SettingsLayout } from "../components/SettingsLayout";
import { SettingsCard } from "../components/SettingsCard";
import { SettingsSwitch } from "../components/SettingsSwitch";
import { currentUser } from "../mock/api";
import { setJoinsTanks } from "../mock/raids";
import { usePrefs, type Prefs } from "../prefs";

const contentRows: { key: keyof Prefs; label: string }[] = [
  { key: "hidePools", label: "Hide Pools, Hot Tubs & Bikinis" },
  { key: "hideSlots", label: "Hide Slots & Casino" },
  { key: "hideVrChat", label: "Hide VR Chat" },
];

const raidRows: { key: keyof Prefs; label: string; description: string }[] = [
  {
    key: "joinTanks",
    label: "Join raid tanks",
    description: "Bigger channels can put you in a raid tank.",
  },
  {
    key: "autoRaid",
    label: "Auto raid when I end a stream",
    description: "If you skip the prompt, your viewers are still passed on.",
  },
];

function Row({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const labelId = `preference-${label}`;
  return (
    <div className="flex w-full items-center justify-between gap-4 p-4">
      <div className="flex flex-col gap-1">
        <span id={labelId} className="text-base leading-6">
          {label}
        </span>
        {description && (
          <span className="text-sm text-surface-onSurfaceSecondary">{description}</span>
        )}
      </div>
      <SettingsSwitch checked={checked} onCheckedChange={onChange} aria-labelledby={labelId} />
    </div>
  );
}

export function SettingsPreferences() {
  const [prefs, update] = usePrefs();

  return (
    <SettingsLayout title="Preferences">
      <div className="flex flex-col gap-6">
        <SettingsCard
          title="Raid"
          description="Decide how your channel takes part in raids"
          bodyClass={null}
        >
          {raidRows.map((row) => (
            <Row
              key={row.key}
              label={row.label}
              description={row.description}
              checked={prefs[row.key]}
              onChange={(checked) => {
                update({ [row.key]: checked });
                if (row.key === "joinTanks") setJoinsTanks(currentUser.slug, checked);
              }}
            />
          ))}
        </SettingsCard>

        <SettingsCard
          title="Content Preferences"
          description="Customize your experience by selecting the types of content you'd like to hide"
          bodyClass={null}
        >
          {contentRows.map((row) => (
            <Row
              key={row.key}
              label={row.label}
              checked={prefs[row.key]}
              onChange={(checked) => update({ [row.key]: checked })}
            />
          ))}
        </SettingsCard>
      </div>
    </SettingsLayout>
  );
}
