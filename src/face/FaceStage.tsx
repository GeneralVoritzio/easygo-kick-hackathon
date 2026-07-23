import { useEffect, useRef, useState } from 'react'
import PropCanvas from './PropCanvas'
import { useFaceTracker } from './useFaceTracker'

/**
 * Webcam stage: raw video feeds MediaPipe; video + prop canvas share one
 * CSS-mirrored, aspect-exact box so overlay alignment survives any camera
 * aspect ratio and any layout size. Mirroring never touches the matrix.
 */
export default function FaceStage({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { status, error } = useFaceTracker(videoRef)
  const [videoAspect, setVideoAspect] = useState(16 / 9)
  const [box, setBox] = useState({ width: 0, height: 0 })

  // fit an aspect-exact box inside the container (letterbox, never crop —
  // a crop would break the 1:1 mapping between canvas and video pixels)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const fit = () => {
      const { width: cw, height: ch } = el.getBoundingClientRect()
      if (!cw || !ch) return
      const scale = Math.min(cw / videoAspect, ch)
      setBox({ width: Math.round(scale * videoAspect), height: Math.round(scale) })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [videoAspect])

  return (
    <div ref={containerRef} className={`relative grid h-full w-full place-items-center overflow-hidden bg-black ${className}`}>
      <div className="relative -scale-x-100" style={{ width: box.width, height: box.height }}>
        <video
          ref={videoRef}
          muted
          playsInline
          onLoadedMetadata={(e) => {
            const v = e.currentTarget
            if (v.videoWidth && v.videoHeight) setVideoAspect(v.videoWidth / v.videoHeight)
          }}
          className="absolute inset-0 h-full w-full"
        />
        <PropCanvas />
      </div>

      {status === 'starting' && (
        <div className="absolute inset-0 grid place-items-center bg-black/70">
          <div className="flex items-center gap-3 text-kick-muted">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-kick" />
            starting camera + face tracking…
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
          <div>
            <div className="mb-1 font-semibold text-red-400">camera unavailable</div>
            <div className="text-sm text-kick-muted">{error} — allow camera access and reload</div>
          </div>
        </div>
      )}
    </div>
  )
}
