import { describe, expect, it } from "vitest";
import { buildExploreCatalog, EXPLORE_CHANNELS, EXPLORE_CLUSTERS } from "./explore";
import { liveStreamFor } from "./api";

const byBody = (body: string) => EXPLORE_CLUSTERS.filter((c) => c.body === body);

describe("explore catalog", () => {
  it("keeps Earth the bulk of the map, at 200 to 320 channels total", () => {
    const earth = byBody("earth");
    expect(earth.length).toBeGreaterThanOrEqual(50);
    expect(earth.length).toBeLessThanOrEqual(100);
    for (const cluster of EXPLORE_CLUSTERS) {
      expect(cluster.channels.length).toBeGreaterThanOrEqual(1);
      expect(cluster.channels.length).toBeLessThanOrEqual(5);
    }
    expect(EXPLORE_CHANNELS.length).toBeGreaterThanOrEqual(200);
    expect(EXPLORE_CHANNELS.length).toBeLessThanOrEqual(320);
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
    expect(hidden.every((ch) => Number.isFinite(ch.lat) && Number.isFinite(ch.lng))).toBe(true);
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

  it("spreads the channels in a cluster far enough apart to pick one by hover", () => {
    for (const cluster of EXPLORE_CLUSTERS) {
      for (let i = 0; i < cluster.channels.length; i++) {
        for (let j = i + 1; j < cluster.channels.length; j++) {
          const a = cluster.channels[i];
          const b = cluster.channels[j];
          const dLat = a.lat - b.lat;
          const dLng = (a.lng - b.lng) * Math.cos((cluster.lat * Math.PI) / 180);
          const label = `${a.stream.channel.username} vs ${b.stream.channel.username} in ${cluster.city}`;
          expect(Math.hypot(dLat, dLng), label).toBeGreaterThan(0.5);
        }
      }
    }
  });

  it("keeps every coordinate on the globe", () => {
    for (const ch of EXPLORE_CHANNELS) {
      expect(Math.abs(ch.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(ch.lng)).toBeLessThanOrEqual(181);
    }
  });
});
