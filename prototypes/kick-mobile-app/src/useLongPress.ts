import { useRef, useState } from 'react';

const MOVE_CANCEL_PX = 12;

/** Press-and-hold detection for "hold the discovery tile to pin it".
 *  `holding` drives the charge-up ring while the timer is running. Cancels
 *  itself if the pointer moves more than a few px, so an actual swipe
 *  doesn't also register as a hold (the tile's own `onDragStart` calls
 *  `cancel` too, for movement framer's drag gesture catches first). */
export function useLongPress(onLongPress: () => void, thresholdMs = 500) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const cancel = () => {
    window.clearTimeout(timerRef.current);
    startRef.current = null;
    setHolding(false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      setHolding(false);
      onLongPress();
    }, thresholdMs);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) cancel();
  };

  return {
    holding,
    cancel,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
    },
  };
}
