import type { ReactNode } from 'react'
import wordmark from '../../../assets/brand/kick-logo.svg'

export { Slide } from './Slide'

export function Stack({ lines }: { lines: string[] }) {
  return (
    <div className="stack">
      {lines.map((line, i) => (
        <h1 className="display h1" key={line} data-anim="riseIn" data-anim-order={i}>
          {line}
        </h1>
      ))}
    </div>
  )
}

export function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat" data-anim="slamIn">
      <span className="display hero stat__value">{value}</span>
      <span className="label">{label}</span>
    </div>
  )
}

export function Split({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="split">
      <div className="rows">{left}</div>
      <div className="rows">{right}</div>
    </div>
  )
}

export function Frame({ children, tag, bleed }: { children: ReactNode; tag?: string; bleed?: boolean }) {
  return (
    <div className={bleed ? 'frame frame--bleed' : 'frame'} data-anim="riseIn">
      <span className="mark mark--tl" />
      <span className="mark mark--tr" />
      <span className="mark mark--bl" />
      <span className="mark mark--br" />
      {tag && <span className="frame__tag">{tag}</span>}
      <div className="frame__inner">{children}</div>
    </div>
  )
}

/*
  Drawn as a mask, not an img, because the source SVG hardcodes green and the
  wordmark must be ink on a flood. Brand Identity Section 5 allows those two colourways only.
*/
export function Wordmark({ size = 'sm', ink }: { size?: 'sm' | 'lg'; ink?: boolean }) {
  return (
    <span
      className={`wordmark wordmark--${size}${ink ? ' wordmark--ink' : ''}`}
      style={{ maskImage: `url(${wordmark})`, WebkitMaskImage: `url(${wordmark})` }}
      role="img"
      aria-label="KICK"
    />
  )
}
