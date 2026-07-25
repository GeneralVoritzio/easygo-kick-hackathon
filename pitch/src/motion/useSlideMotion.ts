import { useEffect } from 'react'
import { animate } from 'motion'
import { presets, STAGGER } from './presets'

type Reveal = {
  on: (event: string, handler: () => void) => void
  getCurrentSlide: () => HTMLElement | undefined
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useSlideMotion(deck: Reveal | null) {
  useEffect(() => {
    if (!deck) return

    const run = () => {
      const slide = deck.getCurrentSlide()
      if (!slide) return
      const targets = Array.from(slide.querySelectorAll<HTMLElement>('[data-anim]'))

      targets.forEach((el, i) => {
        const preset = presets[el.dataset.anim ?? 'hardCut'] ?? presets.hardCut
        if (reducedMotion() || preset.duration === 0) {
          el.style.opacity = '1'
          el.style.transform = 'none'
          return
        }
        animate(el, preset.keyframes, {
          duration: preset.duration,
          delay: i * STAGGER,
          ease: preset.easing as unknown as [number, number, number, number],
        })
      })
    }

    deck.on('ready', run)
    deck.on('slidechanged', run)
  }, [deck])
}
