import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../kickshell/Icon'
import PredictionCard from './PredictionCard'
import { usePlays, type ChatLine } from './playsStore'

const YOU = { user: 'bucket_hat_bailey', color: '#53fc18' }

/**
 * The engine's own chat feed logs a REF-COMMIT line on open and REF-REVEAL/REF-VERDICT
 * lines on close, each carrying a hash for the VOD's own audit trail. None of that reads
 * like a real KICK chat message, so this view keeps only one tasteful bot line per event
 * (open, resolve) and drops the raw hashes. The engine still logs everything internally.
 */
function toVisibleLine(m: ChatLine): ChatLine | null {
  if (m.ref === 'REF-REVEAL') return null
  if (m.ref === 'REF-COMMIT') return { ...m, text: 'A new Play just went live — get your picks in!' }
  if (m.ref === 'REF-VERDICT') {
    // the engine's verdict carries its settlement reasoning ("PASS — single run
    // may PASS", "IRL walk (approval) · first-choice led by Slots"). Chat only
    // needs the outcome, so keep the head and drop the internal rationale.
    const match = /^\[REF-VERDICT\]\s+\S+\s+(.*)$/.exec(m.text)
    const outcome = match?.[1].split(/\s+—\s+|\s+·\s+/)[0].trim()
    return { ...m, text: outcome ? `Play resolved — ${outcome}` : 'Play resolved.' }
  }
  return m
}

/**
 * Styled to match kickshell/components/ChannelChat.tsx (the header bar, the message
 * row shape, the bold-name-then-body line), but fed by the KICK PLAYS engine's own
 * chat feed instead of ChannelChat's random mock chatter. A live Play is pinned above
 * the feed as its own card (see PredictionCard), the way KICK surfaces Predictions.
 * The composer is local to this view: the engine has no generic "send a message"
 * action, so a typed message is appended here as the signed-in viewer, bucket_hat_bailey,
 * the same identity the engine already uses for votes, quiz answers and draw entries.
 */
export default function PlaysChatPanel({ onCollapse }: { onCollapse?: () => void }) {
  const chat = usePlays((s) => s.chat)
  const [localMessages, setLocalMessages] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const visible = [...chat.map(toVisibleLine).filter((m): m is ChatLine => m !== null), ...localMessages].sort(
    (a, b) => a.ts - b.ts,
  )

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat, localMessages])

  function sendDraft(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setLocalMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), user: YOU.user, color: YOU.color, text, ts: Date.now() },
    ])
    setDraft('')
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-lowest">
      <div className="relative flex min-h-[38px] shrink-0 items-center justify-between border-b-2 border-[#24272c] px-3 py-1.5">
        <button
          type="button"
          aria-label="Collapse chat"
          onClick={onCollapse}
          className="state-layer-surface flex size-9 shrink-0 items-center justify-center rounded text-white"
        >
          <Icon name="collapse-chat" className="size-4" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold lg:text-base">Chat</span>
        <button
          type="button"
          aria-label="Viewer list"
          className="state-layer-surface flex size-9 shrink-0 items-center justify-center rounded text-white"
        >
          <Icon name="chatters" className="size-4" />
        </button>
      </div>

      <PredictionCard />

      <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 && (
          <p className="px-4 py-6 text-sm leading-5 text-surface-onSurfaceSecondary">
            Chat is quiet. Open a Play from the director panel to get things going.
          </p>
        )}
        {visible.map((m) => (
          <div key={m.id} className="group relative px-2 lg:px-3">
            <div className="w-full min-w-0 shrink-0 break-words rounded-lg px-2 py-[3px] text-[14px] leading-[1.5] betterhover:group-hover:bg-surface-highest">
              {m.ref ? (
                <span className="inline-flex items-center gap-1 font-bold text-primary-base">
                  <span aria-hidden>✅</span>
                  RefBot
                </span>
              ) : (
                <span className="font-bold" style={{ color: m.color }}>
                  {m.user}
                </span>
              )}
              <span className="font-bold">{': '}</span>
              <span className="font-normal text-white/90">{m.text}</span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendDraft} className="shrink-0 border-t-2 border-[#24272c] px-2 py-3 lg:px-5">
        <div className="flex h-[42px] w-full items-center gap-2 rounded border-2 border-neutral-700 px-2.5 focus-within:border-kick">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Send a message"
            className="h-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-kick-muted"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="rounded bg-kick px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-kick-dim disabled:cursor-not-allowed disabled:opacity-30"
          >
            Chat
          </button>
        </div>
      </form>
    </div>
  )
}
