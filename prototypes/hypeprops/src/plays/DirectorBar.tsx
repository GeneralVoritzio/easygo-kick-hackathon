import { useEffect, useState } from 'react'
import ChooseOutcomeModal from './ChooseOutcomeModal'
import ManagePlayModal from './ManagePlayModal'
import { usePlays } from './playsStore'
import type { PlayMode, Verdict } from './settle'

/** demo order from the spec: bet, quiz, draw, poll — keys 1-4 open these in order */
const ORDER: PlayMode[] = ['bet', 'quiz', 'draw', 'poll']
const VERDICTS: Verdict[] = ['PASS', 'FAIL', 'ABSTAIN']

/**
 * A small, collapsed-by-default dev control for driving the demo (open a mode, close the
 * window, force a verdict) — not a visible part of the product surface. The Manage Play
 * and Choose outcome triggers here are a shortcut into the same modals the Streamer view
 * of /plays opens, so a demo can be driven without switching view modes.
 */
export default function DirectorBar() {
  const [open, setOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [chooseOutcomeOpen, setChooseOutcomeOpen] = useState(false)
  const play = usePlays((s) => s.play)
  const openPlay = usePlays((s) => s.openPlay)
  const closeWindow = usePlays((s) => s.closeWindow)
  const reset = usePlays((s) => s.reset)
  const runVerify = usePlays((s) => s.runVerify)
  const oracleOutcome = usePlays((s) => s.oracleOutcome)
  const setOracleOutcome = usePlays((s) => s.setOracleOutcome)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return

      switch (e.key) {
        case 'p':
        case 'P':
          setOpen((v) => !v)
          break
        case '1':
        case '2':
        case '3':
        case '4':
          openPlay(ORDER[Number(e.key) - 1])
          break
        case 'x':
        case 'X':
          closeWindow()
          break
        case 'v':
        case 'V':
          runVerify()
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openPlay, closeWindow, runVerify])

  const canChooseOutcome = play?.mode === 'bet' && play.phase !== 'collecting'

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Open director bar ( p )"
          className="pointer-events-auto fixed bottom-3 right-3 z-50 rounded-full border border-kick-border bg-black/40 px-3 py-2 text-sm opacity-40 transition-opacity hover:opacity-100"
        >
          🎬
        </button>
      ) : (
        <div className="pointer-events-auto fixed bottom-3 right-3 z-50 w-72 rounded-xl border border-kick-border bg-kick-panel/95 p-3 shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-kick-text">DIRECTOR — KICK PLAYS</span>
            <button type="button" onClick={() => setOpen(false)} className="text-kick-muted transition-colors hover:text-kick-text">
              ✕
            </button>
          </div>

          <div className="mb-2 text-[10px] text-kick-muted">demo order: 1 bet → 2 quiz → 3 draw → 4 poll</div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => openPlay('bet')}
              className="w-full rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-left text-[12px] text-kick-text transition-colors hover:border-kick"
            >
              Open pooled bet / PVP-style bet <span className="text-kick-muted">[1]</span>
            </button>
            <button
              type="button"
              onClick={() => openPlay('quiz')}
              className="w-full rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-left text-[12px] text-kick-text transition-colors hover:border-kick"
            >
              Open quiz <span className="text-kick-muted">[2]</span>
            </button>
            <button
              type="button"
              onClick={() => openPlay('draw')}
              className="w-full rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-left text-[12px] text-kick-text transition-colors hover:border-kick"
            >
              Open draw <span className="text-kick-muted">[3]</span>
            </button>
            <button
              type="button"
              onClick={() => openPlay('poll')}
              className="w-full rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-left text-[12px] text-kick-text transition-colors hover:border-kick"
            >
              Open poll <span className="text-kick-muted">[4]</span>
            </button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={closeWindow}
              className="rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] text-kick-text transition-colors hover:border-kick"
            >
              Close window now <span className="text-kick-muted">[x]</span>
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] text-kick-text transition-colors hover:border-kick"
            >
              Reset
            </button>
          </div>

          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={!play}
              onClick={() => setManageOpen(true)}
              className="rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] text-kick-text transition-colors hover:border-kick disabled:cursor-not-allowed disabled:opacity-30"
            >
              Manage Play
            </button>
            <button
              type="button"
              disabled={!canChooseOutcome}
              onClick={() => setChooseOutcomeOpen(true)}
              className="rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] text-kick-text transition-colors hover:border-kick disabled:cursor-not-allowed disabled:opacity-30"
            >
              Choose outcome
            </button>
          </div>

          <div className="mt-3 border-t border-kick-border pt-2">
            <div className="mb-1.5 text-[10px] font-bold tracking-widest text-kick-muted">SCRIPTED ORACLE VERDICT</div>
            <div className="flex gap-1.5">
              {VERDICTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setOracleOutcome(v)}
                  className={`flex-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                    oracleOutcome === v ? 'border-kick text-kick' : 'border-kick-border text-kick-muted hover:text-kick-text'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={runVerify}
            className="mt-2 w-full rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] font-bold text-kick transition-colors hover:border-kick"
          >
            ▶ Run verify <span className="font-normal text-kick-muted">[v]</span>
          </button>

          <div className="mt-2 text-[10px] leading-relaxed text-kick-muted">
            Shortcuts: <span className="text-kick-text">1-4</span> open · <span className="text-kick-text">x</span> close ·{' '}
            <span className="text-kick-text">v</span> verify · <span className="text-kick-text">p</span> toggle
          </div>
        </div>
      )}

      {manageOpen && <ManagePlayModal onClose={() => setManageOpen(false)} />}
      {chooseOutcomeOpen && <ChooseOutcomeModal onClose={() => setChooseOutcomeOpen(false)} />}
    </>
  )
}
