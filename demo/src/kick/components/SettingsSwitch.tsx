type SettingsSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-labelledby"?: string;
  "aria-label"?: string;
};

export function SettingsSwitch({ checked, onCheckedChange, ...aria }: SettingsSwitchProps) {
  const state = checked ? "checked" : "unchecked";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={state}
      onClick={() => onCheckedChange(!checked)}
      {...aria}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors betterhover:hover:brightness-110 data-[state=checked]:bg-primary-base data-[state=unchecked]:bg-secondary-base"
    >
      <span
        data-state={state}
        className="pointer-events-none block size-4 rounded-full bg-white transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      />
    </button>
  );
}
