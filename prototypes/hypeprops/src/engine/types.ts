export type Brand = {
  id: string
  name: string
  verified: boolean
  logoUrl: string
  primaryColor: string
}

export type AnchorConfig = {
  /** offset from head origin, in canonical-face cm */
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

export type PropModel = {
  id: string
  type: 'hat' | 'glasses'
  name: string
  /** 'primitive:cap' | 'primitive:glasses' | a .glb url */
  glbUrl: string
  anchor: AnchorConfig
}

export type Finish = 'matte' | 'gloss' | 'metallic'

export type Skin = {
  baseColor: string
  logoUrl?: string
  finish: Finish
}

export type BrandProp = {
  id: string
  brandId: string
  propModelId: string
  skin: Skin
  priceUsd: number
  baseDurationSec: number
}

/** mock "tip"; shaped like a Kick webhook event so it's swappable for the real thing */
export type SponsorEvent = {
  id: string
  brandPropId: string
  amountUsd: number
  ts: number
}

export type SlotState = 'entering' | 'active' | 'expiring' | 'exiting'

export type Slot = {
  brandProp: BrandProp
  startedAt: number
  baseDurationSec: number
  extensionSec: number
  state: SlotState
  stateSince: number
}

export type Hype = {
  score: number
  chatVelocity: number
  likeVelocity: number
  viewers: number
}

export type ChatMessage = {
  id: string
  user: string
  color: string
  text: string
  ts: number
}
