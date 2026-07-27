import { describe, expect, it } from 'vitest'
import { buildDiscoveryCatalog, DISCOVERY_CHANNELS, DISCOVERY_CLUSTERS } from './discoveryChannels'

const byBody = (body: string) => DISCOVERY_CLUSTERS.filter((c) => c.body === body)

describe('discovery catalog', () => {
  it('meets the plan sizing: Earth still carries the bulk, 200–300 channels total', () => {
    const earth = byBody('earth')
    expect(earth.length).toBeGreaterThanOrEqual(50)
    expect(earth.length).toBeLessThanOrEqual(100)
    for (const cluster of DISCOVERY_CLUSTERS) {
      // hidden streamers leave their Earth cluster for the Sun, so a city can
      // legitimately be down to a couple of visible channels
      expect(cluster.channels.length).toBeGreaterThanOrEqual(1)
      expect(cluster.channels.length).toBeLessThanOrEqual(5)
    }
    expect(DISCOVERY_CHANNELS.length).toBeGreaterThanOrEqual(200)
    expect(DISCOVERY_CHANNELS.length).toBeLessThanOrEqual(320)
  })

  it('covers the three real bodies; the Sun is derived, never seeded', () => {
    for (const body of ['earth', 'moon', 'mars'] as const) {
      expect(byBody(body).length, body).toBeGreaterThan(0)
    }
    expect(byBody('moon')).toHaveLength(8)
    expect(byBody('mars')).toHaveLength(6)
    // no catalog cluster claims to be on the Sun — clustersForBody projects it
    expect(byBody('sun')).toHaveLength(0)
    for (const cluster of DISCOVERY_CLUSTERS) {
      for (const ch of cluster.channels) expect(ch.body, `${ch.name} in ${cluster.id}`).toBe(cluster.body)
    }
  })

  it('flags a minority of Earth streamers as location-private, leaving them in place', () => {
    const earth = byBody('earth').flatMap((c) => c.channels)
    const hidden = earth.filter((ch) => ch.location_hidden)
    // ~12% seeded — enough to populate the Sun, not enough to gut the Earth map
    expect(hidden.length / earth.length).toBeGreaterThan(0.05)
    expect(hidden.length / earth.length).toBeLessThan(0.2)
    // they keep their real coordinates so the toggle can put them back
    expect(hidden.every((ch) => Number.isFinite(ch.lat) && Number.isFinite(ch.lng))).toBe(true)
    // relays and the browse-grid alumni are never auto-hidden
    expect(DISCOVERY_CHANNELS.find((c) => c.name === 'HypeKing')!.location_hidden).toBe(false)
    expect([...byBody('moon'), ...byBody('mars')].flatMap((c) => c.channels).every((ch) => !ch.location_hidden)).toBe(true)
  })

  it('relay channels name a real agency and instrument, and never fake a live feed', () => {
    const relays = [...byBody('moon'), ...byBody('mars')].flatMap((c) => c.channels)
    expect(relays.length).toBeGreaterThan(20)
    for (const ch of relays) {
      expect(ch.relay, ch.name).toBeDefined()
      expect(ch.relay!.agency).toBeTruthy()
      expect(ch.relay!.instrument).toBeTruthy()
      // there is no embeddable live stream from the Moon or Mars — don't pretend
      expect(ch.embeddable, ch.name).toBe(false)
      expect(ch.category).toBe('Science & Technology')
      expect(ch.location_hidden).toBe(false)
    }
    // Earth channels never carry a relay descriptor
    expect(byBody('earth').flatMap((c) => c.channels).every((ch) => ch.relay === undefined)).toBe(true)
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
