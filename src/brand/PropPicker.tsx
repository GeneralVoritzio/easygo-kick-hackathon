import type { PropModel } from '../engine/types'

const TYPE_ICON: Record<PropModel['type'], string> = {
  hat: '🧢',
  glasses: '🕶️',
}

export default function PropPicker({
  propModels,
  selectedId,
  onSelect,
}: {
  propModels: PropModel[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-kick-muted">
        1 · Pick your prop
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {propModels.map((m) => {
          const selected = m.id === selectedId
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border bg-kick-panel-2 px-4 py-5 text-center transition ${
                selected
                  ? 'border-kick shadow-[0_0_0_1px_var(--color-kick),0_0_20px_-4px_var(--color-kick)]'
                  : 'border-kick-border hover:border-kick-muted'
              }`}
            >
              <span className="text-3xl">{TYPE_ICON[m.type]}</span>
              <span className="text-sm font-medium text-kick-text">{m.name}</span>
              <span className="text-xs capitalize text-kick-muted">{m.type}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
