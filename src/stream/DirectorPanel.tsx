import { useCallback, useEffect, useState } from 'react'
import { useEngine } from '../engine/store'
import { formatOdds } from '../engine/ack'
import { useInteraction } from '../engine/interactionStore'

const ROUND_LENGTH_OPTIONS = [60, 150, 600]

const FAKE_USERS = [
  'clipthat420',
  'hypebeast_99',
  'chatoverlord',
  'ratiogod',
  'ggwp_fan',
  'stream_sniper',
  'kekw_lord',
  'pogpatrol',
  'lurkylurk',
  'viberadar',
  'nocap_chat',
  'firstdibs',
]
const FAKE_COLORS = ['#f472b6', '#60a5fa', '#facc15', '#fb923c', '#a78bfa', '#34d399', '#f87171', '#22d3ee']
const SPIKE_MSGS = [
  'LETS GOOO 🔥',
  'HYPE HYPE HYPE',
  'KEEP IT ON',
  "DON'T LET IT DIE",
  'PUMP THE TIMER 📈',
  'W SPONSOR',
  'MORE MORE MORE',
  'THIS IS CINEMA',
  'EXTEND IT CHAT',
  '🔥🔥🔥🔥🔥',
  'CROWD CARRYING RN',
  'THE HAT THE HAT',
]
const SPIKE_COUNT = 12
const SPIKE_WINDOW_MS = 2000

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function DirectorPanel() {
  const [open, setOpen] = useState(false)
  const brandProps = useEngine((s) => s.brandProps)
  const brands = useEngine((s) => s.brands)
  const propModels = useEngine((s) => s.propModels)
  const hype = useEngine((s) => s.hype)
  const activeSlot = useEngine((s) => s.activeSlot)
  const queueLen = useEngine((s) => s.queue.length)
  const fireSponsorEvent = useEngine((s) => s.fireSponsorEvent)
  const triggerHypeSurge = useEngine((s) => s.triggerHypeSurge)
  const addChat = useEngine((s) => s.addChat)
  const nudgeAnchor = useEngine((s) => s.nudgeAnchor)
  const feedMode = useEngine((s) => s.feedMode)
  const kickChannel = useEngine((s) => s.kickChannel)
  const setFeedMode = useEngine((s) => s.setFeedMode)
  const setKickChannel = useEngine((s) => s.setKickChannel)

  const stats = useInteraction((s) => s.stats)
  const phase = useInteraction((s) => s.phase)
  const pool = useInteraction((s) => s.pool)
  const filteredCount = useInteraction((s) => s.filteredCount)
  const roundLengthSec = useInteraction((s) => s.roundLengthSec)
  const transcriptEnabled = useInteraction((s) => s.transcriptEnabled)
  const transcriptSupported = useInteraction((s) => s.transcriptSupported)
  const simAcksEnabled = useInteraction((s) => s.simAcksEnabled)
  const setTranscriptEnabled = useInteraction((s) => s.setTranscriptEnabled)
  const setSimAcksEnabled = useInteraction((s) => s.setSimAcksEnabled)
  const spinNow = useInteraction((s) => s.spinNow)
  const setRoundLengthSec = useInteraction((s) => s.setRoundLengthSec)

  // tune the anchor of whatever prop is live right now
  const nudge = useCallback(
    (delta: { y?: number; z?: number; tilt?: number; scale?: number }) => {
      const slot = useEngine.getState().activeSlot
      if (slot) nudgeAnchor(slot.brandProp.propModelId, delta)
    },
    [nudgeAnchor],
  )

  const spikeChat = useCallback(() => {
    for (let i = 0; i < SPIKE_COUNT; i++) {
      setTimeout(
        () => addChat(pick(FAKE_USERS), pick(SPIKE_MSGS), pick(FAKE_COLORS)),
        Math.round((i * SPIKE_WINDOW_MS) / SPIKE_COUNT + Math.random() * 60),
      )
    }
  }, [addChat])

  const tipByIndex = useCallback(
    (idx: number) => {
      const bp = brandProps[idx]
      if (bp) fireSponsorEvent(bp.id)
    },
    [brandProps, fireSponsorEvent],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return

      switch (e.key) {
        case '`':
          e.preventDefault()
          setOpen((v) => !v)
          break
        case '1':
        case '2':
        case '3':
          tipByIndex(Number(e.key) - 1)
          break
        case 's':
        case 'S':
          triggerHypeSurge()
          break
        case 'c':
        case 'C':
          spikeChat()
          break
        case 'r':
        case 'R':
          spinNow()
          break
        // live anchor tuning for the active prop (IJKL move, U/O tilt, -/= size)
        case 'i':
          nudge({ y: 0.4 })
          break
        case 'k':
          nudge({ y: -0.4 })
          break
        case 'j':
          nudge({ z: -0.4 })
          break
        case 'l':
          nudge({ z: 0.4 })
          break
        case 'u':
          nudge({ tilt: 0.05 })
          break
        case 'o':
          nudge({ tilt: -0.05 })
          break
        case '-':
          nudge({ scale: -0.05 })
          break
        case '=':
          nudge({ scale: 0.05 })
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tipByIndex, triggerHypeSurge, spikeChat, nudge, spinNow])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open director panel ( ` )"
        className="pointer-events-auto fixed bottom-3 right-3 z-50 rounded-full border border-kick-border bg-black/40 px-3 py-2 text-sm opacity-40 transition-opacity hover:opacity-100"
      >
        🎬
      </button>
    )
  }

  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-50 w-72 rounded-xl border border-kick-border bg-kick-panel/95 p-3 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide text-kick-text">DIRECTOR PANEL</span>
        <button onClick={() => setOpen(false)} className="text-kick-muted transition-colors hover:text-kick-text">
          ✕
        </button>
      </div>

      <div className="mb-2 rounded-lg border border-kick-border bg-black/30 p-2">
        <div className="mb-1.5 text-[10px] font-bold tracking-widest text-kick-muted">FEED</div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFeedMode('kick')}
            className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
              feedMode === 'kick' ? 'bg-kick text-black' : 'bg-kick-panel-2 text-kick-muted hover:text-kick-text'
            }`}
          >
            📡 live kick
          </button>
          <button
            onClick={() => setFeedMode('webcam')}
            className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
              feedMode === 'webcam' ? 'bg-kick text-black' : 'bg-kick-panel-2 text-kick-muted hover:text-kick-text'
            }`}
          >
            🎥 webcam + props
          </button>
        </div>
        {feedMode === 'kick' && (
          <input
            value={kickChannel}
            onChange={(e) => setKickChannel(e.target.value.trim().toLowerCase())}
            placeholder="kick channel slug"
            className="mt-1.5 w-full rounded-md border border-kick-border bg-black/40 px-2 py-1 text-[11px] text-kick-text outline-none focus:border-kick"
          />
        )}
      </div>

      <div className="space-y-1.5">
        {brandProps.map((bp, i) => {
          const brand = brands.find((b) => b.id === bp.brandId)
          const model = propModels.find((m) => m.id === bp.propModelId)
          return (
            <button
              key={bp.id}
              onClick={() => fireSponsorEvent(bp.id)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-left text-[12px] text-kick-text transition-colors hover:border-kick"
            >
              <span className="truncate">
                Tip {brand?.name ?? bp.brandId} {model?.name ?? ''}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span className="font-mono text-kick">${bp.priceUsd.toLocaleString()}</span>
                <span className="text-[10px] text-kick-muted">[{i + 1}]</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <button
          onClick={spikeChat}
          className="rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] text-kick-text transition-colors hover:border-kick"
        >
          💬 Spike chat <span className="text-kick-muted">[c]</span>
        </button>
        <button
          onClick={triggerHypeSurge}
          className="rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] font-bold text-kick transition-colors hover:border-kick"
        >
          ⚡ HYPE SURGE <span className="font-normal text-kick-muted">[s]</span>
        </button>
      </div>

      <div className="mt-3 space-y-1 rounded-lg border border-kick-border bg-black/30 p-2 text-[11px] text-kick-muted">
        <div className="flex justify-between">
          <span>Hype score</span>
          <span className="font-mono text-kick-text">{hype.score.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Chat velocity</span>
          <span className="font-mono text-kick-text">{hype.chatVelocity.toFixed(1)}/s</span>
        </div>
        <div className="flex justify-between">
          <span>Slot state</span>
          <span className="font-mono text-kick-text">{activeSlot?.state ?? 'idle'}</span>
        </div>
        <div className="flex justify-between">
          <span>Queue length</span>
          <span className="font-mono text-kick-text">{queueLen}</span>
        </div>
        {activeSlot &&
          (() => {
            const m = propModels.find((pm) => pm.id === activeSlot.brandProp.propModelId)
            if (!m) return null
            return (
              <div className="flex justify-between border-t border-kick-border pt-1">
                <span>Anchor y/z/tilt/sc</span>
                <span className="font-mono text-kick-text">
                  {m.anchor.position[1]} / {m.anchor.position[2]} / {m.anchor.rotation[0]} / {m.anchor.scale}
                </span>
              </div>
            )
          })()}
      </div>

      <div className="mt-3 border-t border-kick-border pt-2">
        <div className="mb-1.5 text-[10px] font-bold tracking-widest text-kick-muted">INTERACTION</div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setTranscriptEnabled(!transcriptEnabled)}
            disabled={!transcriptSupported}
            title={transcriptSupported ? undefined : 'Web Speech API unsupported in this browser'}
            className="rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] text-kick-text transition-colors hover:border-kick disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-kick-border"
          >
            🎙 Transcript {transcriptEnabled ? 'on' : 'off'}
            {!transcriptSupported && <span className="block text-[9px] text-kick-muted">(unsupported)</span>}
          </button>
          <button
            onClick={() => setSimAcksEnabled(!simAcksEnabled)}
            className="rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] text-kick-text transition-colors hover:border-kick"
          >
            Sim reads {simAcksEnabled ? 'on' : 'off'}
          </button>
        </div>

        <button
          onClick={spinNow}
          disabled={phase !== 'collecting'}
          className="mt-1.5 w-full rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 text-[12px] font-bold text-kick transition-colors hover:border-kick disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-kick-border"
        >
          🎰 Spin now <span className="font-normal text-kick-muted">[r]</span>
        </button>

        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[10px] text-kick-muted">Round:</span>
          {ROUND_LENGTH_OPTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => setRoundLengthSec(sec)}
              className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
                roundLengthSec === sec
                  ? 'border-kick text-kick'
                  : 'border-kick-border text-kick-muted hover:border-kick-text/40 hover:text-kick-text'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        <div className="mt-2 space-y-1 rounded-lg border border-kick-border bg-black/30 p-2 text-[11px] text-kick-muted">
          <div className="flex justify-between">
            <span>Odds</span>
            <span className="font-mono text-kick-text">{formatOdds(stats)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pool size</span>
            <span className="font-mono text-kick-text">{pool.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Filtered</span>
            <span className="font-mono text-kick-text">{filteredCount}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 text-[10px] leading-relaxed text-kick-muted">
        Shortcuts: <span className="text-kick-text">1/2/3</span> tip · <span className="text-kick-text">s</span> surge
        · <span className="text-kick-text">c</span> chat spike · <span className="text-kick-text">r</span> spin ·{' '}
        <span className="text-kick-text">`</span> toggle
        <br />
        Fit live prop: <span className="text-kick-text">i/k</span> up/down · <span className="text-kick-text">j/l</span>{' '}
        back/fwd · <span className="text-kick-text">u/o</span> tilt · <span className="text-kick-text">-/=</span> size —
        final values log to console
      </div>
    </div>
  )
}
