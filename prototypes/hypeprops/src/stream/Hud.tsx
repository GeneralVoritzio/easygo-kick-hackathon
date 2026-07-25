import { useEffect, useRef, useState } from 'react'
import { useEngine } from '../engine/store'
import { expiresAt, timeLeftSec } from '../engine/slotMachine'

/** flash threshold: a jump bigger than this reads as a deliberate boost, not float noise */
const FLOATER_JUMP_SEC = 2
const FLOATER_VISIBLE_MS = 1000

function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export default function Hud() {
  const activeSlot = useEngine((s) => s.activeSlot)
  const queueLen = useEngine((s) => s.queue.length)
  const brands = useEngine((s) => s.brands)
  const propModels = useEngine((s) => s.propModels)

  const slotKey = activeSlot ? `${activeSlot.brandProp.id}-${activeSlot.startedAt}` : null

  const extensionTrack = useRef<{ key: string | null; ext: number }>({ key: null, ext: 0 })
  const floaterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [floater, setFloater] = useState<number | null>(null)

  useEffect(() => {
    if (!activeSlot) {
      extensionTrack.current = { key: null, ext: 0 }
      return
    }
    const track = extensionTrack.current
    if (track.key !== slotKey) {
      extensionTrack.current = { key: slotKey, ext: activeSlot.extensionSec }
      return
    }
    const delta = activeSlot.extensionSec - track.ext
    if (delta > FLOATER_JUMP_SEC) {
      setFloater(Math.round(delta))
      if (floaterTimer.current) clearTimeout(floaterTimer.current)
      floaterTimer.current = setTimeout(() => setFloater(null), FLOATER_VISIBLE_MS)
    }
    extensionTrack.current = { key: slotKey, ext: activeSlot.extensionSec }
  }, [activeSlot, slotKey])

  useEffect(
    () => () => {
      if (floaterTimer.current) clearTimeout(floaterTimer.current)
    },
    [],
  )

  const brand = activeSlot ? brands.find((b) => b.id === activeSlot.brandProp.brandId) : undefined
  const model = activeSlot ? propModels.find((m) => m.id === activeSlot.brandProp.propModelId) : undefined

  const timeLeft = activeSlot ? timeLeftSec(activeSlot, Date.now()) : 0
  const totalDurationSec = activeSlot ? (expiresAt(activeSlot) - activeSlot.startedAt) / 1000 : 1
  const progressPct = activeSlot ? Math.min(100, Math.max(0, (timeLeft / totalDurationSec) * 100)) : 0
  const isExpiring = activeSlot?.state === 'expiring'
  const isExiting = activeSlot?.state === 'exiting'

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Queue badge — the live-auction beat */}
      {queueLen > 0 && (
        <div className="animate-slide-up absolute right-3 top-3 rounded-full border border-kick-border bg-black/60 px-3 py-1 text-[11px] font-semibold text-kick-text backdrop-blur-sm">
          NEXT UP: {queueLen} sponsor{queueLen > 1 ? 's' : ''} waiting
        </div>
      )}

      {/* Lower-third + countdown */}
      {activeSlot && brand && (
        <div
          key={slotKey}
          className={`animate-slide-up absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 transition-opacity duration-500 ${
            isExiting ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div
            className="flex items-center gap-2.5 rounded-xl border bg-black/70 px-3 py-2.5 backdrop-blur-sm"
            style={{ borderColor: brand.primaryColor, boxShadow: `0 0 20px -4px ${brand.primaryColor}` }}
          >
            <img src={brand.logoUrl} alt={brand.name} className="h-9 w-9 rounded-md object-cover" />
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-kick-text">Sponsored by {brand.name}</span>
                {brand.verified && (
                  <span className="rounded-full bg-kick/20 px-1.5 py-0.5 text-[9px] font-bold text-kick">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="text-[11px] text-kick-muted">
                {model?.name ?? 'Prop'} · ${activeSlot.brandProp.priceUsd.toLocaleString()} tip
              </div>
            </div>
          </div>

          <div className="relative rounded-xl border border-kick-border bg-black/70 px-3 py-2 backdrop-blur-sm">
            {floater !== null && (
              <div className="animate-slide-up absolute -top-6 right-2 text-sm font-bold text-kick">
                +{floater}s
              </div>
            )}
            <div
              className={`text-right font-mono text-xl font-bold tabular-nums ${
                isExpiring ? 'animate-pulse-fast text-red-500' : 'text-kick-text'
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-[width] duration-150 ease-linear ${
                  isExpiring ? 'bg-red-500' : 'bg-kick'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
