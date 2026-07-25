import { useEffect, useRef } from 'react'
import Reveal from 'reveal.js'
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js'
import { Close, Cold, Demo, Fix, HowItWorks, Hook, Native, Problem, Team, Wow } from './slides'

export function Deck() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!root.current) return
    const instance = new Reveal(root.current, {
      width: 1920,
      height: 1080,
      margin: 0,
      minScale: 0.2,
      maxScale: 1.5,
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
