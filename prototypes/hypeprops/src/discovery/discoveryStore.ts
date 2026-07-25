import { create } from 'zustand'
import type { DiscoveryOrigin, GeoStatus, SavedCamera } from './types'

/**
 * Lightweight session state for the Discovery globe. Lives at module scope so
 * leaving for /stream and coming back restores the exact camera, the expanded
 * hotspot and the open confirm layer. Never persisted — precise coordinates
 * stay in memory only (see the discovery plan's privacy rule).
 */
export type DiscoveryStore = {
  /** camera pose saved when the globe unmounts, replayed on return */
  savedCamera: SavedCamera | null
  /** cluster whose card popover is expanded */
  focusedClusterId: string | null
  /** channel shown in the half-screen confirm layer */
  selectedChannelId: string | null
  geoStatus: GeoStatus
  /** where the intro flight points the camera; null until resolved */
  origin: DiscoveryOrigin | null
  /** true once the intro flight has run, so returning doesn't replay it */
  introFlown: boolean

  setSavedCamera: (camera: SavedCamera | null) => void
  setFocusedCluster: (id: string | null) => void
  setSelectedChannel: (id: string | null) => void
  setGeoStatus: (status: GeoStatus) => void
  setOrigin: (origin: DiscoveryOrigin) => void
  setIntroFlown: () => void
}

export const useDiscovery = create<DiscoveryStore>((set) => ({
  savedCamera: null,
  focusedClusterId: null,
  selectedChannelId: null,
  geoStatus: 'idle',
  origin: null,
  introFlown: false,

  setSavedCamera: (savedCamera) => set({ savedCamera }),
  setFocusedCluster: (focusedClusterId) => set({ focusedClusterId }),
  setSelectedChannel: (selectedChannelId) => set({ selectedChannelId }),
  setGeoStatus: (geoStatus) => set({ geoStatus }),
  setOrigin: (origin) => set({ origin }),
  setIntroFlown: () => set({ introFlown: true }),
}))
