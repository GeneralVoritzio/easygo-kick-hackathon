import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { History, Share2, Sparkles, X, Zap, type LucideIcon } from 'lucide-react';
import type { StreamSession } from '@shared/types';
import { buildRecap, detectHighlights } from './recap';
import { RecapView } from './RecapView';
import { HighlightsPanel } from './HighlightsPanel';
import { SharePanel } from './SharePanel';

interface RecapWidgetProps {
  session: StreamSession;
}

type PanelId = 'recap' | 'highlights' | 'share';

interface BubbleOption {
  id: PanelId;
  label: string;
  Icon: LucideIcon;
}

const BUBBLE_OPTIONS: BubbleOption[] = [
  { id: 'recap', label: 'Recap', Icon: History },
  { id: 'highlights', label: 'Highlights', Icon: Zap },
  { id: 'share', label: 'Share', Icon: Share2 },
];

/** The permanent widget on the video player: a small button that expands
 *  into a stack of option bubbles. Positioned mid-right rather than a
 *  corner, so it never sits under a "LIVE" badge (top) or the native
 *  player's own controls (bottom).
 *
 *  The outer wrapper centers on the button alone (`top-1/2 -translate-y-1/2`
 *  against just the button's own fixed size) — the bubble stack is
 *  `absolute bottom-full`, popped out of flow above it, so opening it can
 *  never change what that wrapper is centering against. Putting the
 *  bubbles inside the centered flex column instead (button as just the
 *  last flex item) was the original bug: the column's height grows when
 *  bubbles mount, the centering recomputes off the new taller box, and the
 *  button — now at the bottom of a taller centered box — visibly drops. */
export function RecapWidget({ session }: RecapWidgetProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [recapStartIndex, setRecapStartIndex] = useState(0);

  const segments = useMemo(() => buildRecap(session), [session]);
  const highlights = useMemo(() => detectHighlights(session.engagement), [session.engagement]);

  const openPanel = (id: PanelId) => {
    setMenuOpen(false);
    setRecapStartIndex(0);
    setActivePanel(id);
  };

  const jumpToHighlight = (highlightId: string) => {
    const index = segments.findIndex((s) => s.id === highlightId);
    setRecapStartIndex(index >= 0 ? index : 0);
    setActivePanel('recap');
  };

  return (
    <>
      <div className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
        <div className="relative">
          <AnimatePresence>
            {menuOpen && (
              <div className="absolute bottom-full right-0 mb-3 flex flex-col items-end gap-3">
                {BUBBLE_OPTIONS.map((option, i) => (
                  <motion.button
                    key={option.id}
                    type="button"
                    onClick={() => openPanel(option.id)}
                    initial={{ opacity: 0, scale: 0.4, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{ delay: i * 0.04, type: 'spring', bounce: 0.35, duration: 0.4 }}
                    className="flex items-center gap-2"
                  >
                    <span className="rounded-full border border-line bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-ink-bright shadow-md backdrop-blur-sm">
                      {option.label}
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface/95 text-ink-bright shadow-md backdrop-blur-sm">
                      <option.Icon size={18} strokeWidth={2.25} />
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

      <AnimatePresence>
        {activePanel === 'recap' && (
          <RecapView
            key="recap"
            segments={segments}
            initialIndex={recapStartIndex}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === 'highlights' && (
          <HighlightsPanel
            key="highlights"
            highlights={highlights}
            onSelect={jumpToHighlight}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === 'share' && <SharePanel key="share" onClose={() => setActivePanel(null)} />}
      </AnimatePresence>
    </>
  );
}
