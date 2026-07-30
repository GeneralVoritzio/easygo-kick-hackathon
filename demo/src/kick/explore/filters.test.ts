import { describe, expect, it } from "vitest";
import { EXPLORE_CLUSTERS, EXPLORE_LANGUAGES } from "../mock/explore";
import {
  applyExploreFilters,
  channelMatchesFilters,
  EMPTY_FILTERS,
  hasActiveFilters,
  VIEWER_TIERS,
} from "./filters";
import type { ExploreFilters } from "./types";

const f = (overrides: Partial<ExploreFilters>): ExploreFilters => ({
  ...EMPTY_FILTERS,
  ...overrides,
});

const allChannels = EXPLORE_CLUSTERS.flatMap((c) => c.channels);

describe("applyExploreFilters", () => {
  it("returns the input array untouched when no filter is active", () => {
    expect(applyExploreFilters(EXPLORE_CLUSTERS, EMPTY_FILTERS)).toBe(EXPLORE_CLUSTERS);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it("keeps only the chosen country, and recomputes the total it shows", () => {
    const filtered = applyExploreFilters(EXPLORE_CLUSTERS, f({ country: "Japan" }));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].place).toBe("Japan");
    expect(filtered[0].total_viewer_count).toBe(
      filtered[0].channels.reduce((sum, ch) => sum + ch.stream.viewer_count, 0),
    );
  });

  it("can never find a streamer who hides, because a Sun pocket has no country", () => {
    const sun = EXPLORE_CLUSTERS.map((c) => ({ ...c, body: "sun" as const }));
    for (const country of ["Japan", "United States", "Brazil"]) {
      expect(applyExploreFilters(sun, f({ country })), country).toEqual([]);
    }
  });

  it("filters badges with AND semantics", () => {
    const both = f({ badges: ["responsive", "new_chatter_friendly"] });
    const channels = applyExploreFilters(EXPLORE_CLUSTERS, both).flatMap((c) => c.channels);
    expect(channels.length).toBeGreaterThan(0);
    for (const ch of channels) {
      expect(ch.interaction.badges).toContain("responsive");
      expect(ch.interaction.badges).toContain("new_chatter_friendly");
    }
    const responsiveOnly = applyExploreFilters(EXPLORE_CLUSTERS, f({ badges: ["responsive"] }))
      .flatMap((c) => c.channels);
    expect(responsiveOnly.length).toBeGreaterThan(channels.length);
  });

  it("respects the viewer tier boundaries", () => {
    for (const [tier, range] of Object.entries(VIEWER_TIERS) as [
      keyof typeof VIEWER_TIERS,
      { min: number; max: number },
    ][]) {
      const channels = applyExploreFilters(EXPLORE_CLUSTERS, f({ viewerTier: tier })).flatMap(
        (c) => c.channels,
      );
      expect(channels.length, tier).toBeGreaterThan(0);
      for (const ch of channels) {
        expect(ch.stream.viewer_count).toBeGreaterThanOrEqual(range.min);
        expect(ch.stream.viewer_count).toBeLessThanOrEqual(range.max);
      }
    }
  });

  it("intersects the axes", () => {
    const combined = f({ language: "English", badges: ["responsive"], viewerTier: "mid" });
    for (const ch of applyExploreFilters(EXPLORE_CLUSTERS, combined).flatMap((c) => c.channels)) {
      expect(channelMatchesFilters(ch, combined)).toBe(true);
      expect(ch.stream.language).toBe("English");
      expect(ch.interaction.badges).toContain("responsive");
      expect(ch.stream.viewer_count).toBeGreaterThanOrEqual(500);
      expect(ch.stream.viewer_count).toBeLessThanOrEqual(1999);
    }
  });

  it("matches one language only, and a language tracks the geography", () => {
    const filtered = applyExploreFilters(EXPLORE_CLUSTERS, f({ language: "Portuguese" }));
    const channels = filtered.flatMap((c) => c.channels);
    expect(channels.length).toBeGreaterThan(0);
    expect(channels.every((ch) => ch.stream.language === "Portuguese")).toBe(true);
    expect(
      filtered.every((c) => c.place === "Brazil" || c.place === "Portugal" || c.body === "sun"),
    ).toBe(true);
    expect(filtered.some((c) => c.body === "earth")).toBe(true);

    for (const ch of allChannels) expect(EXPLORE_LANGUAGES).toContain(ch.stream.language);
    const english = applyExploreFilters(EXPLORE_CLUSTERS, f({ language: "English" })).flatMap(
      (c) => c.channels,
    );
    expect(english.length).toBeGreaterThan(80);
  });

  it("gives every channel a coherent interaction profile", () => {
    for (const ch of allChannels) {
      expect(ch.interaction.odds_denominator).toBeGreaterThanOrEqual(3);
      expect(ch.interaction.odds_denominator).toBeLessThanOrEqual(40);
      if (ch.interaction.badges.includes("responsive")) {
        expect(ch.interaction.odds_denominator).toBeLessThanOrEqual(15);
      }
    }
  });
});
