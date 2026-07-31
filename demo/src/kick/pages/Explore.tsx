import { useEffect, useMemo } from "react";
import { formatViewers } from "../mock/api";
import { DEFAULT_ORIGIN, EXPLORE_CLUSTERS, findExploreChannel } from "../mock/explore";
import { BODIES, BODY_ORDER } from "../explore/bodies";
import { channelCountsByBody, clustersForBody } from "../explore/bodyView";
import { BodySwitcher } from "../explore/BodySwitcher";
import { ExploreFilterBar } from "../explore/ExploreFilterBar";
import { ExploreGlobe } from "../explore/ExploreGlobe";
import { SolarSystemView } from "../explore/SolarSystemView";
import { ExplorePanel } from "../explore/ExplorePanel";
import { applyExploreFilters } from "../explore/filters";
import { useExplore } from "../explore/exploreStore";
import type { BodyId, ExploreCluster } from "../explore/types";

const chipClass =
  "rounded-full border border-outline-decorative bg-surface-base/80 px-3 py-1.5 text-xs text-surface-onSurfaceSecondary backdrop-blur-sm";

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// The semantic alternative to the canvas, and the whole page when WebGL is missing. Each entry opens
// the same panel a sighted user gets, so no map state is lost.
function BodyChannelList({
  bodies,
  className = "",
}: {
  bodies: { id: BodyId; clusters: ExploreCluster[] }[];
  className?: string;
}) {
  const setSelectedCluster = useExplore((s) => s.setSelectedCluster);
  const setSelectedChannel = useExplore((s) => s.setSelectedChannel);

  return (
    <nav aria-label="Live channels by location" className={className}>
      {bodies.map(({ id, clusters }) => (
        <section key={id} className="mb-6">
          <h2 className="mb-2 text-sm font-bold text-white">
            {BODIES[id].name}, {BODIES[id].tagline}
          </h2>
          {clusters.map((cluster) => (
            <section key={cluster.id} className="mb-4">
              <h3 className="mb-1.5 text-sm font-bold text-white">
                {cluster.body === "sun" ? "Location private" : cluster.place}
              </h3>
              <ul className="space-y-1">
                {cluster.channels.map((channel) => (
                  <li key={channel.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCluster(cluster.id);
                        setSelectedChannel(channel.id);
                      }}
                      className="text-left text-sm text-surface-onSurfaceSecondary transition-colors betterhover:hover:text-primary-base"
                    >
                      {channel.stream.channel.username}, {channel.stream.category.name},{" "}
                      {formatViewers(channel.stream.viewer_count)} watching
                      {channel.relay
                        ? `, relaying ${channel.relay.agency} ${channel.relay.instrument}`
                        : ""}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>
      ))}
    </nav>
  );
}

// fake-kick GET /public/v1/explore/map returns the clusters, each channel's coordinates and the
// privacy flag. KICK publishes no location for a channel, so the whole map is our own surface.
export function Explore() {
  const webglOk = useMemo(hasWebGL, []);
  const geoStatus = useExplore((s) => s.geoStatus);
  const origin = useExplore((s) => s.origin);
  const selectedClusterId = useExplore((s) => s.selectedClusterId);
  const selectedChannelId = useExplore((s) => s.selectedChannelId);
  const filters = useExplore((s) => s.filters);
  const activeBody = useExplore((s) => s.activeBody);
  const viewMode = useExplore((s) => s.viewMode);
  const hiddenOverrides = useExplore((s) => s.hiddenOverrides);

  const body = BODIES[activeBody];

  // The counts feed the switcher and the system labels. They follow the privacy toggles, and they
  // ignore the filters on purpose, because they describe the whole system, not the current query.
  const counts = useMemo(
    () => channelCountsByBody(EXPLORE_CLUSTERS, hiddenOverrides),
    [hiddenOverrides],
  );

  const bodyClusters = useMemo(
    () => clustersForBody(EXPLORE_CLUSTERS, activeBody, hiddenOverrides),
    [activeBody, hiddenOverrides],
  );
  const filteredClusters = useMemo(
    () => applyExploreFilters(bodyClusters, filters),
    [bodyClusters, filters],
  );
  const matchCount = useMemo(
    () => filteredClusters.reduce((sum, c) => sum + c.channels.length, 0),
    [filteredClusters],
  );

  const elsewhere = useMemo(() => {
    if (matchCount > 0) return null;
    for (const id of BODY_ORDER) {
      if (id === activeBody) continue;
      const n = applyExploreFilters(
        clustersForBody(EXPLORE_CLUSTERS, id, hiddenOverrides),
        filters,
      ).reduce((sum, c) => sum + c.channels.length, 0);
      if (n > 0) return { body: id, count: n };
    }
    return null;
  }, [matchCount, activeBody, filters, hiddenOverrides]);

  // The default region drives the intro flight. A coordinate only ever steers the local camera, and
  // nothing is sent anywhere or persisted.
  useEffect(() => {
    const state = useExplore.getState();
    if (!state.origin) state.setOrigin(DEFAULT_ORIGIN);
  }, []);

  // The ask is a click, not a page load. A permission bubble over the navbar reads as a fault.
  const requestOrigin = () => {
    const state = useExplore.getState();
    if (state.geoStatus === "locating") return;
    if (!("geolocation" in navigator)) {
      state.setGeoStatus("denied");
      return;
    }
    state.setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const s = useExplore.getState();
        s.setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "your area",
          isFallback: false,
        });
        s.setGeoStatus("granted");
      },
      () => {
        const s = useExplore.getState();
        s.setOrigin(DEFAULT_ORIGIN);
        s.setGeoStatus("denied");
      },
      { timeout: 8000, maximumAge: 600_000 },
    );
  };

  // Escape peels the layers back one at a time: the panel, the popover, then the system view.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const state = useExplore.getState();
      if (state.selectedChannelId) state.setSelectedChannel(null);
      else if (state.selectedClusterId) state.setSelectedCluster(null);
      else if (state.focusedClusterId) state.setFocusedCluster(null);
      else if (state.viewMode === "system") state.setViewMode("body");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // The open country comes from the clusters the map is showing, so the list obeys the filters and
  // the privacy toggles.
  const selectedCluster = useMemo(
    () => (selectedClusterId ? filteredClusters.find((c) => c.id === selectedClusterId) : undefined),
    [selectedClusterId, filteredClusters],
  );
  const selectedChannel = selectedChannelId ? findExploreChannel(selectedChannelId) : undefined;

  const statusLabel =
    activeBody !== "earth"
      ? body.tagline
      : geoStatus === "locating"
        ? "finding your area"
        : geoStatus === "granted"
          ? "exploring from your area"
          : origin
            ? `exploring from ${origin.label}`
            : null;

  const hint =
    viewMode === "system"
      ? "sizes and distances are compressed for browsing, click a body to fly in"
      : "drag to rotate, scroll to zoom, zoom out twice to leave orbit";

  const allBodies = useMemo(
    () =>
      BODY_ORDER.map((id) => ({
        id,
        clusters: clustersForBody(EXPLORE_CLUSTERS, id, hiddenOverrides),
      })),
    [hiddenOverrides],
  );

  return (
    <div
      id="explore-root"
      className="relative -mb-6 flex h-[calc(100vh-var(--navbar-height))] w-full overflow-hidden bg-surface-lowest"
    >
      {webglOk ? (
        // min-w-0 is load bearing: a flex item defaults to min-width auto, so a label the system
        // view puts near the edge would widen this box, which widens the canvas, which moves the
        // label further out again.
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          {/* Each view arrives with a short warp, so travel reads as movement instead of a cut. */}
          {/* The canvas wrapper is absolute, so a drei Html label cannot grow it, and the canvas
              cannot then grow with it. */}
          {viewMode === "system" ? (
            <div key="system" className="animate-warp-out absolute inset-0">
              <SolarSystemView counts={counts} />
            </div>
          ) : (
            // Keyed by body: a new body means a fresh scene and a fresh camera.
            <div key={activeBody} className="animate-warp-in absolute inset-0">
              <ExploreGlobe bodyId={activeBody} />
            </div>
          )}

          {viewMode === "body" && (
            <ExploreFilterBar
              matchCount={matchCount}
              emptyLabel={body.emptyLabel}
              elsewhere={elsewhere}
            />
          )}

          <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-center sm:inset-x-auto sm:right-4">
            <BodySwitcher counts={counts} />
          </div>

          <div className={`pointer-events-none absolute bottom-4 left-4 ${chipClass}`}>{hint}</div>

          {statusLabel && (
            <button
              type="button"
              onClick={requestOrigin}
              disabled={activeBody !== "earth" || geoStatus === "granted"}
              title={
                activeBody === "earth" && geoStatus !== "granted"
                  ? "Use my location to aim the camera"
                  : undefined
              }
              className={`absolute bottom-4 right-4 flex items-center gap-2 font-medium ${chipClass} ${
                activeBody === "earth" && geoStatus !== "granted"
                  ? "betterhover:hover:text-white"
                  : "pointer-events-none"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  geoStatus === "locating" && activeBody === "earth" ? "animate-pulse-fast" : ""
                }`}
                style={{ backgroundColor: body.accent }}
              />
              {statusLabel}
            </button>
          )}

          <BodyChannelList bodies={allBodies} className="sr-only" />
        </div>
      ) : (
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <p className="mb-4 max-w-xl text-sm text-surface-onSurfaceSecondary">
            This browser cannot render the 3D map, because WebGL is not available. Here is everybody
            live, by location.
          </p>
          <BodyChannelList bodies={allBodies} />
        </div>
      )}

      {selectedCluster && <ExplorePanel cluster={selectedCluster} channel={selectedChannel} />}
    </div>
  );
}
