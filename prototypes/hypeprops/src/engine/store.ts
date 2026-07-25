import { create } from 'zustand'
import type { Brand, BrandProp, ChatMessage, Hype, PropModel, Slot, SponsorEvent } from './types'
import { HYPE, cappedExtension, extensionFor, nextHype } from './hype'
import { SLOT, isDone, nextSlotState } from './slotMachine'
import { BRANDS, PROP_MODELS, SEED_BRAND_PROPS } from '../data/catalog'
import { useInteraction } from './interactionStore'

const WINDOW_MS = 3000

// rolling event buffers — module-level mutable state, never triggers renders
const chatTs: number[] = []
const likeBuf: { ts: number; n: number }[] = []
let prevViewers = 0
let lastTick = 0
let cooldownUntil = 0
let idSeq = 0
const uid = (prefix: string) => `${prefix}-${++idSeq}-${Date.now().toString(36)}`

function velocityPerSec(count: number): number {
  return count / (WINDOW_MS / 1000)
}

export type EngineStore = {
  brands: Brand[]
  propModels: PropModel[]
  brandProps: BrandProp[]
  activeSlot: Slot | null
  queue: SponsorEvent[]
  hype: Hype
  chat: ChatMessage[]
  likes: number
  viewers: number
  surgeUntil: number
  signedInBrandId: string | null
  /** stage source: live Kick embed (interaction-engine demo) or webcam (face-props demo) */
  feedMode: 'kick' | 'webcam'
  kickChannel: string

  fireSponsorEvent: (brandPropId: string, amountUsd?: number) => void
  triggerHypeSurge: () => void
  addChat: (user: string, text: string, color: string) => void
  addLikes: (n: number) => void
  saveBrandProp: (bp: BrandProp) => void
  signInBrand: (brandId: string | null) => void
  setFeedMode: (mode: 'kick' | 'webcam') => void
  setKickChannel: (slug: string) => void
  /** live anchor tuning (director panel) — logs a paste-ready catalog.ts line */
  nudgeAnchor: (modelId: string, delta: { y?: number; z?: number; tilt?: number; scale?: number }) => void
  tick: (now: number) => void
}

function makeSlot(bp: BrandProp, now: number): Slot {
  return {
    brandProp: bp,
    startedAt: now,
    baseDurationSec: bp.baseDurationSec,
    extensionSec: 0,
    state: 'entering',
    stateSince: now,
  }
}

export const useEngine = create<EngineStore>((set, get) => ({
  brands: BRANDS,
  propModels: PROP_MODELS,
  brandProps: SEED_BRAND_PROPS,
  activeSlot: null,
  queue: [],
  hype: { score: 0, chatVelocity: 0, likeVelocity: 0, viewers: 1247 },
  chat: [],
  likes: 8321,
  viewers: 1247,
  surgeUntil: 0,
  signedInBrandId: null,
  feedMode: 'kick',
  kickChannel: 'maxholloway',

  fireSponsorEvent: (brandPropId, amountUsd) => {
    const { brandProps, brands, activeSlot, queue } = get()
    const bp = brandProps.find((p) => p.id === brandPropId)
    if (!bp) return
    const brand = brands.find((b) => b.id === bp.brandId)
    const ev: SponsorEvent = {
      id: uid('tip'),
      brandPropId,
      amountUsd: amountUsd ?? bp.priceUsd,
      ts: Date.now(),
    }
    const now = Date.now()
    if (!activeSlot && now >= cooldownUntil) {
      set({ activeSlot: makeSlot(bp, now) })
    } else {
      set({ queue: [...queue, ev] })
    }
    if (brand) {
      get().addChat(
        'HypeProps',
        `💰 ${brand.name} tipped a $${ev.amountUsd.toLocaleString()} prop drop!${activeSlot ? ' (queued — live auction!)' : ''}`,
        '#53fc18',
      )
    }
  },

  triggerHypeSurge: () => {
    const now = Date.now()
    const { activeSlot, hype } = get()
    const next: Partial<EngineStore> = {
      surgeUntil: now + 4000,
      hype: { ...hype, score: Math.min(1, hype.score + 0.3) },
    }
    if (activeSlot && (activeSlot.state === 'active' || activeSlot.state === 'expiring')) {
      next.activeSlot = {
        ...activeSlot,
        extensionSec: cappedExtension(activeSlot.extensionSec + HYPE.SURGE_BONUS_SEC),
      }
    }
    set(next)
  },

  addChat: (user, text, color) => {
    const now = Date.now()
    chatTs.push(now)
    const msg: ChatMessage = { id: uid('msg'), user, text, color, ts: now }
    set((s) => ({ chat: [...s.chat.slice(-59), msg] }))
    // ingest boundary shaped like Kick's chat.message.sent webhook payload —
    // on real Kick this is the webhook handler; on the clone we own the bus
    const user_id = user.toLowerCase().replace(/[^a-z0-9]/g, '')
    useInteraction.getState().ingestChat({
      message_id: msg.id,
      sender: { user_id, username: user, identity: { badges: [] } },
      content: text,
      created_at: now,
    })
    // `/interact <dare>` — roulette submission (one live entry per user)
    const dare = text.trim().match(/^\/interact\s+(.+)/i)
    if (dare) useInteraction.getState().submitDare(user_id, user, color, dare[1])
    // `!sponsor volt` — alt trigger, shaped like a chat command
    const m = text.trim().match(/^!sponsor\s+(\w+)/i)
    if (m) {
      const brand = get().brands.find((b) => b.id.toLowerCase() === m[1].toLowerCase() || b.name.toLowerCase().startsWith(m[1].toLowerCase()))
      const bp = brand && get().brandProps.find((p) => p.brandId === brand.id)
      if (bp) get().fireSponsorEvent(bp.id)
    }
  },

  addLikes: (n) => {
    likeBuf.push({ ts: Date.now(), n })
    set((s) => ({ likes: s.likes + n }))
  },

  saveBrandProp: (bp) => set((s) => ({ brandProps: [...s.brandProps, bp] })),
  signInBrand: (brandId) => set({ signedInBrandId: brandId }),
  setFeedMode: (feedMode) => set({ feedMode }),
  setKickChannel: (kickChannel) => set({ kickChannel }),

  nudgeAnchor: (modelId, delta) =>
    set((s) => ({
      propModels: s.propModels.map((m) => {
        if (m.id !== modelId) return m
        const { position: p, rotation: r } = m.anchor
        const anchor = {
          position: [p[0], +(p[1] + (delta.y ?? 0)).toFixed(2), +(p[2] + (delta.z ?? 0)).toFixed(2)] as [
            number,
            number,
            number,
          ],
          rotation: [+(r[0] + (delta.tilt ?? 0)).toFixed(3), r[1], r[2]] as [number, number, number],
          scale: +(m.anchor.scale + (delta.scale ?? 0)).toFixed(2),
        }
        console.log(
          `[tune ${m.id}] anchor: { position: [${anchor.position.join(', ')}], rotation: [${anchor.rotation.join(', ')}], scale: ${anchor.scale} },`,
        )
        return { ...m, anchor }
      }),
    })),

  tick: (now) => {
    const dt = lastTick ? Math.min(0.5, (now - lastTick) / 1000) : 0.1
    lastTick = now

    // rolling-window velocities
    while (chatTs.length && chatTs[0] < now - WINDOW_MS) chatTs.shift()
    while (likeBuf.length && likeBuf[0].ts < now - WINDOW_MS) likeBuf.shift()
    const chatVelocity = velocityPerSec(chatTs.length)
    const likeVelocity = velocityPerSec(likeBuf.reduce((a, b) => a + b.n, 0))

    const s = get()

    // viewers drift with hype (and feed back into it, weakly)
    const drift = (s.hype.score * 26 - 3) * dt + (Math.random() - 0.5) * 2
    const viewers = Math.max(800, Math.round(s.viewers + drift))
    const viewerDelta = dt > 0 ? Math.max(0, viewers - prevViewers) / dt : 0
    prevViewers = viewers

    const score = nextHype(s.hype.score, { chatVelocity, likeVelocity, viewerDelta }, dt)

    // slot lifecycle
    let activeSlot = s.activeSlot
    let queue = s.queue
    if (activeSlot) {
      if (activeSlot.state === 'active' || activeSlot.state === 'expiring') {
        const earned = extensionFor(score, dt)
        if (earned > 0) {
          activeSlot = { ...activeSlot, extensionSec: cappedExtension(activeSlot.extensionSec + earned) }
        }
      }
      const nextState = nextSlotState(activeSlot, now)
      if (nextState !== activeSlot.state) {
        activeSlot = { ...activeSlot, state: nextState, stateSince: now }
      }
      if (isDone(activeSlot, now)) {
        activeSlot = null
        cooldownUntil = now + SLOT.COOLDOWN_MS
      }
    } else if (queue.length && now >= cooldownUntil) {
      const [nextEv, ...rest] = queue
      const bp = s.brandProps.find((p) => p.id === nextEv.brandPropId)
      queue = rest
      if (bp) activeSlot = makeSlot(bp, now)
    }

    set({
      hype: { score, chatVelocity, likeVelocity, viewers },
      viewers,
      activeSlot,
      queue,
    })
  },
}))

// convenience selectors
export const selectBrandOf = (bp: BrandProp) => (s: EngineStore) =>
  s.brands.find((b) => b.id === bp.brandId)
export const selectModelOf = (bp: BrandProp) => (s: EngineStore) =>
  s.propModels.find((m) => m.id === bp.propModelId)
