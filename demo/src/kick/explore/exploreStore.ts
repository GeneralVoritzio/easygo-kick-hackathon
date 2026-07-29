import { create } from "zustand";
import { EMPTY_FILTERS } from "./filters";
import type { BodyId, ExploreFilters, ExploreOrigin, GeoStatus, SavedCamera, ViewMode } from "./types";

// Session state for the Explore map. It lives at module scope, so leaving for a channel page and
// coming back restores the camera, the expanded hotspot and the filters. It is never persisted, so
// a precise coordinate stays in memory only.
export type ExploreStore = {
  activeBody: BodyId;
  viewMode: ViewMode;
  // One camera pose per body, so each keeps its own vantage point.
  savedCameras: Partial<Record<BodyId, SavedCamera>>;
  focusedClusterId: string | null;
  // At near zoom a dot stands for one channel, so the popover shows only that channel.
  focusedChannelId: string | null;
  // Where the popover is pinned: the coordinates of the dot the pointer is on, which at near zoom
  // sits about one degree off the cluster centre. It lives here so the anchor and the focus cannot
  // drift apart, which is how a popover ends up pointing at the wrong place.
  focusedAnchor: { lat: number; lng: number } | null;
  selectedChannelId: string | null;
  geoStatus: GeoStatus;
  origin: ExploreOrigin | null;
  introFlown: boolean;
  filters: ExploreFilters;
  // Channels the viewer moved to private from the UI, which overrides the seeded flag.
  hiddenOverrides: Record<string, boolean>;

  setActiveBody: (body: BodyId) => void;
  setViewMode: (mode: ViewMode) => void;
  setSavedCamera: (body: BodyId, camera: SavedCamera | null) => void;
  setFocusedCluster: (
    clusterId: string | null,
    channelId?: string | null,
    anchor?: { lat: number; lng: number } | null,
  ) => void;
  setSelectedChannel: (id: string | null) => void;
  setGeoStatus: (status: GeoStatus) => void;
  setOrigin: (origin: ExploreOrigin) => void;
  setIntroFlown: () => void;
  setFilters: (patch: Partial<ExploreFilters>) => void;
  resetFilters: () => void;
  toggleLocationHidden: (channelId: string, hidden: boolean) => void;
};

export const useExplore = create<ExploreStore>((set) => ({
  activeBody: "earth",
  viewMode: "body",
  savedCameras: {},
  focusedClusterId: null,
  focusedChannelId: null,
  focusedAnchor: null,
  selectedChannelId: null,
  geoStatus: "idle",
  origin: null,
  introFlown: false,
  filters: EMPTY_FILTERS,
  hiddenOverrides: {},

  // Travel to another body drops an open popover, because it belongs to the world you just left.
  setActiveBody: (activeBody) =>
    set({
      activeBody,
      viewMode: "body",
      focusedClusterId: null,
      focusedChannelId: null,
      focusedAnchor: null,
    }),
  setViewMode: (viewMode) =>
    set({ viewMode, focusedClusterId: null, focusedChannelId: null, focusedAnchor: null }),
  setSavedCamera: (body, camera) =>
    set((s) => ({ savedCameras: { ...s.savedCameras, [body]: camera ?? undefined } })),
  // One atomic write, so the cluster, the channel and the anchor always describe the same dot.
  setFocusedCluster: (focusedClusterId, focusedChannelId = null, focusedAnchor = null) =>
    set({ focusedClusterId, focusedChannelId, focusedAnchor }),
  setSelectedChannel: (selectedChannelId) => set({ selectedChannelId }),
  setGeoStatus: (geoStatus) => set({ geoStatus }),
  setOrigin: (origin) => set({ origin }),
  setIntroFlown: () => set({ introFlown: true }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
  // fake-kick PATCH /public/v1/channels/{slug}/location-privacy
  toggleLocationHidden: (channelId, hidden) =>
    set((s) => ({ hiddenOverrides: { ...s.hiddenOverrides, [channelId]: hidden } })),
}));
