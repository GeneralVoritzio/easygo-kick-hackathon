import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessage } from '../engine/types'
import { useEngine } from '../engine/store'
import { useInteraction } from '../engine/interactionStore'
import { GearIcon, HeartIcon, PanelCollapseIcon, UsersIcon } from './icons'
import RouletteOverlay from './RouletteOverlay'

const KICK_GREEN = '#53fc18'
const STICK_THRESHOLD_PX = 64

/** cosmetic top-tippers strip — static, fake names drawn from our chat cast */
const LEADERBOARD = [
  { rank: 1, user: 'pogchampion', amount: 500, badge: '#facc15' },
  { rank: 2, user: 'clipfarm3r', amount: 200, badge: '#d4d4d8' },
]

function ChatRow({
  message,
  acked,
  onAck,
}: {
  message: ChatMessage
  acked: boolean
  onAck: (id: string) => void
}) {
  // "/interact <dare>" — render the command token in kick-green italics
  const interact = message.text.match(/^(\/interact\s+)(.*)$/i)
  // KICKBot narrator — the interaction engine's own voice in chat
  const isBot = message.user === 'KICKBot'
  // roulette outcome lines get an emphasized row treatment
  const isSpinRow = message.text.startsWith('🎰')

  return (
    <div
      className={`group/row animate-slide-up flex items-start gap-1 rounded px-1 py-0.5 text-[13px] leading-snug break-words hover:bg-white/[0.03] ${
        isSpinRow ? 'border-l-2 border-kick bg-black/30 pl-1.5' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        {isBot ? (
          <span className="font-semibold text-kick">
            <span className="mr-0.5">✅</span>
            {message.user}
          </span>
        ) : (
          <span className="font-semibold" style={{ color: message.color }}>
            {message.user}
          </span>
        )}
        <span className="text-kick-muted">: </span>
        {interact ? (
          <>
            <span className="italic text-kick">{interact[1]}</span>
            <span className="text-kick-text/90">{interact[2]}</span>
          </>
        ) : (
          <span className="text-kick-text/90">{message.text}</span>
        )}
        {acked && (
          <span className="ml-1 text-kick" title="acknowledged">
            ✓
          </span>
        )}
      </div>

      {/* deterministic ack fallback for when the mic isn't on */}
      {!acked && (
        <button
          type="button"
          onClick={() => onAck(message.id)}
          className="pointer-events-auto shrink-0 rounded bg-kick-panel-2 px-1.5 py-0.5 text-[10px] font-semibold text-kick opacity-0 transition-opacity hover:bg-white/10 group-hover/row:opacity-100"
        >
          ✓ ack
        </button>
      )}
    </div>
  )
}

export default function Chat() {
  const chat = useEngine((s) => s.chat)
  const addChat = useEngine((s) => s.addChat)
  const ackedIds = useInteraction((s) => s.ackedIds)
  const ackMessage = useInteraction((s) => s.ackMessage)
  const ackedSet = useMemo(() => new Set(ackedIds), [ackedIds])
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    const el = listRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [chat])

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom < STICK_THRESHOLD_PX
  }

  const handleSend = () => {
    const text = draft.trim()
    if (!text) return
    addChat('HypeKing', text, KICK_GREEN)
    setDraft('')
    stickToBottomRef.current = true
  }

  return (
    <aside className="flex h-full w-full flex-col bg-kick-dark">
      <div className="grid shrink-0 grid-cols-3 items-center px-3 py-2.5">
        <button
          type="button"
          aria-label="Collapse chat"
          className="justify-self-start text-kick-muted transition-colors hover:text-kick-text"
        >
          <PanelCollapseIcon className="h-[18px] w-[18px]" />
        </button>
        <span className="justify-self-center text-[14px] font-semibold text-kick-text">Chat</span>
        <button
          type="button"
          aria-label="Viewers"
          className="justify-self-end text-kick-muted transition-colors hover:text-kick-text"
        >
          <UsersIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 px-2.5 pb-2">
        {LEADERBOARD.map((row) => (
          <div key={row.rank} className="flex items-center gap-1 rounded-full bg-kick-panel-2 py-1 pl-1 pr-2.5 text-[11px]">
            <span
              className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-black text-black"
              style={{ backgroundColor: row.badge }}
            >
              {row.rank}
            </span>
            <span className="font-semibold text-kick-text">{row.user}</span>
            <span className="font-bold text-kick">{row.amount}</span>
          </div>
        ))}
      </div>

      {/* interaction roulette card — pinned above the messages, does not scroll with them */}
      <div className="shrink-0 px-2.5 pb-2">
        <RouletteOverlay />
      </div>

      <div ref={listRef} onScroll={handleScroll} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2">
        {chat.map((m) => (
          <ChatRow
            key={m.id}
            message={m}
            acked={ackedSet.has(m.id)}
            onAck={(id) => ackMessage(id, 'explicit')}
          />
        ))}
      </div>

      <div className="shrink-0 space-y-2 p-2">
        <div className="flex items-center gap-1 px-0.5 text-[11px] text-kick-muted">
          <HeartIcon className="h-3 w-3" />
          Followers only
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-kick-border bg-kick-panel-2 px-2.5 py-1.5 transition-colors focus-within:border-kick">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
            placeholder="Send a message"
            className="flex-1 bg-transparent text-[13px] text-kick-text placeholder:text-kick-muted focus:outline-none"
          />
          <button type="button" aria-label="Emoji" className="shrink-0 text-[15px] leading-none">
            😊
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button type="button" aria-label="Chat settings" className="text-kick-muted transition-colors hover:text-kick-text">
            <GearIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="rounded-md bg-kick px-3 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-kick-dim disabled:opacity-30"
          >
            Chat
          </button>
        </div>
      </div>
    </aside>
  )
}
