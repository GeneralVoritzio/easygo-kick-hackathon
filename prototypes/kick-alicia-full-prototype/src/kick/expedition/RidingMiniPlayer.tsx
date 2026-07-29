import { useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { ThumbBadge } from "../components/CardBits";
import { useExpeditions } from "./ExpeditionContext";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const EDGE_MARGIN = 20;
// Below this much pointer movement, a mousedown-then-mouseup still counts as a click (returns to
// the ride) rather than a drag — otherwise the tiniest hand tremor while clicking would relocate
// the whole widget instead.
const DRAG_THRESHOLD_PX = 6;

function cornerStyle(corner: Corner): CSSProperties {
  const style: CSSProperties = {};
  if (corner.startsWith("top")) style.top = EDGE_MARGIN;
  else style.bottom = EDGE_MARGIN;
  if (corner.endsWith("left")) style.left = EDGE_MARGIN;
  else style.right = EDGE_MARGIN;
  return style;
}

/*
  Riding an expedition or a Kick Break doesn't end just because you navigate off its page — this
  floating corner player follows you anywhere else in the app, the same "keep watching while you
  browse" a real picture-in-picture player gives you. Clicking it returns to the ride. Its own
  close button only hides this floating widget, it doesn't end the ride — you're still riding, the
  widget just stops following you until the next ride starts.

  Draggable like a real PIP window: grab it anywhere and it follows the pointer, let go and it
  snaps to whichever of the four screen corners its centre ended up closest to — it never rests
  mid-screen, blocking whatever's underneath.
*/
export function RidingMiniPlayer() {
  const { expeditions, riderExpeditionId } = useExpeditions();
  const location = useLocation();
  const navigate = useNavigate();
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [livePos, setLivePos] = useState<{ left: number; top: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const prevRiderIdRef = useRef(riderExpeditionId);

  if (prevRiderIdRef.current !== riderExpeditionId) {
    prevRiderIdRef.current = riderExpeditionId;
    if (dismissed) setDismissed(false);
  }

  const expedition = riderExpeditionId ? expeditions.find((e) => e.id === riderExpeditionId) : undefined;

  function startDrag(e: ReactMouseEvent) {
    if (e.button !== 0) return;
    const el = elRef.current;
    if (!el) return;
    e.preventDefault();
    // Reset ahead of this gesture, not after it — the click that follows a real drag's mouseup
    // needs to see it still true, so it can only be cleared here, on the next mousedown.
    draggedRef.current = false;

    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;
    let lastLeft = rect.left;
    let lastTop = rect.top;

    function onMove(ev: globalThis.MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)) moved = true;
      if (!moved) return;
      lastLeft = Math.min(Math.max(0, rect.left + dx), window.innerWidth - rect.width);
      lastTop = Math.min(Math.max(0, rect.top + dy), window.innerHeight - rect.height);
      setLivePos({ left: lastLeft, top: lastTop });
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      draggedRef.current = moved;
      if (!moved) {
        setLivePos(null);
        return;
      }
      const centerX = lastLeft + rect.width / 2;
      const centerY = lastTop + rect.height / 2;
      const vertical = centerY < window.innerHeight / 2 ? "top" : "bottom";
      const horizontal = centerX < window.innerWidth / 2 ? "left" : "right";
      setCorner(`${vertical}-${horizontal}` as Corner);
      setLivePos(null);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  if (!expedition) return null;
  if (dismissed) return null;
  if (location.pathname === `/expedition/${expedition.id}`) return null;

  const current = expedition.stops[expedition.stopIndex] ?? expedition.stops[0];
  if (!current) return null;
  const isKickBreak = expedition.kind === "kick-break";

  return (
    <div
      ref={elRef}
      onMouseDown={startDrag}
      style={livePos ? { left: livePos.left, top: livePos.top } : cornerStyle(corner)}
      className="fixed z-[600] w-[280px] cursor-grab overflow-hidden rounded-xl border border-outline-decorative bg-black shadow-[0_12px_40px_rgba(0,0,0,0.55)] active:cursor-grabbing"
    >
      <div className="relative aspect-video w-full">
        <button
          type="button"
          onClick={() => {
            if (draggedRef.current) return;
            navigate(`/expedition/${expedition.id}`);
          }}
          aria-label={`Return to ${expedition.name}`}
          className="absolute inset-0 block h-full w-full"
        >
          <img src={current.thumbnail} alt="" draggable={false} className="h-full w-full object-cover" />
        </button>

        <ThumbBadge corner="top-left" className="pointer-events-none uppercase text-primary-base">
          Live
        </ThumbBadge>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          aria-label="Close mini player"
          className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
        >
          <Icon name="close" className="size-3.5" />
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
          <Icon name="expedition" className="size-3 shrink-0 text-primary-base" />
          <p className="truncate text-xs font-bold text-white">
            {current.channel.username}
            <span className="font-normal text-white/70"> · {isKickBreak ? "Kick Break" : "Expedition"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
