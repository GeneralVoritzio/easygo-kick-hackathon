import { useEffect, useRef } from 'react'
import Reveal from 'reveal.js'
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js'
import {
  Close,
  Cold,
  Cover,
  Demo,
  Fix,
  HowItWorks,
  Hook,
  Native,
  OneLiner,
  Problem,
  Team,
  Wow,
} from './slides'

export function Deck() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!root.current) return
    const instance = new Reveal(root.current, {
      // Fill the window at any aspect. The type scale is in vw, so it stays proportional.
      width: '100%',
      height: '100%',
      margin: 0,
      minScale: 1,
      maxScale: 1,
      controls: false,
      progress: true,
      hash: true,
      keyboard: true,
      overview: true,
      center: false,
      transition: 'none',
      embedded: false,
      plugins: [RevealNotes],
    })
    instance.initialize()
    return () => {
      instance.destroy()
    }
  }, [])


  return (
    <div className="reveal" ref={root}>
      <div className="slides">
        <Cover />
        <OneLiner />
        <Cold />
        <Hook />
        <Problem />
        <Fix />
        <Demo />
        <Wow />
        <HowItWorks />
        <Native />
        <Team />
        <Close />
      </div>
    </div>
  )
}
