import { describe, expect, it } from "vitest";
import {
  buildExploreCatalog,
  EXPLORE_CHANNELS,
  EXPLORE_CLUSTERS,
  EXPLORE_COUNTRIES,
} from "./explore";
import { liveStreamFor } from "./api";

const byBody = (body: string) => EXPLORE_CLUSTERS.filter((c) => c.body === body);

describe("explore catalog", () => {
  it("holds one cluster per country, and no country swamps the map", () => {
    const earth = byBody("earth");
    expect(earth.length).toBe(EXPLORE_COUNTRIES.length);
    expect(new Set(earth.map((c) => c.place)).size).toBe(earth.length);
    for (const cluster of earth) {
      expect(cluster.channels.length, cluster.place).toBeGreaterThanOrEqual(3);
      expect(cluster.channels.length, cluster.place).toBeLessThanOrEqual(12);
    }
    expect(EXPLORE_CHANNELS.length).toBeGreaterThanOrEqual(200);
    expect(EXPLORE_CHANNELS.length).toBeLessThanOrEqual(500);
  });

  it("never carries a position finer than a country", () => {
    for (const ch of EXPLORE_CHANNELS) {
      expect(Object.keys(ch)).not.toContain("lat");
      expect(Object.keys(ch)).not.toContain("lng");
    }
    // Every coordinate on the map belongs to a cluster, and a cluster is a country or a relay site.
    for (const cluster of EXPLORE_CLUSTERS) {
      expect(Math.abs(cluster.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(cluster.lng)).toBeLessThanOrEqual(180);
      expect(cluster.place).toBeTruthy();
      expect(cluster.region).toBeTruthy();
    }
  });

  it("covers the three real bodies, and never seeds the Sun", () => {
    expect(byBody("moon")).toHaveLength(8);
    expect(byBody("mars")).toHaveLength(6);
    expect(byBody("sun")).toHaveLength(0);
    for (const cluster of EXPLORE_CLUSTERS) {
      for (const ch of cluster.channels) {
        expect(ch.body, `${ch.stream.channel.username} in ${cluster.id}`).toBe(cluster.body);
      }
    }
  });

  it("flags a minority of Earth streamers as location private, and leaves them in place", () => {
    const earth = byBody("earth").flatMap((c) => c.channels);
    const hidden = earth.filter((ch) => ch.location_hidden);
    expect(hidden.length / earth.length).toBeGreaterThan(0.05);
    expect(hidden.length / earth.length).toBeLessThan(0.2);
    const relays = [...byBody("moon"), ...byBody("mars")].flatMap((c) => c.channels);
    expect(relays.every((ch) => !ch.location_hidden)).toBe(true);
  });

  it("gives every relay channel a real agency and a real instrument", () => {
    const relays = [...byBody("moon"), ...byBody("mars")].flatMap((c) => c.channels);
    expect(relays.length).toBeGreaterThan(20);
    for (const ch of relays) {
      expect(ch.relay, ch.stream.channel.username).toBeDefined();
      expect(ch.relay!.agency).toBeTruthy();
      expect(ch.relay!.instrument).toBeTruthy();
      expect(ch.location_hidden).toBe(false);
    }
    expect(byBody("earth").flatMap((c) => c.channels).every((ch) => ch.relay === undefined)).toBe(true);
  });

  it("is deterministic for a fixed seed", () => {
    expect(buildExploreCatalog()).toEqual(buildExploreCatalog());
  });

  it("has unique ids, slugs and usernames", () => {
    const ids = new Set(EXPLORE_CHANNELS.map((c) => c.id));
    const names = new Set(EXPLORE_CHANNELS.map((c) => c.stream.channel.username));
    const slugs = new Set(EXPLORE_CHANNELS.map((c) => c.stream.channel.slug));
    expect(ids.size).toBe(EXPLORE_CHANNELS.length);
    expect(names.size).toBe(EXPLORE_CHANNELS.length);
    expect(slugs.size).toBe(EXPLORE_CHANNELS.length);
  });

  it("puts every demo livestream on the map, unchanged", () => {
    for (const slug of ["ironvow", "chartfairy", "wanderfuse", "notadoc", "spinvicar"]) {
      const stream = liveStreamFor(slug);
      const ch = EXPLORE_CHANNELS.find((c) => c.stream.channel.slug === slug);
      expect(ch, slug).toBeDefined();
      expect(ch!.stream).toBe(stream);
      expect(ch!.body).toBe("earth");
      expect(ch!.location_hidden).toBe(false);
    }
  });

  it("only uses a language and a category the rest of the demo also uses", () => {
    const languages = new Set(EXPLORE_CHANNELS.map((c) => c.stream.language));
    for (const language of languages) expect(language).toMatch(/^[A-Z][a-z]+$/);
    const slugs = new Set(EXPLORE_CHANNELS.map((c) => c.stream.category.slug));
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("puts every country anchor on its own spot", () => {
    const seats = byBody("earth").map((c) => `${c.lat},${c.lng}`);
    expect(new Set(seats).size).toBe(seats.length);
  });
});
