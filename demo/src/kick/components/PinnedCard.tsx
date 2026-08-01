import type { ReactNode } from "react";

// The floating pinned card, copied from the live chat pinned message: a rounded, bordered
// card over the top of the feed. Every notice docked at the top of a chat panel shares this
// shell, so a viewer reads them as one family of surface, not a pile of one-off banners.
export function PinnedCard({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-auto relative flex flex-col gap-1.5 rounded border-2 border-[#4a5158] bg-surface-base px-3 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      {children}
    </div>
  );
}
