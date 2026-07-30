import { describe, expect, it } from "vitest";
import { EXPLORE_CHANNELS, EXPLORE_CLUSTERS } from "../mock/explore";
import { BODY_ORDER } from "./bodies";
import {
  channelCountsByBody,
  channelsForFocus,
  clustersForBody,
  isLocationHidden,
  SUN_GROUP_SIZE,
} from "./bodyView";

const ironvow = EXPLORE_CHANNELS.find((c) => c.stream.channel.slug === "ironvow")!;

describe("isLocationHidden", () => {
  it("takes the seeded flag by default, and lets an override win either way", () => {
    expect(isLocationHidden(ironvow, {})).toBe(false);
    expect(isLocationHidden(ironvow, { [ironvow.id]: true })).toBe(true);

    const seededHidden = EXPLORE_CHANNELS.find((c) => c.location_hidden)!;
    expect(isLocationHidden(seededHidden, {})).toBe(true);
    expect(isLocationHidden(seededHidden, { [seededHidden.id]: false })).toBe(false);
  });
});

describe("clustersForBody", () => {
  it("gives each body only its own clusters", () => {
    for (const body of BODY_ORDER) {
      const projected = clustersForBody(EXPLORE_CLUSTERS, body);
      expect(projected.length, body).toBeGreaterThan(0);
      expect(
        projected.every((c) => c.body === body),
        body,
      ).toBe(true);
    }
  });

  it("takes a private streamer off the home body and gathers them on the Sun", () => {
    const earth = clustersForBody(EXPLORE_CLUSTERS, "earth");
    expect(earth.flatMap((c) => c.channels).some((ch) => ch.location_hidden)).toBe(false);

    const sun = clustersForBody(EXPLORE_CLUSTERS, "sun");
    const sunChannels = sun.flatMap((c) => c.channels);
    expect(sunChannels.length).toBeGreaterThan(10);
    expect(sunChannels.every((ch) => ch.location_hidden)).toBe(true);
    for (const pocket of sun) {
      expect(pocket.place).toBe("Private");
      expect(pocket.region).toBe("location hidden");
      expect(pocket.channels.length).toBeLessThanOrEqual(SUN_GROUP_SIZE);
    }
  });

  it("is reversible, and it never mutates the catalog", () => {
    const earthBefore = clustersForBody(EXPLORE_CLUSTERS, "earth");
    const home = earthBefore.find((c) => c.channels.some((ch) => ch.id === ironvow.id))!;

    const overrides = { [ironvow.id]: true };
    const earthAfter = clustersForBody(EXPLORE_CLUSTERS, "earth", overrides);
    const sunAfter = clustersForBody(EXPLORE_CLUSTERS, "sun", overrides);

    expect(
      earthAfter.find((c) => c.id === home.id)!.channels.some((ch) => ch.id === ironvow.id),
    ).toBe(false);

    // The channel itself moves untouched: a Sun pocket carries the position, a channel never does.
    const onSun = sunAfter.flatMap((c) => c.channels).find((ch) => ch.id === ironvow.id)!;
    expect(onSun).toBe(ironvow);
    expect(sunAfter.some((pocket) => pocket.channels.includes(ironvow))).toBe(true);

    const restored = clustersForBody(EXPLORE_CLUSTERS, "earth", { [ironvow.id]: false });
    expect(restored.find((c) => c.id === home.id)!.channels.some((ch) => ch.id === ironvow.id)).toBe(
      true,
    );
  });

  it("keeps the Sun layout stable when one more channel hides", () => {
    const before = clustersForBody(EXPLORE_CLUSTERS, "sun");
    const after = clustersForBody(EXPLORE_CLUSTERS, "sun", { [ironvow.id]: true });
    const shared = Math.min(before.length, after.length);
    for (let i = 0; i < shared; i++) expect(after[i].id).toBe(before[i].id);
    expect(after.flatMap((c) => c.channels).length).toBe(
      before.flatMap((c) => c.channels).length + 1,
    );
  });

  it("returns the same cluster objects when nobody there hides, so a memo holds", () => {
    const marsA = clustersForBody(EXPLORE_CLUSTERS, "mars");
    const marsB = clustersForBody(EXPLORE_CLUSTERS, "mars");
    expect(marsA[0]).toBe(marsB[0]);
  });

  it("gives an empty Sun when nobody hides", () => {
    const noneHidden = EXPLORE_CLUSTERS.map((c) => ({
      ...c,
      channels: c.channels.map((ch) => ({ ...ch, location_hidden: false })),
    }));
    expect(clustersForBody(noneHidden, "sun")).toEqual([]);
  });
});

describe("channelCountsByBody", () => {
  it("counts every channel once, with a hidden one counted on the Sun", () => {
    const counts = channelCountsByBody(EXPLORE_CLUSTERS);
    const total = EXPLORE_CLUSTERS.reduce((n, c) => n + c.channels.length, 0);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(total);
    for (const body of BODY_ORDER) expect(counts[body], body).toBeGreaterThan(0);
  });

  it("moves a count from Earth to the Sun when somebody hides", () => {
    const before = channelCountsByBody(EXPLORE_CLUSTERS);
    const after = channelCountsByBody(EXPLORE_CLUSTERS, { [ironvow.id]: true });
    expect(after.earth).toBe(before.earth - 1);
    expect(after.sun).toBe(before.sun + 1);
  });
});

describe("channelsForFocus", () => {
  const cluster = clustersForBody(EXPLORE_CLUSTERS, "earth").find((c) => c.channels.length >= 3)!;

  it("makes a cluster dot stand for the whole city", () => {
    expect(channelsForFocus(cluster, null)).toBe(cluster.channels);
  });

  it("makes an expanded child dot stand for one stream", () => {
    const target = cluster.channels[1];
    const shown = channelsForFocus(cluster, target.id);
    expect(shown).toHaveLength(1);
    expect(shown[0].id).toBe(target.id);
  });

  it("falls back to the cluster when that channel is filtered away", () => {
    expect(channelsForFocus(cluster, "ch-does-not-exist")).toBe(cluster.channels);
  });
});
