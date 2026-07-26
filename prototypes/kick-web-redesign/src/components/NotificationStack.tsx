import type { ReactNode } from 'react';

interface NotificationStackProps {
  children: ReactNode;
}

/** Every bottom-right toast on Home renders inside this instead of setting
 *  its own `fixed` position — a plain flex column that grows upward from
 *  the pinned bottom-right corner, so if more than one happens to be
 *  visible at once they stack with a gap instead of sitting on top of
 *  each other. */
export function NotificationStack({ children }: NotificationStackProps) {
  return <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">{children}</div>;
}
