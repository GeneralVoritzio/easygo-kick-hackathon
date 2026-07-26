import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, type LucideIcon } from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  Icon: LucideIcon;
}

interface QuickActionsWidgetProps {
  /** Hoist this to a module-level constant in the caller — see the note
   *  on `BUBBLE_TRANSITIONS` below for why a fresh array every render is
   *  the one thing that breaks the stagger. */
  actions: QuickAction[];
  /** Renders whichever panel is open, given its id and a close callback.
   *  Returning `null`/`undefined` renders nothing (and the widget won't
   *  call this until an action is actually selected). */
  renderPanel: (activeId: string, close: () => void) => ReactNode;
}

const BUBBLE_INITIAL = { opacity: 0, scale: 0.4, y: 10 };
const BUBBLE_ANIMATE = { opacity: 1, scale: 1, y: 0 };
const BUBBLE_EXIT = { opacity: 0, scale: 0.4 };

/** The permanent-widget pattern from `prototypes/kick-recap`'s
 *  `RecapWidget`, generalized: a small button on the video that fans out
 *  into option bubbles, each opening a bottom sheet. Used on a plain watch
 *  page (Share only) and on a Kick Expedition ride (Share, Recap) — same
 *  component, different `actions` list.
 *
 *  Positioned bottom-left — the one corner nothing else on the video
 *  claims: `AudioFocusButton` sits bottom-right, `StreamVideoActions`
 *  (Donate/Pin/Like/Subscribe) stacks top-right, and Kick Expedition's own
 *  "Stop X/Y" badge sits top-left. Centering this vertically on the
 *  video (as `prototypes/kick-recap` does on a full 100dvh page) collided
 *  with the top-right stack on any video pane short enough for the two to
 *  overlap — a corner both of them can't reach avoids that regardless of
 *  pane height.
 *

 *  `initial`/`animate`/`exit` are stable module constants, not object
 *  literals rebuilt in JSX every render: on a page whose data ticks on a
 *  clock (Kick Expedition), the host re-renders every second, and a fresh
 *  `transition` object on every render restarts a bubble's pending delay
 *  before it ever fires. The caller must hoist `actions` the same way for
 *  the same reason — its per-item stagger delay is derived from array
 *  index, which needs a stable array reference to stay stable itself. */
export function QuickActionsWidget({ actions, renderPanel }: QuickActionsWidgetProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  /** Memoized (not just relying on the caller hoisting `actions`) so the
   *  per-item stagger `transition` object stays referentially stable
   *  across re-renders even if it didn't — belt and suspenders against
   *  the delay-restart bug described above. */
  const transitions = useMemo(
    () => actions.map((_, i) => ({ delay: i * 0.04, type: 'spring' as const, bounce: 0.35, duration: 0.4 })),
    [actions]
  );

  const select = (id: string) => {
    setMenuOpen(false);
    setActiveId(id);
  };

  return (
    <>
      <div className="absolute bottom-3 left-3 z-30">
        <div className="relative">
          <AnimatePresence>
            {menuOpen && (
              <div className="absolute bottom-full left-0 mb-3 flex flex-col items-start gap-2">
                {actions.map((action, i) => (
                  <motion.button
                    key={action.id}
                    type="button"
                    onClick={() => select(action.id)}
                    initial={BUBBLE_INITIAL}
                    animate={BUBBLE_ANIMATE}
                    exit={BUBBLE_EXIT}
                    transition={transitions[i]}
                    className="flex items-center gap-2"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface/95 text-ink-bright shadow-md backdrop-blur-sm">
                      <action.Icon size={16} strokeWidth={2.25} />
                    </span>
                    <span className="rounded-full border border-line bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-ink-bright shadow-md backdrop-blur-sm">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close quick actions' : 'Open quick actions'}
            aria-expanded={menuOpen}
            className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-glow transition-colors ${
              menuOpen ? 'border-line bg-surface text-ink-bright' : 'border-kick/50 bg-kick/20 text-kick'
            } backdrop-blur-sm`}
          >
            {menuOpen ? <X size={20} strokeWidth={2.25} /> : <Sparkles size={20} strokeWidth={2.25} />}
          </button>
        </div>
      </div>

      <AnimatePresence>{activeId && renderPanel(activeId, () => setActiveId(null))}</AnimatePresence>
    </>
  );
}
