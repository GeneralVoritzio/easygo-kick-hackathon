import { describe, expect, it } from "vitest";
import {
  bordersForBand,
  citiesForView,
  FAR_CLUSTER_CAP,
  GLOBE_RADIUS,
  INITIAL_CAMERA_DISTANCE,
  latLngToVector3,
  MAX_CAMERA_DISTANCE,
  MID_BAND_MAX,
  MIN_CAMERA_DISTANCE,
  NEAR_BAND_MAX,
  nearestCities,
  pointScaleForDistance,
  selectVisiblePoints,
  zoomBandForDistance,
} from "./geo";
import { EXPLORE_CLUSTERS } from "../mock/explore";
import { clustersForBody } from "./bodyView";

const earth = clustersForBody(EXPLORE_CLUSTERS, "earth");

describe("latLngToVector3", () => {
  it("maps the poles and the reference meridian to the sphere axes", () => {
    const [nx, ny, nz] = latLngToVector3(90, 0);
    expect(nx).toBeCloseTo(0);
    expect(ny).toBeCloseTo(GLOBE_RADIUS);
    expect(nz).toBeCloseTo(0);

    const [gx, gy, gz] = latLngToVector3(0, 0);
    expect(gx).toBeCloseTo(GLOBE_RADIUS);
    expect(gy).toBeCloseTo(0);
    expect(gz).toBeCloseTo(0);

    // 90 East sits a quarter turn towards -Z, the three.js SphereGeometry UV layout.
    const [ex, , ez] = latLngToVector3(0, 90);
    expect(ex).toBeCloseTo(0);
    expect(ez).toBeCloseTo(-GLOBE_RADIUS);
  });

  it("always lands on the sphere surface", () => {
    for (const [lat, lng] of [
      [37.77, -122.42],
      [-33.87, 151.21],
      [65, 179],
      [-89, -1],
    ]) {
      const [x, y, z] = latLngToVector3(lat, lng, 3);
      expect(Math.hypot(x, y, z)).toBeCloseTo(3);
    }
  });
});

describe("pointScaleForDistance", () => {
  it("is exactly 1 at the landing distance", () => {
    expect(pointScaleForDistance(INITIAL_CAMERA_DISTANCE)).toBe(1);
  });

  it("shrinks a dot as the camera closes in, so an expanded point stays pickable", () => {
    let prev = Infinity;
    for (const d of [MAX_CAMERA_DISTANCE, 3, 2.2, 1.8, 1.5, MIN_CAMERA_DISTANCE]) {
      const s = pointScaleForDistance(d);
      expect(s).toBeLessThanOrEqual(prev);
      prev = s;
    }
    expect(pointScaleForDistance(1.5)).toBeLessThan(0.5);
  });

  it("clamps at both extremes", () => {
    expect(pointScaleForDistance(MIN_CAMERA_DISTANCE)).toBeGreaterThanOrEqual(0.22);
    expect(pointScaleForDistance(100)).toBeLessThanOrEqual(1.4);
  });
});

describe("bordersForBand", () => {
  it("adds detail as the camera closes in, and adds admin1 only at near zoom", () => {
    expect(bordersForBand("far")).toEqual(["countries-coarse"]);
    expect(bordersForBand("mid")).toEqual(["countries-fine"]);
    expect(bordersForBand("near")).toEqual(["countries-fine", "admin1"]);
    // Countries always draw first, so the admin1 lines sit on top.
    for (const band of ["far", "mid", "near"] as const) {
      expect(bordersForBand(band)[0]).toMatch(/^countries-/);
    }
  });
});

describe("citiesForView", () => {
  const cities = Array.from({ length: 200 }, (_, i) => ({
    name: `City ${i}`,
    lat: 0,
    lng: 0,
    pop: 1_000_000 - i * 1000,
  }));

  it("labels nothing until near zoom", () => {
    expect(citiesForView(cities, "far", true)).toEqual([]);
    expect(citiesForView(cities, "mid", true)).toEqual([]);
  });

  it("labels nothing on a body with no geography, however close the camera gets", () => {
    for (const band of ["far", "mid", "near"] as const) {
      expect(citiesForView(cities, band, false), band).toEqual([]);
    }
  });

  it("caps the candidate pool and takes the biggest cities first", () => {
    const shown = citiesForView(cities, "near", true, 25);
    expect(shown).toHaveLength(25);
    expect(shown[0].name).toBe("City 0");
    expect(shown.map((c) => c.pop)).toEqual([...shown.map((c) => c.pop)].sort((a, b) => b - a));
  });

  it("never returns more than it was given", () => {
    expect(citiesForView(cities.slice(0, 5), "near", true, 25)).toHaveLength(5);
  });
});

describe("nearestCities", () => {
  const ring = Array.from({ length: 12 }, (_, i) => ({
    name: `Ring ${i * 30}`,
    lat: 0,
    lng: i * 30 - 180,
    pop: 500_000,
  }));

  it("labels only the hemisphere that faces the camera", () => {
    const shown = nearestCities(ring, [1, 0, 0]);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.length).toBeLessThan(ring.length);
    for (const c of shown) {
      expect(Math.min(Math.abs(c.lng), 360 - Math.abs(c.lng))).toBeLessThan(75);
    }
  });

  it("ranks the most centred city first", () => {
    expect(nearestCities(ring, [1, 0, 0])[0].name).toBe("Ring 180");
  });

  it("follows the camera, so a swing changes which cities carry a label", () => {
    const west = nearestCities(ring, [1, 0, 0]).map((c) => c.name);
    const east = nearestCities(ring, [0, 0, -1]).map((c) => c.name);
    expect(east[0]).not.toBe(west[0]);
  });

  it("breaks a tie between two equally centred cities by population", () => {
    const pair = [
      { name: "Small", lat: 1, lng: 0, pop: 20_000 },
      { name: "Big", lat: -1, lng: 0, pop: 9_000_000 },
    ];
    expect(nearestCities(pair, [1, 0, 0])[0].name).toBe("Big");
  });

  it("respects the render cap", () => {
    expect(nearestCities(ring, [1, 0, 0], 2)).toHaveLength(2);
  });
});

describe("zoomBandForDistance", () => {
  it("splits the distances at the band edges", () => {
    expect(zoomBandForDistance(NEAR_BAND_MAX - 0.01)).toBe("near");
    expect(zoomBandForDistance(NEAR_BAND_MAX)).toBe("mid");
    expect(zoomBandForDistance(MID_BAND_MAX - 0.01)).toBe("mid");
    expect(zoomBandForDistance(MID_BAND_MAX)).toBe("far");
  });
});

describe("selectVisiblePoints", () => {
  it("shows one point per cluster at the landing zoom", () => {
    const points = selectVisiblePoints(earth, INITIAL_CAMERA_DISTANCE);
    expect(points).toHaveLength(earth.length);
    expect(points.every((p) => p.channelId === undefined)).toBe(true);
  });

  it("caps far zoom to the busiest clusters", () => {
    const points = selectVisiblePoints(earth, 3.5);
    expect(points).toHaveLength(FAR_CLUSTER_CAP);
    const ranked = [...earth].sort((a, b) => b.total_viewer_count - a.total_viewer_count);
    expect(points.some((p) => p.clusterId === ranked[0].id)).toBe(true);
    expect(points.some((p) => p.clusterId === ranked[ranked.length - 1].id)).toBe(false);
  });

  it("expands a cluster into its own channels at near zoom", () => {
    const points = selectVisiblePoints(earth, 1.4);
    const expected = earth.reduce((n, c) => n + c.channels.length, 0);
    expect(points).toHaveLength(expected);
    expect(points.every((p) => p.channelId !== undefined)).toBe(true);
  });

  it("never shows fewer points when the camera moves closer", () => {
    let prev = 0;
    for (const d of [3.8, 3.0, 2.5, 2.0, 1.6, 1.3]) {
      const count = selectVisiblePoints(earth, d).length;
      expect(count).toBeGreaterThanOrEqual(prev);
      prev = count;
    }
  });
});
