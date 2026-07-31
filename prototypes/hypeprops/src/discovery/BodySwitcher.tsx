import { BODIES, BODY_ORDER } from './bodies'
import { useDiscovery } from './discoveryStore'
import type { BodyId } from './types'

/**
 * Always-present travel dock. The solar-system view is the scenic route between
 * bodies; this is the fast one, and it doubles as a live census — you can see
 * where the streams are before you fly anywhere.
 */
export default function BodySwitcher({ counts }: { counts: Record<BodyId, number> }) {
  const activeBody = useDiscovery((s) => s.activeBody)
  const viewMode = useDiscovery((s) => s.viewMode)
  const setActiveBody = useDiscovery((s) => s.setActiveBody)
  const setViewMode = useDiscovery((s) => s.setViewMode)

  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-kick-border bg-kick-panel/90 p-1 backdrop-blur-sm">
      {BODY_ORDER.map((id) => {
        const body = BODIES[id]
        const active = viewMode === 'body' && activeBody === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveBody(id)}
            aria-current={active ? 'true' : undefined}
            title={body.tagline}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors ${
              active ? 'bg-white/10 text-kick-text' : 'text-kick-muted hover:text-kick-text'
            }`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: body.accent, opacity: active ? 1 : 0.55 }}
            />
            {body.name}
            <span className="tabular-nums text-[11px] font-bold" style={{ color: active ? body.accent : undefined }}>
              {counts[id]}
            </span>
          </button>
        )
      })}

      <span className="mx-0.5 h-4 w-px shrink-0 bg-kick-border" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setViewMode(viewMode === 'system' ? 'body' : 'system')}
        aria-pressed={viewMode === 'system'}
        title="Zoom out to the solar system"
        className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors ${
          viewMode === 'system' ? 'bg-white/10 text-kick-text' : 'text-kick-muted hover:text-kick-text'
        }`}
      >
        System
      </button>
    </div>
  )
}
