import type { ReactNode } from "react";

/*
  Every bottom-right toast on Home renders inside this instead of setting its own fixed position
  — a plain flex column that grows upward from the pinned bottom-right corner, so more than one
  visible at once stacks with a gap instead of sitting on top of each other. Ported from
  kick-web-redesign's NotificationStack.tsx.
*/
export function NotificationStack({ children }: { children: ReactNode }) {
  return <div className="fixed bottom-5 right-5 z-[500] flex flex-col items-end gap-3">{children}</div>;
}
