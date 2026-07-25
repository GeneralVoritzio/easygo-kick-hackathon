import './mock.css'
import { channel, chat, curve, decision, markers } from './fixture'

const MARKER_LABEL: Record<string, string> = {
  raid: 'RAID',
  clip: 'CLIP',
  decision: 'CATEGORY',
  poll: 'POLL',
  gift: 'KICKS',
}

function curvePath(values: number[], w: number, h: number) {
  const step = w / (values.length - 1)
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - (v / 100) * h).toFixed(1)}`)
    .join(' ')
}

export function ChannelBar() {
  return (
    <div className="m-bar">
      <span className="m-live">
        <span className="m-live__dot" />
        LIVE
      </span>
      <span className="m-bar__name">{channel.username}</span>
      <span className="m-bar__title">{channel.title}</span>
      <span className="m-bar__viewers tabular">{channel.viewers} watching</span>
    </div>
  )
}

/*
  The plot scales to its container, so markers are positioned as a percentage.
  A pixel offset would drift away from the curve at any other width.
*/
export function TimelineTrack({ width = 1728, height = 200 }: { width?: number; height?: number }) {
  const path = curvePath(curve, width, height)
  const at = (index: number) => `${(index / (curve.length - 1)) * 100}%`

  return (
    <div className="m-track">
      <div className="m-track__head">
        <span className="m-track__metric">Hype</span>
        <span className="m-track__hint">Scrub, hover a peak, jump to it</span>
      </div>
      <div className="m-track__plot" style={{ height }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <path className="m-curve__fill" d={`${path} L ${width} ${height} L 0 ${height} Z`} />
          <path className="m-curve__line" d={path} />
        </svg>
        {markers.map((m) => (
          <span key={m.kind} className={`m-pin m-pin--${m.kind}`} style={{ left: at(m.at) }}>
            <span className="m-pin__label">{MARKER_LABEL[m.kind]}</span>
          </span>
        ))}
        <span className="m-playhead" style={{ left: at(36) }} />
      </div>
      <div className="m-track__axis tabular">
        <span>00:00</span>
        <span>01:05</span>
        <span>02:41</span>
        <span>03:29</span>
        <span>04:00</span>
      </div>
    </div>
  )
}

export function ChatPeek() {
  return (
    <div className="m-chat">
      <div className="m-chat__head">Chat at 03:29, the 15 second window</div>
      {chat.map((line) => (
        <div className="m-msg" key={line.user}>
          <span className="m-msg__user" style={{ color: line.colour }}>
            {line.user}
          </span>
          <span className="m-msg__text">{line.text}</span>
        </div>
      ))}
    </div>
  )
}

export function DecisionCard() {
  return (
    <div className="m-card">
      <div className="m-card__head tabular">{decision.at}</div>
      <div className="m-card__move">
        <span className="m-card__from">{decision.from}</span>
        <span className="m-card__arrow">to</span>
        <span className="m-card__to">{decision.to}</span>
      </div>
      <div className="m-card__deltas">
        <Delta label="Viewers" value={decision.viewers} />
        <Delta label="Follow rate" value={decision.follows} />
        <Delta label="Subs" value={decision.subs} />
      </div>
    </div>
  )
}

function Delta({ label, value }: { label: string; value: string }) {
  return (
    <div className="m-delta">
      <span className="m-delta__value tabular">{value}</span>
      <span className="m-delta__label">{label}</span>
    </div>
  )
}
