import { describe, expect, it } from 'vitest'
import {
  FAR_CLUSTER_CAP,
  GLOBE_RADIUS,
  INITIAL_CAMERA_DISTANCE,
  MAX_CAMERA_DISTANCE,
  MID_BAND_MAX,
  MIN_CAMERA_DISTANCE,
  NEAR_BAND_MAX,
  latLngToVector3,
  pointScaleForDistance,
  selectVisiblePoints,
  zoomBandForDistance,
} from './geo'
import type { DiscoveryChannel, DiscoveryCluster } from './types'

function mockCluster(id: number, channelCount: number, viewersEach: number): DiscoveryCluster {
  const lat = id * 2 - 40
  const lng = id * 3 - 90
  const channels: DiscoveryChannel[] = Array.from({ length: channelCount }, (_, i) => ({
    id: `c${id}-ch${i}`,
    name: `Streamer${id}_${i}`,
    kickSlug: `streamer${id}${i}`,
    category: 'Just Chatting',
    language: 'English',
    viewers: viewersEach,
    lat: lat + i * 0.1,
    lng: lng + i * 0.1,
    thumbnail: { seed: `c${id}-ch${i}`, gradient: 'linear-gradient(135deg,#000,#111)', initials: 'ST' },
    embeddable: false,
    interaction: { oddsDenominator: 10, badges: [] },
  }))
  return {
    id: `c${id}`,
    city: `City ${id}`,
    country: 'Nowhere',
    lat,
    lng,
    channels,
    totalViewers: channelCount * viewersEach,
  }
}

describe('latLngToVector3', () => {
  it('maps the poles and the reference meridian to the sphere axes', () => {
    const [nx, ny, nz] = latLngToVector3(90, 0)
    expect(nx).toBeCloseTo(0)
    expect(ny).toBeCloseTo(GLOBE_RADIUS)
    expect(nz).toBeCloseTo(0)

    const [gx, gy, gz] = latLngToVector3(0, 0)
    expect(gx).toBeCloseTo(GLOBE_RADIUS)
    expect(gy).toBeCloseTo(0)
    expect(gz).toBeCloseTo(0)

    // 90°E sits a quarter turn towards −Z (three.js SphereGeometry UV layout)
    const [ex, , ez] = latLngToVector3(0, 90)
    expect(ex).toBeCloseTo(0)
    expect(ez).toBeCloseTo(-GLOBE_RADIUS)
  })

  it('always lands on the sphere surface', () => {
    for (const [lat, lng] of [[37.77, -122.42], [-33.87, 151.21], [65, 179], [-89, -1]]) {
      const [x, y, z] = latLngToVector3(lat, lng, 3)
      expect(Math.hypot(x, y, z)).toBeCloseTo(3)
    }
  })
})

describe('pointScaleForDistance', () => {
  it('is exactly 1 at the landing distance', () => {
    expect(pointScaleForDistance(INITIAL_CAMERA_DISTANCE)).toBe(1)
  })

  it('shrinks dots as the camera closes in, so expanded points stay pickable', () => {
    let prev = Infinity
    for (const d of [MAX_CAMERA_DISTANCE, 3, 2.2, 1.8, 1.5, MIN_CAMERA_DISTANCE]) {
      const s = pointScaleForDistance(d)
      expect(s).toBeLessThanOrEqual(prev)
      prev = s
    }
    // near band must be meaningfully smaller than the landing size
    expect(pointScaleForDistance(1.5)).toBeLessThan(0.5)
  })

  it('clamps at both extremes', () => {
    expect(pointScaleForDistance(MIN_CAMERA_DISTANCE)).toBeGreaterThanOrEqual(0.22)
    expect(pointScaleForDistance(100)).toBeLessThanOrEqual(1.4)
  })
})

describe('zoomBandForDistance', () => {
  it('splits distances at the documented band edges', () => {
    expect(zoomBandForDistance(NEAR_BAND_MAX - 0.01)).toBe('near')
    expect(zoomBandForDistance(NEAR_BAND_MAX)).toBe('mid')
    expect(zoomBandForDistance(MID_BAND_MAX - 0.01)).toBe('mid')
    expect(zoomBandForDistance(MID_BAND_MAX)).toBe('far')
  })
})

describe('selectVisiblePoints', () => {
  const clusters = Array.from({ length: 72 }, (_, i) => mockCluster(i, 3 + (i % 3), 100 + i))

  it('shows one point per cluster at the landing (mid) zoom', () => {
    const points = selectVisiblePoints(clusters, 2.2)
    expect(points).toHaveLength(72)
    expect(points.every((p) => p.channelId === undefined)).toBe(true)
  })

  it('caps far zoom to the busiest clusters', () => {
    const points = selectVisiblePoints(clusters, 3.5)
    expect(points).toHaveLength(FAR_CLUSTER_CAP)
    // busiest cluster (highest totalViewers = last one) must survive the cut
    expect(points.some((p) => p.clusterId === 'c71')).toBe(true)
    // quietest must not
    expect(points.some((p) => p.clusterId === 'c0')).toBe(false)
  })

  it('expands clusters into individual channels at near zoom', () => {
    const points = selectVisiblePoints(clusters, 1.4)
    const expected = clusters.reduce((n, c) => n + c.channels.length, 0)
    expect(points).toHaveLength(expected)
    expect(points.every((p) => p.channelId !== undefined)).toBe(true)
  })

  it('never shows fewer points when the camera moves closer', () => {
    let prev = 0
    for (const d of [3.8, 3.0, 2.5, 2.0, 1.6, 1.3]) {
      const count = selectVisiblePoints(clusters, d).length
      expect(count).toBeGreaterThanOrEqual(prev)
      prev = count
    }
  })
})
