import { describe, expect, it } from 'vitest'
import { buildDiscoveryCatalog, DISCOVERY_CHANNELS, DISCOVERY_CLUSTERS } from './discoveryChannels'

describe('discovery catalog', () => {
  it('meets the plan sizing: ~72 clusters of 3–5 channels, 200–300 channels total', () => {
    expect(DISCOVERY_CLUSTERS.length).toBeGreaterThanOrEqual(50)
    expect(DISCOVERY_CLUSTERS.length).toBeLessThanOrEqual(100)
    for (const cluster of DISCOVERY_CLUSTERS) {
      expect(cluster.channels.length).toBeGreaterThanOrEqual(3)
      expect(cluster.channels.length).toBeLessThanOrEqual(5)
    }
    expect(DISCOVERY_CHANNELS.length).toBeGreaterThanOrEqual(200)
    expect(DISCOVERY_CHANNELS.length).toBeLessThanOrEqual(300)
  })

  it('is fully deterministic for a fixed seed', () => {
    expect(buildDiscoveryCatalog()).toEqual(buildDiscoveryCatalog())
  })

  it('has unique ids and unique names', () => {
    const ids = new Set(DISCOVERY_CHANNELS.map((c) => c.id))
    const names = new Set(DISCOVERY_CHANNELS.map((c) => c.name))
    expect(ids.size).toBe(DISCOVERY_CHANNELS.length)
    expect(names.size).toBe(DISCOVERY_CHANNELS.length)
  })

  it('keeps the browse-grid alumni playable via the demo slug', () => {
    for (const name of ['HypeKing', 'NovaStrikes', 'LootGoblin', 'ClipFarmer', 'PixelPunk']) {
      const ch = DISCOVERY_CHANNELS.find((c) => c.name === name)
      expect(ch, name).toBeDefined()
      expect(ch!.embeddable).toBe(true)
      expect(ch!.kickSlug).toBe('maxholloway')
    }
  })

  it('spreads a cluster\'s channels far enough apart to hover-pick individually', () => {
    for (const cluster of DISCOVERY_CLUSTERS) {
      for (let i = 0; i < cluster.channels.length; i++) {
        for (let j = i + 1; j < cluster.channels.length; j++) {
          const a = cluster.channels[i]
          const b = cluster.channels[j]
          // separation in visual degrees (longitude compressed by cos lat)
          const dLat = a.lat - b.lat
          const dLng = (a.lng - b.lng) * Math.cos((cluster.lat * Math.PI) / 180)
          expect(Math.hypot(dLat, dLng), `${a.name} vs ${b.name} in ${cluster.city}`).toBeGreaterThan(0.5)
        }
      }
    }
  })

  it('keeps coordinates on the globe', () => {
    for (const ch of DISCOVERY_CHANNELS) {
      expect(Math.abs(ch.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(ch.lng)).toBeLessThanOrEqual(181)
    }
  })
})
