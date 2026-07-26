import { motion } from 'framer-motion';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

/** A plain on/off switch, shared by every settings toggle in the app
 *  (notification preferences, a streamer's own Kick Boss opt-out) — one
 *  visual language for "this is a persistent setting," distinct from the
 *  action buttons (`PinButton`, `AudioFocusButton`) that toggle live state
 *  instead.
 *
 *  The knob animates on a spring (matching every other bit of motion in
 *  this app), not a CSS class swap between two `translate-x-*` utilities —
 *  that version had no easing worth the name and read as a jump cut
 *  rather than a slide. */
export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 active:scale-95 ${
        checked ? 'bg-kick' : 'bg-raised'
      }`}
    >
      <motion.span
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute top-0.5 left-0 h-5 w-5 rounded-full bg-white shadow-md"
      />
    </button>
  );
}
