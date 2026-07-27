import { describe, expect, it } from 'vitest'
import { DISCOVERY_CLUSTERS } from '../data/discoveryChannels'
import { SUN_GROUP_SIZE, channelCountsByBody, clustersForBody, isLocationHidden } from './bodyView'
import { BODY_ORDER } from './bodies'

const hypeKing = DISCOVERY_CLUSTERS.flatMap((c) => c.channels).find((c) => c.name === 'HypeKing')!

describe('isLocationHidden', () => {
  it('takes the seeded flag by default and lets an override win either way', () => {
    expect(isLocationHidden(hypeKing, {})).toBe(false)
    expect(isLocationHidden(hypeKing, { [hypeKing.id]: true })).toBe(true)

    const seededHidden = DISCOVERY_CLUSTERS.flatMap((c) => c.channels).find((c) => c.location_hidden)!
    expect(isLocationHidden(seededHidden, {})).toBe(true)
    expect(isLocationHidden(seededHidden, { [seededHidden.id]: false })).toBe(false)
  })
})

describe('clustersForBody', () => {
  it('gives each body only its own clusters', () => {
    for (const body of BODY_ORDER) {
      const projected = clustersForBody(DISCOVERY_CLUSTERS, body)
      expect(projected.length, body).toBeGreaterThan(0)
      expect(projected.every((c) => c.body === body), body).toBe(true)
    }
  })

  it('hides private streamers from their home body and gathers them on the Sun', () => {
    const earth = clustersForBody(DISCOVERY_CLUSTERS, 'earth')
    expect(earth.flatMap((c) => c.channels).some((ch) => ch.location_hidden)).toBe(false)

    const sun = clustersForBody(DISCOVERY_CLUSTERS, 'sun')
    const sunChannels = sun.flatMap((c) => c.channels)
    expect(sunChannels.length).toBeGreaterThan(10)
    expect(sunChannels.every((ch) => ch.location_hidden)).toBe(true)
    for (const pocket of sun) {
      expect(pocket.city).toBe('Private')
      expect(pocket.country).toBe('location hidden')
      expect(pocket.channels.length).toBeLessThanOrEqual(SUN_GROUP_SIZE)
    }
  })

  it('is reversible: toggling HypeKing moves them to the Sun and back, unmutated', () => {
    const earthBefore = clustersForBody(DISCOVERY_CLUSTERS, 'earth')
    const homeCluster = earthBefore.find((c) => c.channels.some((ch) => ch.id === hypeKing.id))!
    const originalCoords = { lat: hypeKing.lat, lng: hypeKing.lng }

    const overrides = { [hypeKing.id]: true }
    const earthAfter = clustersForBody(DISCOVERY_CLUSTERS, 'earth', overrides)
    const sunAfter = clustersForBody(DISCOVERY_CLUSTERS, 'sun', overrides)

    // gone from San Francisco…
    expect(earthAfter.find((c) => c.id === homeCluster.id)!.channels.some((ch) => ch.id === hypeKing.id)).toBe(false)
    // …and present on the Sun, with solar coordinates rather than its own
    const onSun = sunAfter.flatMap((c) => c.channels).find((ch) => ch.id === hypeKing.id)!
    expect(onSun).toBeDefined()
    expect(onSun.lat === originalCoords.lat && onSun.lng === originalCoords.lng).toBe(false)

    // the catalog itself is untouched, so flipping back restores everything
    expect(hypeKing.lat).toBe(originalCoords.lat)
    expect(hypeKing.lng).toBe(originalCoords.lng)
    const earthRestored = clustersForBody(DISCOVERY_CLUSTERS, 'earth', { [hypeKing.id]: false })
    expect(earthRestored.find((c) => c.id === homeCluster.id)!.channels.some((ch) => ch.id === hypeKing.id)).toBe(true)
  })

  it('keeps the Sun layout stable when one extra channel hides', () => {
    const before = clustersForBody(DISCOVERY_CLUSTERS, 'sun')
    const after = clustersForBody(DISCOVERY_CLUSTERS, 'sun', { [hypeKing.id]: true })
    // pocket count may grow by one, but existing pocket seats keep their places
    const shared = Math.min(before.length, after.length)
    for (let i = 0; i < shared; i++) {
      expect(after[i].id).toBe(before[i].id)
    }
    expect(after.flatMap((c) => c.channels).length).toBe(before.flatMap((c) => c.channels).length + 1)
  })

  it('returns the same cluster objects when nothing is hidden there (memo-friendly)', () => {
    const marsA = clustersForBody(DISCOVERY_CLUSTERS, 'mars')
    const marsB = clustersForBody(DISCOVERY_CLUSTERS, 'mars')
    expect(marsA[0]).toBe(marsB[0])
  })

  it('yields an empty Sun when nobody is hiding', () => {
    const noneHidden = DISCOVERY_CLUSTERS.map((c) => ({
      ...c,
      channels: c.channels.map((ch) => ({ ...ch, location_hidden: false })),
    }))
    expect(clustersForBody(noneHidden, 'sun')).toEqual([])
  })
})

describe('channelCountsByBody', () => {
  it('accounts for every channel exactly once, with hidden ones counted on the Sun', () => {
    const counts = channelCountsByBody(DISCOVERY_CLUSTERS)
    const total = DISCOVERY_CLUSTERS.reduce((n, c) => n + c.channels.length, 0)
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(total)
    for (const body of BODY_ORDER) expect(counts[body], body).toBeGreaterThan(0)
  })

  it('moves a count from Earth to the Sun when someone hides', () => {
    const before = channelCountsByBody(DISCOVERY_CLUSTERS)
    const after = channelCountsByBody(DISCOVERY_CLUSTERS, { [hypeKing.id]: true })
    expect(after.earth).toBe(before.earth - 1)
    expect(after.sun).toBe(before.sun + 1)
  })
})
