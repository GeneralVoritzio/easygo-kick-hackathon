import { describe, expect, it } from 'vitest'
import { DISCOVERY_CLUSTERS, DISCOVERY_LANGUAGES } from '../data/discoveryChannels'
import { EMPTY_FILTERS, VIEWER_TIERS, applyDiscoveryFilters, channelMatchesFilters, hasActiveFilters } from './filters'
import type { DiscoveryFilters } from './types'

const f = (overrides: Partial<DiscoveryFilters>): DiscoveryFilters => ({ ...EMPTY_FILTERS, ...overrides })

describe('applyDiscoveryFilters', () => {
  it('returns the input array untouched when no filter is active', () => {
    expect(applyDiscoveryFilters(DISCOVERY_CLUSTERS, EMPTY_FILTERS)).toBe(DISCOVERY_CLUSTERS)
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('keeps only channels of the chosen category and drops empty clusters', () => {
    const filtered = applyDiscoveryFilters(DISCOVERY_CLUSTERS, f({ category: 'Valorant' }))
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.length).toBeLessThan(DISCOVERY_CLUSTERS.length)
    for (const cluster of filtered) {
      expect(cluster.channels.length).toBeGreaterThan(0)
      expect(cluster.channels.every((ch) => ch.category === 'Valorant')).toBe(true)
      // totals must reflect the surviving channels, not the original cluster
      expect(cluster.totalViewers).toBe(cluster.channels.reduce((sum, ch) => sum + ch.viewers, 0))
    }
  })

  it('badge filtering is AND semantics and coheres with the odds', () => {
    const filtered = applyDiscoveryFilters(DISCOVERY_CLUSTERS, f({ badges: ['responsive', 'new_chatter_friendly'] }))
    const channels = filtered.flatMap((c) => c.channels)
    expect(channels.length).toBeGreaterThan(0)
    for (const ch of channels) {
      expect(ch.interaction.badges).toContain('responsive')
      expect(ch.interaction.badges).toContain('new_chatter_friendly')
    }
    // "responsive" alone must match strictly more channels than the AND pair
    const responsiveOnly = applyDiscoveryFilters(DISCOVERY_CLUSTERS, f({ badges: ['responsive'] })).flatMap((c) => c.channels)
    expect(responsiveOnly.length).toBeGreaterThan(channels.length)
  })

  it('viewer tiers respect the documented boundaries', () => {
    for (const [tier, range] of Object.entries(VIEWER_TIERS) as [keyof typeof VIEWER_TIERS, { min: number; max: number }][]) {
      const channels = applyDiscoveryFilters(DISCOVERY_CLUSTERS, f({ viewerTier: tier })).flatMap((c) => c.channels)
      expect(channels.length).toBeGreaterThan(0)
      for (const ch of channels) {
        expect(ch.viewers).toBeGreaterThanOrEqual(range.min)
        expect(ch.viewers).toBeLessThanOrEqual(range.max)
      }
    }
  })

  it('axes combine: category + badge + tier is the intersection', () => {
    const combined = f({ category: 'Just Chatting', badges: ['responsive'], viewerTier: 'mid' })
    for (const ch of applyDiscoveryFilters(DISCOVERY_CLUSTERS, combined).flatMap((c) => c.channels)) {
      expect(channelMatchesFilters(ch, combined)).toBe(true)
      expect(ch.category).toBe('Just Chatting')
      expect(ch.interaction.badges).toContain('responsive')
      expect(ch.viewers).toBeGreaterThanOrEqual(500)
      expect(ch.viewers).toBeLessThanOrEqual(1999)
    }
  })

  it('language filtering matches only that language, and languages track geography', () => {
    const filtered = applyDiscoveryFilters(DISCOVERY_CLUSTERS, f({ language: 'Português' }))
    const channels = filtered.flatMap((c) => c.channels)
    expect(channels.length).toBeGreaterThan(0)
    expect(channels.every((ch) => ch.language === 'Português')).toBe(true)
    // Português only exists where it should: Brazil and Portugal clusters
    expect(filtered.every((c) => c.country === 'Brazil' || c.country === 'Portugal')).toBe(true)

    // every channel's language is a known filter option, and English is global
    for (const ch of DISCOVERY_CLUSTERS.flatMap((c) => c.channels)) {
      expect(DISCOVERY_LANGUAGES).toContain(ch.language)
    }
    const english = applyDiscoveryFilters(DISCOVERY_CLUSTERS, f({ language: 'English' })).flatMap((c) => c.channels)
    expect(english.length).toBeGreaterThan(80)
  })

  it('every generated channel carries a coherent interaction profile', () => {
    for (const ch of DISCOVERY_CLUSTERS.flatMap((c) => c.channels)) {
      expect(ch.interaction.oddsDenominator).toBeGreaterThanOrEqual(3)
      expect(ch.interaction.oddsDenominator).toBeLessThanOrEqual(40)
      if (ch.interaction.badges.includes('responsive') && ch.name !== 'HypeKing') {
        expect(ch.interaction.oddsDenominator).toBeLessThanOrEqual(10)
      }
    }
  })
})
