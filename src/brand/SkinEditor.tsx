import type { Finish } from '../engine/types'

export type LogoMode = 'brand' | 'custom' | 'none'

const SWATCHES = [
  '#53fc18', // kick green
  '#ef4444', // red
  '#f97316', // orange
  '#facc15', // yellow
  '#22d3ee', // cyan
  '#3b82f6', // blue
  '#a78bfa', // purple
  '#f472b6', // pink
]

const FINISHES: { id: Finish; label: string }[] = [
  { id: 'matte', label: 'Matte' },
  { id: 'gloss', label: 'Gloss' },
  { id: 'metallic', label: 'Metallic' },
]

function FinishDot({ finish }: { finish: Finish }) {
  if (finish === 'matte') {
    return <span className="inline-block h-3 w-3 rounded-full bg-kick-muted" />
  }
  if (finish === 'gloss') {
    return (
      <span
        className="inline-block h-3 w-3 rounded-full bg-kick-text"
        style={{ background: 'radial-gradient(circle at 35% 30%, #ffffff, #6b7280 70%)' }}
      />
    )
  }
  return (
    <span
      className="inline-block h-3 w-3 rounded-full"
      style={{
        background: 'conic-gradient(from 180deg, #f4f4f5, #71717a, #f4f4f5, #52525b, #f4f4f5)',
      }}
    />
  )
}

export default function SkinEditor({
  baseColor,
  onBaseColorChange,
  finish,
  onFinishChange,
  logoMode,
  onLogoModeChange,
  customText,
  onCustomTextChange,
  brandLogoUrl,
}: {
  baseColor: string
  onBaseColorChange: (color: string) => void
  finish: Finish
  onFinishChange: (finish: Finish) => void
  logoMode: LogoMode
  onLogoModeChange: (mode: LogoMode) => void
  customText: string
  onCustomTextChange: (text: string) => void
  brandLogoUrl: string
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-kick-muted">
        2 · Skin it
      </h2>

      <div className="space-y-5 rounded-xl border border-kick-border bg-kick-panel-2 p-4">
        {/* base color */}
        <div>
          <div className="mb-2 text-xs font-medium text-kick-muted">Base color</div>
          <div className="flex flex-wrap items-center gap-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => onBaseColorChange(c)}
                className={`h-7 w-7 rounded-full border transition ${
                  baseColor.toLowerCase() === c.toLowerCase()
                    ? 'border-kick-text ring-2 ring-kick ring-offset-2 ring-offset-kick-panel-2'
                    : 'border-kick-border hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label
              className={`relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border text-[10px] transition ${
                SWATCHES.some((c) => c.toLowerCase() === baseColor.toLowerCase())
                  ? 'border-kick-border hover:scale-110'
                  : 'border-kick-text ring-2 ring-kick ring-offset-2 ring-offset-kick-panel-2'
              }`}
              style={{
                background:
                  'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
              }}
              title="Custom color"
            >
              <input
                type="color"
                value={baseColor}
                onChange={(e) => onBaseColorChange(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>

        {/* logo */}
        <div>
          <div className="mb-2 text-xs font-medium text-kick-muted">Logo</div>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-kick-border bg-kick-dark p-1 text-xs">
            {(
              [
                { id: 'brand', label: 'Brand logo' },
                { id: 'custom', label: 'Custom text' },
                { id: 'none', label: 'None' },
              ] as { id: LogoMode; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onLogoModeChange(opt.id)}
                className={`rounded-md px-2 py-1.5 font-medium transition ${
                  logoMode === opt.id
                    ? 'bg-kick text-kick-dark'
                    : 'text-kick-muted hover:text-kick-text'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {logoMode === 'brand' && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-kick-border bg-kick-dark px-3 py-2">
              <img src={brandLogoUrl} alt="Brand logo" className="h-8 w-8 rounded object-cover" />
              <span className="text-xs text-kick-muted">Your verified brand logo</span>
            </div>
          )}

          {logoMode === 'custom' && (
            <input
              type="text"
              value={customText}
              maxLength={6}
              placeholder="UP TO 6"
              onChange={(e) => onCustomTextChange(e.target.value.toUpperCase())}
              className="mt-2 w-full rounded-lg border border-kick-border bg-kick-dark px-3 py-2 text-sm uppercase tracking-wider text-kick-text outline-none focus:border-kick"
            />
          )}
        </div>

        {/* finish */}
        <div>
          <div className="mb-2 text-xs font-medium text-kick-muted">Finish</div>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-kick-border bg-kick-dark p-1">
            {FINISHES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFinishChange(f.id)}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                  finish === f.id ? 'bg-kick text-kick-dark' : 'text-kick-muted hover:text-kick-text'
                }`}
              >
                <FinishDot finish={f.id} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
