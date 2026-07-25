import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  background?: ReactNode
  notes: string
  centre?: boolean
  bleed?: boolean
  onFlood?: boolean
}

export function Slide({ children, background, notes, centre, bleed, onFlood }: Props) {
  const classes = ['slide', 'slide--upper']
  if (centre) classes.push('slide--centre')
  if (bleed) classes.push('slide--bleed')
  if (onFlood) classes.push('on-flood')

  return (
    <section>
      <div className={classes.join(' ')}>
        {background && <div className="slide__bg">{background}</div>}
        <div className="slide__body">{children}</div>
      </div>
      <aside className="notes">{notes}</aside>
    </section>
  )
}
