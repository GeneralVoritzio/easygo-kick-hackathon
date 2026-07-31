import { describe, expect, it } from 'vitest'
import { BODIES, BODY_ORDER, orbitRings, sunSpiralPlacement, systemPlacement, systemPosition } from './bodies'
import { latLngToVector3 } from './geo'

describe('body definitions', () => {
  it('covers all four bodies with coherent config', () => {
    expect(BODY_ORDER).toHaveLength(4)
    for (const id of BODY_ORDER) {
      const body = BODIES[id]
      expect(body.id).toBe(id)
      expect(body.texture).toMatch(/^\/textures\//)
      expect(body.name).toBeTruthy()
      expect(body.tagline).toBeTruthy()
    }
    // only Earth has geography to draw
    expect(BODY_ORDER.filter((id) => BODIES[id].hasVectorBorders)).toEqual(['earth'])
    // pale-surfaced bodies must use outlined hotspots or the dots disappear
    for (const id of ['moon', 'mars', 'sun'] as const) expect(BODIES[id].hotspotStyle).toBe('outlined')
    expect(BODIES.earth.hotspotStyle).toBe('solid')
  })
})

describe('systemPosition', () => {
  it('puts the Sun at the centre and the planets on their orbits', () => {
    expect(systemPosition('sun')).toEqual([0, 0, 0])
    const earth = systemPosition('earth')
    const mars = systemPosition('mars')
    expect(Math.hypot(earth[0], earth[1])).toBeGreaterThan(0)
    // Mars sits further out than Earth
    expect(Math.hypot(mars[0], mars[1])).toBeGreaterThan(Math.hypot(earth[0], earth[1]))
  })

  it('places the Moon as a satellite beside Earth, not on its own orbit', () => {
    const earth = systemPosition('earth')
    const moon = systemPosition('moon')
    const gap = Math.hypot(moon[0] - earth[0], moon[1] - earth[1])
    expect(systemPlacement('moon').satelliteOf).toBe('earth')
    // close enough to read as a pair, far enough not to overlap
    expect(gap).toBeGreaterThan(0.5)
    expect(gap).toBeLessThan(1.5)
  })

  it('gives every body a distinct position', () => {
    const seen = BODY_ORDER.map((id) => systemPosition(id).join(','))
    expect(new Set(seen).size).toBe(BODY_ORDER.length)
  })

  it('draws one guide ring per real orbit, innermost first', () => {
    const rings = orbitRings()
    expect(rings).toHaveLength(2) // Earth's and Mars's; the Moon shares Earth's
    expect(rings[0]).toBeLessThan(rings[1])
  })
})

describe('sunSpiralPlacement', () => {
  it('is deterministic', () => {
    expect(sunSpiralPlacement(7, 30)).toEqual(sunSpiralPlacement(7, 30))
  })

  it('stays in valid lat/lng range and off the poles', () => {
    for (let i = 0; i < 40; i++) {
      const { lat, lng } = sunSpiralPlacement(i, 40)
      expect(Math.abs(lat)).toBeLessThanOrEqual(67) // asin(0.92) ≈ 66.9°
      expect(Math.abs(lng)).toBeLessThanOrEqual(180)
    }
  })

  it('spreads points apart rather than clumping', () => {
    const total = 24
    const points = Array.from({ length: total }, (_, i) => {
      const { lat, lng } = sunSpiralPlacement(i, total)
      return latLngToVector3(lat, lng)
    })
    let min = Infinity
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1], points[i][2] - points[j][2])
        min = Math.min(min, d)
      }
    }
    // on a unit sphere, 24 evenly spread points sit well apart
    expect(min).toBeGreaterThan(0.25)
  })

  it('handles the degenerate single-channel case', () => {
    expect(sunSpiralPlacement(0, 1)).toEqual({ lat: 0, lng: 0 })
  })
})
