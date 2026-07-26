import { useEffect, useRef, useState } from 'react'
import { useEngine } from '../engine/store'
import DashboardCard from './DashboardCard'

const MAX_POINTS = 150
const SAMPLE_MS = 3000
const W = 600
const H = 120
const PAD = 4

/**
 * Single-series viewer trend. Per the dataviz method: one series → no legend
 * (the title names it), 2px line, recessive extrema labels in text tokens,
 * and a crosshair+tooltip hover layer.
 */
export default function ViewerTrendCard({ history, live }: { history: number[]; live: boolean }) {
  const [series, setSeries] = useState<number[]>(history)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // live samples append to the seeded history so the curve keeps moving
  useEffect(() => {
    if (!live) return
    const id = setInterval(() => {
      setSeries((s) => [...s.slice(-(MAX_POINTS - 1)), useEngine.getState().viewers])
    }, SAMPLE_MS)
    return () => clearInterval(id)
  }, [live])

  if (series.length < 2) {
    return (
      <DashboardCard title="Viewers this session">
        <p className="text-[13px] text-kick-muted">No sessions yet — your viewer curve will draw here while you're live.</p>
      </DashboardCard>
    )
  }

  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = Math.max(1, max - min)
  const x = (i: number) => PAD + (i / (series.length - 1)) * (W - PAD * 2)
  const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2)
  const linePath = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${x(series.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`
  const current = series[series.length - 1]

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const frac = (e.clientX - rect.left) / rect.width
    setHoverIdx(Math.max(0, Math.min(series.length - 1, Math.round(frac * (series.length - 1)))))
  }

  return (
    <DashboardCard
      title="Viewers this session"
      right={
        <span className="text-[12px] text-kick-muted">
          now <span className="font-bold tabular-nums text-kick-text">{current.toLocaleString()}</span>
        </span>
      }
    >
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-[120px] w-full"
          role="img"
          aria-label={`Viewer trend, currently ${current} viewers, session range ${min} to ${max}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <path d={areaPath} fill="#53fc18" fillOpacity={0.08} />
          <path d={linePath} fill="none" stroke="#53fc18" strokeWidth={2} strokeLinejoin="round" />
          {hoverIdx != null && (
            <>
              <line
                x1={x(hoverIdx)}
                x2={x(hoverIdx)}
                y1={PAD}
                y2={H - PAD}
                stroke="#a3a3a3"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={x(hoverIdx)} cy={y(series[hoverIdx])} r={4} fill="#53fc18" stroke="#161616" strokeWidth={2} />
            </>
          )}
        </svg>

        {hoverIdx != null && (
          <div
            className="pointer-events-none absolute -top-1 -translate-x-1/2 rounded-md border border-kick-border bg-kick-panel-2 px-2 py-1 text-[11px] font-semibold tabular-nums text-kick-text shadow-lg"
            style={{ left: `${(x(hoverIdx) / W) * 100}%` }}
          >
            {series[hoverIdx].toLocaleString()} viewers
          </div>
        )}

        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-kick-muted">
          <span>low {min.toLocaleString()}</span>
          <span>peak {max.toLocaleString()}</span>
        </div>
      </div>
    </DashboardCard>
  )
}
