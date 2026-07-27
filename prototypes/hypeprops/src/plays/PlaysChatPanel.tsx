import { useEffect, useRef } from 'react'
import { Icon } from '../kickshell/Icon'
import { usePlays } from './playsStore'

/**
 * Styled to match kickshell/components/ChannelChat.tsx (the header bar, the message
 * row shape, the bold-name-then-body line), but fed by the KICK PLAYS engine's own
 * chat feed instead of ChannelChat's random mock chatter. [REF-*] lines come through
 * with `ref` set and render as RefBot in kick green with a checkmark, matching the
 * plain KickPlaysPage chat column's convention.
 */
export default function PlaysChatPanel({ onCollapse }: { onCollapse?: () => void }) {
  const chat = usePlays((s) => s.chat)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat])

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

      <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto">
        {chat.length === 0 && (
          <p className="px-4 py-6 text-sm leading-5 text-surface-onSurfaceSecondary">
            Chat is quiet. Open a Play from the director panel to get things going.
          </p>
        )}
        {chat.map((m) => (
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

      <div className="shrink-0 border-t-2 border-[#24272c] px-2 py-3 lg:px-5">
        <div className="flex h-[42px] w-full items-center rounded border-2 border-neutral-700 px-2.5 text-sm text-surface-onSurfaceSecondary">
          Chat here is driven by the KICK PLAYS engine
        </div>
      </div>
    </div>
  )
}
