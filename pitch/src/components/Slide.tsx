import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  background?: ReactNode
  /*
    Devices that position against the slide edge: the marquee, the sticker, the HUD.
    They cannot live with the content, because the content block is centred and an
    absolute child would anchor to it instead of to the slide.
  */
  overlay?: ReactNode
  notes: string
  centre?: boolean
  top?: boolean
  onFlood?: boolean
}

export function Slide({ children, background, overlay, notes, centre, top, onFlood }: Props) {
  const classes = ['slide']
  if (centre) classes.push('slide--centre')
  if (top) classes.push('slide--top')
  if (onFlood) classes.push('on-flood')

  return (
    <section>
      <div className={classes.join(' ')}>
        {background && <div className="slide__bg">{background}</div>}
        <div className="slide__body">{children}</div>
        {overlay}
      </div>
      <aside className="notes">{notes}</aside>
    </section>
  )
}
