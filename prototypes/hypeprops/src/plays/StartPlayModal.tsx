import { useEffect, useRef, useState } from 'react'
import type { PlayMode } from './settle'
import { usePlays } from './playsStore'

type PastPlay = {
  id: string
  label: string
  mode: PlayMode
  title: string
  options?: [string, string]
  prize?: string
}

const PAST_PLAYS: PastPlay[] = [
  { id: 'pp1', label: 'What happens next hour? (Poll)', mode: 'poll', title: 'What happens next hour?', options: ['Slots', 'IRL walk'] },
  { id: 'pp2', label: 'Hoodie off before close? (Bet)', mode: 'bet', title: 'IronVow takes the hoodie off before the window closes', options: ['Yes', 'No'] },
  { id: 'pp3', label: 'Friday hoodie giveaway (Draw)', mode: 'draw', title: 'Friday hoodie giveaway', prize: 'Signed hoodie' },
]

const MODES: { id: PlayMode; label: string }[] = [
  { id: 'poll', label: 'Poll' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'draw', label: 'Draw' },
  { id: 'bet', label: 'Bet' },
]

const DURATIONS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
]

const filledSelectClass =
  'w-full appearance-none rounded-[6px] bg-[#2a2e33] px-3 py-2.5 text-sm text-white outline-none [background-image:url(\'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20d%3D%22M1%201l4%204%204-4%22%20stroke%3D%22%23a3a3a3%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E\')] bg-[right_12px_center] bg-no-repeat pr-8'

const borderedInputClass =
  'w-full rounded border border-neutral-700 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-kick-muted focus:border-kick'

export default function StartPlayModal({ onClose }: { onClose: () => void }) {
  const openPlay = usePlays((s) => s.openPlay)

  const [mode, setMode] = useState<PlayMode>('poll')
  const [title, setTitle] = useState('')
  const [option1, setOption1] = useState('')
  const [option2, setOption2] = useState('')
  const [prize, setPrize] = useState('')
  const [duration, setDuration] = useState(60)
  const [pastPlayId, setPastPlayId] = useState('')

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function applyPastPlay(id: string) {
    setPastPlayId(id)
    const past = PAST_PLAYS.find((p) => p.id === id)
    if (!past) return
    setMode(past.mode)
    setTitle(past.title)
    setOption1(past.options?.[0] ?? '')
    setOption2(past.options?.[1] ?? '')
    setPrize(past.prize ?? '')
  }

  const needsOptions = mode === 'poll' || mode === 'bet'
  const needsPrize = mode === 'draw'
  const canSubmit =
    title.trim().length > 0 &&
    (!needsOptions || (option1.trim().length > 0 && option2.trim().length > 0)) &&
    (!needsPrize || prize.trim().length > 0)

  function submit() {
    if (!canSubmit) return
    openPlay(mode)
    onClose()
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-play-title"
        className="w-full max-w-[560px] rounded-lg bg-[#16181b] p-8 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="start-play-title" className="text-[28px] font-bold leading-tight text-white">
            Start a Play
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="mt-1 shrink-0 text-xl leading-none text-kick-muted transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-kick-muted">
          Streamers and mods create Plays. Viewers stake earned channel points to enter. Every Play
          must follow the{' '}
          <a href="#" className="font-bold text-white underline">
            Terms of Service
          </a>
          .
        </p>

        <div className="mb-5">
          <label htmlFor="start-play-past" className="mb-1.5 block text-sm font-bold text-white">
            Past Plays
          </label>
          <select
            id="start-play-past"
            value={pastPlayId}
            onChange={(e) => applyPastPlay(e.target.value)}
            className={filledSelectClass}
          >
            <option value="" disabled>
              Select a past Play to get a quick start!
            </option>
            {PAST_PLAYS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 h-px w-full bg-kick-border" />

        <div className="mb-5">
          <div className="mb-2 text-sm font-bold text-white">Mode *</div>
          <div className="grid grid-cols-4 gap-2">
            {MODES.map((m) => {
              const selected = m.id === mode
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`rounded border px-2 py-2 text-sm font-semibold transition-colors ${
                    selected
                      ? 'border-kick text-kick ring-1 ring-kick'
                      : 'border-neutral-700 text-kick-muted hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="start-play-title-input" className="mb-1.5 block text-sm font-bold text-white">
            Play Title *
          </label>
          <input
            ref={titleRef}
            id="start-play-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your question"
            className={borderedInputClass}
          />
        </div>

        {needsOptions && (
          <div className="mb-5">
            <div className="mb-1.5 text-sm font-bold text-white">Options *</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-kick text-xs font-bold text-black">
                  1
                </span>
                <input
                  value={option1}
                  onChange={(e) => setOption1(e.target.value)}
                  placeholder="Option 1"
                  className={borderedInputClass}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f87171] text-xs font-bold text-black">
                  2
                </span>
                <input
                  value={option2}
                  onChange={(e) => setOption2(e.target.value)}
                  placeholder="Option 2"
                  className={borderedInputClass}
                />
              </div>
            </div>
          </div>
        )}

        {needsPrize && (
          <div className="mb-5">
            <label htmlFor="start-play-prize" className="mb-1.5 block text-sm font-bold text-white">
              Prize *
            </label>
            <input
              id="start-play-prize"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder="What does the winner get?"
              className={borderedInputClass}
            />
          </div>
        )}

        {mode === 'quiz' && (
          <div className="mb-5 rounded border border-neutral-700 px-3 py-2.5 text-sm text-kick-muted">
            The 4 questions come from the committed answer key — nothing to fill in here.
          </div>
        )}

        <div className="mb-1.5">
          <label htmlFor="start-play-duration" className="mb-1.5 block text-sm font-bold text-white">
            Play lasts for *
          </label>
          <select
            id="start-play-duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={filledSelectClass}
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mb-6 text-xs text-kick-muted">Time limit viewers have to enter.</p>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-kick-muted transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="rounded-full bg-kick px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-kick-dim disabled:cursor-not-allowed disabled:opacity-30"
          >
            Start Play
          </button>
        </div>
      </div>
    </div>
  )
}
