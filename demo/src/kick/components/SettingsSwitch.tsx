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
      className="shrink-0 relative flex items-center cursor-pointer rounded-full transition-all disabled:pointer-events-none disabled:opacity-50 h-5 w-[2.25rem] bg-secondary-base data-[state=checked]:bg-primary-base"
    >
      <span
        data-state={state}
        className="block rounded-full bg-white transition-all will-change-transform h-[0.875rem] w-[0.875rem] translate-x-[0.25rem] data-[state=checked]:translate-x-[calc(2.25rem-0.25rem-0.875rem)] data-[state=checked]:bg-surface-base"
      />
    </button>
  );
}
