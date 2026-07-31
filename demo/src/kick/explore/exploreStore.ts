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
  // The country the pointer is on, and where to pin its hover chip.
  focusedClusterId: string | null;
  focusedAnchor: { lat: number; lng: number } | null;
  // The country whose channel list is open in the panel.
  selectedClusterId: string | null;
  // The channel whose detail is open, inside that list.
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
  setFocusedCluster: (clusterId: string | null, anchor?: { lat: number; lng: number } | null) => void;
  setSelectedCluster: (id: string | null) => void;
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
  focusedAnchor: null,
  selectedClusterId: null,
  selectedChannelId: null,
  geoStatus: "idle",
  origin: null,
  introFlown: false,
  filters: EMPTY_FILTERS,
  hiddenOverrides: {},

  // Travel drops an open popover and an open panel: both belong to the world you just left. A
  // country filter goes with them, because only Earth has countries, and a filter with no pill to
  // clear it would read as an empty map with no cause.
  setActiveBody: (activeBody) =>
    set((s) => ({
      activeBody,
      viewMode: "body",
      focusedClusterId: null,
      focusedAnchor: null,
      selectedClusterId: null,
      selectedChannelId: null,
      filters: activeBody === "earth" ? s.filters : { ...s.filters, country: null },
    })),
  setViewMode: (viewMode) => set({ viewMode, focusedClusterId: null, focusedAnchor: null }),
  setSavedCamera: (body, camera) =>
    set((s) => ({ savedCameras: { ...s.savedCameras, [body]: camera ?? undefined } })),
  // One atomic write, so the country and the anchor always describe the same dot.
  setFocusedCluster: (focusedClusterId, focusedAnchor = null) =>
    set({ focusedClusterId, focusedAnchor }),
  // A new country opens its list at the top, so the old channel detail closes with it.
  setSelectedCluster: (selectedClusterId) => set({ selectedClusterId, selectedChannelId: null }),
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
