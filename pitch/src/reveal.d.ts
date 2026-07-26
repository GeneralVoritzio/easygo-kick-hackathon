declare module 'reveal.js' {
  export type RevealOptions = Record<string, unknown>

  export default class Reveal {
    constructor(element: HTMLElement, options?: RevealOptions)
    initialize(): Promise<void>
    destroy(): void
    on(event: string, handler: () => void): void
    getCurrentSlide(): HTMLElement | undefined
  }
}

declare module 'reveal.js/plugin/notes/notes.esm.js' {
  const plugin: unknown
  export default plugin
}
