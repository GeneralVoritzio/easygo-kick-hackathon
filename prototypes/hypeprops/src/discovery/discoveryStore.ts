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
  /**
   * When the hovered hotspot was a single channel (near zoom, where clusters
   * have expanded), the popover shows only that channel — a child dot stands
   * for exactly one stream, so listing its siblings would be a lie.
   */
  focusedChannelId: string | null
  /**
   * Where the popover is pinned: the coordinates of the dot actually hovered,
   * which at near zoom sits ~1° off its cluster centre. Kept here rather than in
   * component state so the anchor and the focus can never drift out of sync —
   * two sources of truth is how a popover ends up pointing at the wrong place.
   */
  focusedAnchor: { lat: number; lng: number } | null
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
  setFocusedCluster: (
    clusterId: string | null,
    channelId?: string | null,
    anchor?: { lat: number; lng: number } | null,
  ) => void
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
  focusedChannelId: null,
  focusedAnchor: null,
  selectedChannelId: null,
  geoStatus: 'idle',
  origin: null,
  introFlown: false,
  filters: EMPTY_FILTERS,
  hiddenOverrides: {},

  // travelling to another body drops any open popover: it belonged to the
  // world you just left
  setActiveBody: (activeBody) => set({ activeBody, viewMode: 'body', focusedClusterId: null, focusedChannelId: null, focusedAnchor: null }),
  setViewMode: (viewMode) => set({ viewMode, focusedClusterId: null, focusedChannelId: null, focusedAnchor: null }),
  setSavedCamera: (body, camera) =>
    set((s) => ({ savedCameras: { ...s.savedCameras, [body]: camera ?? undefined } })),
  // one atomic write: cluster, channel and anchor always describe the same dot
  setFocusedCluster: (focusedClusterId, focusedChannelId = null, focusedAnchor = null) =>
    set({ focusedClusterId, focusedChannelId, focusedAnchor }),
  setSelectedChannel: (selectedChannelId) => set({ selectedChannelId }),
  setGeoStatus: (geoStatus) => set({ geoStatus }),
  setOrigin: (origin) => set({ origin }),
  setIntroFlown: () => set({ introFlown: true }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
  toggleLocationHidden: (channelId, hidden) =>
    set((s) => ({ hiddenOverrides: { ...s.hiddenOverrides, [channelId]: hidden } })),
}))
