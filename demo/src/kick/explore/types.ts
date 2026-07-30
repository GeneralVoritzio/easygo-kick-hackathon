import type { Livestream } from "../mock/api";
import type { InteractionBadgeKey } from "./badges";
import type { TextureKey } from "./textures";

export type BodyId = "earth" | "moon" | "mars" | "sun";

// The Sun is never a home. It is a view over everyone whose location is hidden, derived at render
// time, which is what makes the privacy toggle reversible in both directions.
export type HomeBody = "earth" | "moon" | "mars";

export type ViewMode = "body" | "system";

export type SystemPlacement = {
  orbitRadius: number;
  angleDeg: number;
  displayScale: number;
  satelliteOf?: BodyId;
  satelliteOffset?: [number, number];
};

export type CelestialBody = {
  id: BodyId;
  name: string;
  tagline: string;
  texture: TextureKey;
  // RGB multiplier on the texture. Above 1 brightens, which THREE.Color allows.
  surfaceTint: [number, number, number];
  // The solar system view draws each body small, so it needs more lift to read against black.
  systemTint?: [number, number, number];
  accent: string;
  atmosphere: string | null;
  hasVectorBorders: boolean;
  // "outlined" keeps a green dot readable on a pale surface.
  hotspotStyle: "solid" | "outlined";
  emptyLabel: string;
};

// A KICK channel that relays imagery an agency already published. These are ordinary channels run
// by space enthusiasts, not an agency broadcast, and not a capability we claim the API provides.
export type RelaySource = {
  agency: string;
  instrument: string;
};

export type ChannelInteraction = {
  odds_denominator: number;
  badges: InteractionBadgeKey[];
};

// One live channel on a body. A channel carries no coordinates at all: the map holds a position for
// a country, never for a person, so the type itself cannot express anything finer.
export type ExploreChannel = {
  id: string;
  stream: Livestream;
  body: HomeBody;
  location_hidden: boolean;
  relay?: RelaySource;
  interaction: ChannelInteraction;
};

// One country, and the only place a coordinate lives. On the Moon and Mars a cluster is a relay site,
// and on the Sun it is a privacy pocket.
export type ExploreCluster = {
  id: string;
  // "Japan", or the relay site, or "Private" on the Sun.
  place: string;
  // "East Asia", or "Mars, Syrtis Major", or "location hidden" on the Sun.
  region: string;
  // "sun" appears only on the derived privacy pockets, never in the seeded catalog.
  body: BodyId;
  lat: number;
  lng: number;
  channels: ExploreChannel[];
  total_viewer_count: number;
};

export type ViewerTier = "small" | "mid" | "large";

// Badge selection is AND: a channel must carry every chosen badge. Country is matched on the cluster,
// because a channel never carries a country of its own.
export type ExploreFilters = {
  country: string | null;
  category: string | null;
  language: string | null;
  badges: InteractionBadgeKey[];
  viewerTier: ViewerTier | null;
};

export type ZoomBand = "far" | "mid" | "near";

export type GlobePoint = {
  key: string;
  clusterId: string;
  channelId?: string;
  lat: number;
  lng: number;
  weight: number;
};

// Packed polylines from scripts/build-geo.mjs: segment lengths beside a flat coordinate run.
export type PackedLines = {
  lengths: number[];
  coords: number[];
};

export type CityPoint = {
  name: string;
  lat: number;
  lng: number;
  pop: number;
};

export type GeoStatus = "idle" | "locating" | "granted" | "denied";

export type ExploreOrigin = {
  lat: number;
  lng: number;
  label: string;
  isFallback: boolean;
};

export type SavedCamera = {
  position: [number, number, number];
  target: [number, number, number];
};
