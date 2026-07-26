import { useRef } from 'react';

const PINCH_RATIO_THRESHOLD = 1.3;

function touchDistance(touches: React.TouchList): number {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/** Two-finger pinch: fingers closing together fires `onPinchIn` (used to
 *  fill the screen with the pinned mosaic), fingers spreading apart fires
 *  `onPinchOut` (back to discovery). Each gesture fires at most once, no
 *  matter how far it continues past the threshold. */
export function usePinchGesture(onPinchIn: () => void, onPinchOut: () => void) {
  const startDistRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      startDistRef.current = touchDistance(e.touches);
      firedRef.current = false;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || startDistRef.current === null || firedRef.current) return;
    const ratio = touchDistance(e.touches) / startDistRef.current;
    if (ratio < 1 / PINCH_RATIO_THRESHOLD) {
      firedRef.current = true;
      onPinchIn();
    } else if (ratio > PINCH_RATIO_THRESHOLD) {
      firedRef.current = true;
      onPinchOut();
    }
  };

  const reset = () => {
    startDistRef.current = null;
  };

  return { onTouchStart, onTouchMove, onTouchEnd: reset, onTouchCancel: reset };
}
