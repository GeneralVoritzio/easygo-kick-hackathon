import { create } from 'zustand'
import { EMPTY_FILTERS } from './filters'
import type { BodyId, DiscoveryFilters, DiscoveryOrigin, GeoStatus, SavedCamera, ViewMode } from './types'

/**
 * Lightweight session state for Discovery. Lives at module scope so leaving for
 * /stream and coming back restores the exact camera, the expanded hotspot and
 * the open confirm layer. Never persisted — precise coordinates stay in memory
 * only (see the discovery plan's privacy rule).
 */
export type DiscoveryStore = {
  /** which celestial body is being explored */
  activeBody: BodyId
  /** single body filling the viewport, or the solar-system overview */
  viewMode: ViewMode
  /** camera pose per body, so each keeps its own vantage point */
  savedCameras: Partial<Record<BodyId, SavedCamera>>
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
  /**
   * Channels the viewer has toggled to private from the UI, overriding the
   * seeded flag. Keyed by channel id; `true` means "show on the Sun".
   */
  hiddenOverrides: Record<string, boolean>

  setActiveBody: (body: BodyId) => void
  setViewMode: (mode: ViewMode) => void
  setSavedCamera: (body: BodyId, camera: SavedCamera | null) => void
  setFocusedCluster: (id: string | null) => void
  setSelectedChannel: (id: string | null) => void
  setGeoStatus: (status: GeoStatus) => void
  setOrigin: (origin: DiscoveryOrigin) => void
  setIntroFlown: () => void
  setFilters: (patch: Partial<DiscoveryFilters>) => void
  resetFilters: () => void
  toggleLocationHidden: (channelId: string, hidden: boolean) => void
}

export const useDiscovery = create<DiscoveryStore>((set) => ({
  activeBody: 'earth',
  viewMode: 'body',
  savedCameras: {},
  focusedClusterId: null,
  selectedChannelId: null,
  geoStatus: 'idle',
  origin: null,
  introFlown: false,
  filters: EMPTY_FILTERS,
  hiddenOverrides: {},

  // travelling to another body drops any open popover: it belonged to the
  // world you just left
  setActiveBody: (activeBody) => set({ activeBody, viewMode: 'body', focusedClusterId: null }),
  setViewMode: (viewMode) => set({ viewMode, focusedClusterId: null }),
  setSavedCamera: (body, camera) =>
    set((s) => ({ savedCameras: { ...s.savedCameras, [body]: camera ?? undefined } })),
  setFocusedCluster: (focusedClusterId) => set({ focusedClusterId }),
  setSelectedChannel: (selectedChannelId) => set({ selectedChannelId }),
  setGeoStatus: (geoStatus) => set({ geoStatus }),
  setOrigin: (origin) => set({ origin }),
  setIntroFlown: () => set({ introFlown: true }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
  toggleLocationHidden: (channelId, hidden) =>
    set((s) => ({ hiddenOverrides: { ...s.hiddenOverrides, [channelId]: hidden } })),
}))
