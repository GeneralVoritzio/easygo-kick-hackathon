const buttonBase =
  "group inline-flex gap-1.5 items-center justify-center rounded font-semibold box-border relative transition-all betterhover:active:scale-[0.98] disabled:pointer-events-none select-none whitespace-nowrap [&_svg]:size-[1em] outline-transparent outline outline-2 outline-offset-2 disabled:text-disabled-onSurface focus-visible:outline-focusLight px-3 py-1.5 text-sm";

export const buttonClass = {
  primary: `${buttonBase} state-layer-base bg-primary-base text-primary-onPrimary focus-visible:bg-green-500 disabled:bg-disabled-base`,
  secondary: `${buttonBase} state-layer-surface bg-secondary-base text-secondary-onSecondary focus-visible:bg-secondary-base disabled:bg-disabled-base`,
  ghost: `${buttonBase} state-layer-surface text-surface-onSurface bg-transparent disabled:bg-transparent`,
};

// The label stays inline, so its line box is 24px and the control carries the 8px gap.
// This is what KICK's space-y-2 produces on Tailwind v3, which v4 no longer does.
export const fieldClass = "mt-2";

export const inputClass = `border-outline-region bg-surface-lowest placeholder:text-surface-onSurfaceSecondary betterhover:hover:border-neutral-300 flex w-full rounded border border-solid px-3 font-normal outline-none transition-colors duration-200 ease-in-out focus-visible:border-white disabled:bg-transparent h-9 text-sm ${fieldClass}`;

export const labelClass = "text-surface-onSurface text-sm font-semibold leading-none";
