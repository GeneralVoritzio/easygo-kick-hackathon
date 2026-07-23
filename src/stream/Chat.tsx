import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../engine/types'
import { useEngine } from '../engine/store'

const KICK_GREEN = '#53fc18'
const STICK_THRESHOLD_PX = 64

function ChatRow({ message }: { message: ChatMessage }) {
  return (
    <div className="animate-slide-up rounded px-1 py-0.5 text-[13px] leading-snug break-words hover:bg-white/[0.03]">
      <span className="font-semibold" style={{ color: message.color }}>
        {message.user}
      </span>
      <span className="text-kick-muted">: </span>
      <span className="text-kick-text/90">{message.text}</span>
    </div>
  )
}

export default function Chat() {
  const chat = useEngine((s) => s.chat)
  const addChat = useEngine((s) => s.addChat)
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
    <aside className="flex h-full w-full flex-col bg-kick-panel">
      <div className="flex shrink-0 items-center justify-between border-b border-kick-border px-3 py-2.5">
        <span className="text-xs font-bold tracking-wide text-kick-text">STREAM CHAT</span>
        <span className="text-[11px] tabular-nums text-kick-muted">{chat.length} msgs</span>
      </div>

      <div ref={listRef} onScroll={handleScroll} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2">
        {chat.map((m) => (
          <ChatRow key={m.id} message={m} />
        ))}
      </div>

      <div className="shrink-0 border-t border-kick-border p-2">
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
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="rounded-md bg-kick px-2.5 py-1 text-[11px] font-bold text-black transition-colors hover:bg-kick-dim disabled:opacity-30"
          >
            Chat
          </button>
        </div>
      </div>
    </aside>
  )
}
