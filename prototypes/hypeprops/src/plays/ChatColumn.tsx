import { useEffect, useRef } from 'react'
import { usePlays } from './playsStore'

const STICK_THRESHOLD_PX = 64
const TAPE_LINES = 6

export default function ChatColumn() {
  const chat = usePlays((s) => s.chat)
  const refLines = usePlays((s) => s.refLines)
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

  const tape = refLines.slice(-TAPE_LINES)

  return (
    <aside className="flex h-full w-full flex-col bg-kick-dark">
      <div className="shrink-0 px-3 py-2.5 text-center text-[14px] font-semibold text-kick-text">Chat</div>

      <div ref={listRef} onScroll={handleScroll} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2">
        {chat.map((m) => (
          <div
            key={m.id}
            className={`animate-slide-up rounded px-1 py-0.5 text-[13px] leading-snug break-words ${
              m.ref ? 'border-l-2 border-kick bg-black/30 pl-1.5' : ''
            }`}
          >
            {m.ref ? (
              <span className="font-semibold text-kick">
                <span className="mr-0.5">✅</span>RefBot
              </span>
            ) : (
              <span className="font-semibold" style={{ color: m.color }}>
                {m.user}
              </span>
            )}
            <span className="text-kick-muted">: </span>
            <span className="text-kick-text/90">{m.text}</span>
          </div>
        ))}
        {chat.length === 0 && <div className="text-[12px] text-kick-muted">chat is quiet — open a round</div>}
      </div>

      <div className="shrink-0 border-t border-kick-border px-2.5 py-2">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-kick-muted">
          Ref tape (also in the VOD)
        </div>
        <div className="space-y-0.5 font-mono text-[10px] text-kick-muted">
          {tape.length === 0 ? (
            <div>—</div>
          ) : (
            tape.map((l) => (
              <div key={l.id} className="truncate">
                [{l.kind}] {l.text}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
