export interface ShortcutEntry {
  keys: string;
  description: string;
  scope: 'Everywhere' | 'Browsing streams' | 'Watching a stream' | 'Multiview';
}

/** Single source of truth for both what the shortcuts actually do (each
 *  handler references its own entry below) and what `ShortcutsHelp` shows —
 *  so the help overlay can't quietly drift out of sync with real behavior. */
export const SHORTCUTS: ShortcutEntry[] = [
  { keys: '?', description: 'Show or hide this list', scope: 'Everywhere' },
  { keys: 'H', description: 'Go to Home', scope: 'Everywhere' },
  { keys: 'V', description: 'Go to Multiview', scope: 'Everywhere' },
  { keys: 'Tab / Shift+Tab', description: 'Move between streams, buttons, and links', scope: 'Everywhere' },
  { keys: 'Esc', description: 'Close this list', scope: 'Everywhere' },
  { keys: 'Enter', description: 'Open the focused stream', scope: 'Browsing streams' },
  { keys: 'P', description: 'Pin or unpin the focused stream', scope: 'Browsing streams' },
  { keys: 'M', description: 'Toggle audio', scope: 'Watching a stream' },
  { keys: 'P', description: 'Pin or unpin this stream', scope: 'Watching a stream' },
  { keys: '1 – 9', description: 'Switch audio to that tile', scope: 'Multiview' },
];

/** Shortcuts never fire while the target is a text field — a chat message
 *  containing the letter "p" shouldn't pin anything. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

/** True if the keydown should be ignored entirely: typing in a field, or a
 *  browser/OS chord (Cmd/Ctrl/Alt held) that a single-letter shortcut must
 *  never shadow. */
export function shouldIgnoreShortcut(e: KeyboardEvent): boolean {
  return isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey;
}
