import { X } from 'lucide-react';
import { SHORTCUTS, type ShortcutEntry } from '../keyboard';

interface ShortcutsHelpProps {
  onClose: () => void;
}

function groupByScope(entries: ShortcutEntry[]): [ShortcutEntry['scope'], ShortcutEntry[]][] {
  const order: ShortcutEntry['scope'][] = ['Everywhere', 'Browsing streams', 'Watching a stream', 'Multiview'];
  return order.map((scope) => [scope, entries.filter((e) => e.scope === scope)]);
}

/** Every shortcut in the app, grouped by where it applies. Reads straight
 *  from `SHORTCUTS` so this can't drift out of sync with what the actual
 *  key handlers do. */
export function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-page/70" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-ink-bright">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:text-ink-bright"
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>

        <div className="space-y-4">
          {groupByScope(SHORTCUTS).map(([scope, entries]) => (
            <div key={scope}>
              <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">{scope}</h3>
              <div className="space-y-1">
                {entries.map((entry) => (
                  <div key={`${scope}-${entry.keys}-${entry.description}`} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-ink">{entry.description}</span>
                    <kbd className="tabular shrink-0 rounded border border-line-strong bg-raised px-1.5 py-0.5 text-[11px] font-semibold text-ink-bright">
                      {entry.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
