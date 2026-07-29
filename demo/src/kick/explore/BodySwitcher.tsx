import { BODIES, BODY_ORDER } from "./bodies";
import { useExplore } from "./exploreStore";
import type { BodyId } from "./types";

// The travel dock. The solar system view is the scenic route between bodies, and this is the fast
// one. It doubles as a live census, so you see where the streams are before you fly.
export function BodySwitcher({ counts }: { counts: Record<BodyId, number> }) {
  const activeBody = useExplore((s) => s.activeBody);
  const viewMode = useExplore((s) => s.viewMode);
  const setActiveBody = useExplore((s) => s.setActiveBody);
  const setViewMode = useExplore((s) => s.setViewMode);

  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-outline-decorative bg-surface-base/90 p-1 backdrop-blur-sm">
      {BODY_ORDER.map((id) => {
        const body = BODIES[id];
        const active = viewMode === "body" && activeBody === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveBody(id)}
            aria-current={active ? "true" : undefined}
            title={body.tagline}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
              active
                ? "bg-secondary-base text-white"
                : "text-surface-onSurfaceSecondary betterhover:hover:text-white"
            }`}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: body.accent, opacity: active ? 1 : 0.55 }}
            />
            {body.name}
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: active ? body.accent : undefined }}
            >
              {counts[id]}
            </span>
          </button>
        );
      })}

      <span className="mx-0.5 h-4 w-px shrink-0 bg-outline-decorative" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setViewMode(viewMode === "system" ? "body" : "system")}
        aria-pressed={viewMode === "system"}
        title="Zoom out to the solar system"
        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
          viewMode === "system"
            ? "bg-secondary-base text-white"
            : "text-surface-onSurfaceSecondary betterhover:hover:text-white"
        }`}
      >
        System
      </button>
    </div>
  );
}
