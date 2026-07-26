import { create } from 'zustand'
import { EMPTY_FILTERS } from './filters'
import type { DiscoveryFilters, DiscoveryOrigin, GeoStatus, SavedCamera } from './types'

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
  /** active filters — like the camera, they survive a round-trip to /stream */
  filters: DiscoveryFilters

  setSavedCamera: (camera: SavedCamera | null) => void
  setFocusedCluster: (id: string | null) => void
  setSelectedChannel: (id: string | null) => void
  setGeoStatus: (status: GeoStatus) => void
  setOrigin: (origin: DiscoveryOrigin) => void
  setIntroFlown: () => void
  setFilters: (patch: Partial<DiscoveryFilters>) => void
  resetFilters: () => void
}

export const useDiscovery = create<DiscoveryStore>((set) => ({
  savedCamera: null,
  focusedClusterId: null,
  selectedChannelId: null,
  geoStatus: 'idle',
  origin: null,
  introFlown: false,
  filters: EMPTY_FILTERS,

  setSavedCamera: (savedCamera) => set({ savedCamera }),
  setFocusedCluster: (focusedClusterId) => set({ focusedClusterId }),
  setSelectedChannel: (selectedChannelId) => set({ selectedChannelId }),
  setGeoStatus: (geoStatus) => set({ geoStatus }),
  setOrigin: (origin) => set({ origin }),
  setIntroFlown: () => set({ introFlown: true }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
}))
