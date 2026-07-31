export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const state = on ? "checked" : "unchecked";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-state={state}
      onClick={() => onChange(!on)}
      className="h-5 w-[2.25rem] shrink-0 cursor-pointer rounded-full bg-secondary-base transition-colors data-[state=checked]:bg-primary-base"
    >
      <span
        data-state={state}
        className="block h-[0.875rem] w-[0.875rem] translate-x-[0.25rem] rounded-full bg-white transition-transform data-[state=checked]:translate-x-[calc(2.25rem-0.25rem-0.875rem)] data-[state=checked]:bg-surface-base"
      />
    </button>
  );
}
