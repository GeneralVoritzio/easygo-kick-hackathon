#!/usr/bin/env node
/**
 * Author-time preprocessing for the Discovery globe's vector geography.
 *
 * Fetches public-domain Natural Earth derivatives and emits compact polyline
 * JSON into public/geo/. Doing it here rather than at runtime means:
 *   - no topojson decoder in the app bundle,
 *   - a fraction of the download size (only the coordinates we draw),
 *   - and the demo works offline, since the output is committed.
 *
 * Run:  node scripts/build-geo.mjs
 *
 * Sources (all public domain / Natural Earth):
 *   world-atlas         → country borders (TopoJSON, 110m coarse + 50m fine)
 *   natural-earth-vector → admin-1 state/province borders, populated places
 */

import { mkdir, writeFile } from 'node:fs/promises'

const OUT_DIR = new URL('../public/geo/', import.meta.url)

const SOURCES = {
  countriesCoarse: 'https://unpkg.com/world-atlas@2/countries-110m.json',
  countriesFine: 'https://unpkg.com/world-atlas@2/countries-50m.json',
  // the *_lines* variant is border lines rather than polygons: global coverage,
  // no shared edges drawn twice. (The 110m states file only covers the USA.)
  admin1: 'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_1_states_provinces_lines.geojson',
  cities: 'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_populated_places_simple.geojson',
}

/** how many decimal places of lat/lng to keep — ~1km at 2dp, plenty at globe scale */
const PRECISION = 2
const round = (n) => Number(n.toFixed(PRECISION))

/**
 * Ramer–Douglas–Peucker in degrees. The camera never gets closer than ~1.25
 * globe radii, so sub-tolerance wiggles can't be resolved on screen — dropping
 * them is free, and it takes the fine border set from ~1MB to a third of that.
 */
function simplify(points, tolerance) {
  if (points.length < 3) return points
  const sqTol = tolerance * tolerance
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]

  while (stack.length) {
    const [first, last] = stack.pop()
    let maxSq = 0
    let index = 0
    const [ax, ay] = points[first]
    const [bx, by] = points[last]
    const dx = bx - ax
    const dy = by - ay
    const lenSq = dx * dx + dy * dy

    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i]
      let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq
      t = Math.max(0, Math.min(1, t))
      const cx = ax + t * dx - px
      const cy = ay + t * dy - py
      const sq = cx * cx + cy * cy
      if (sq > maxSq) {
        maxSq = sq
        index = i
      }
    }

    if (maxSq > sqTol && index > 0) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  return points.filter((_, i) => keep[i])
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.json()
}

/* ---------- TopoJSON: just enough of the spec to walk arcs ---------- */

/** delta-decode a TopoJSON arc into absolute [lng, lat] pairs */
function decodeArc(topology, arcIndex) {
  const { scale, translate } = topology.transform ?? { scale: [1, 1], translate: [0, 0] }
  const arc = topology.arcs[arcIndex]
  let x = 0
  let y = 0
  return arc.map(([dx, dy]) => {
    x += dx
    y += dy
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]]
  })
}

/**
 * Every arc in the topology, once. Country polygons share arcs along shared
 * borders, so drawing arcs (rather than polygon rings) halves the line count
 * and avoids double-drawing every land frontier.
 */
function arcsAsPolylines(topology) {
  return topology.arcs.map((_, i) =>
    decodeArc(topology, i).map(([lng, lat]) => [round(lat), round(lng)]),
  )
}

/* ---------- GeoJSON ---------- */

function geoJsonLines(geojson) {
  const lines = []
  const pushRing = (ring) => {
    if (ring.length > 1) lines.push(ring.map(([lng, lat]) => [round(lat), round(lng)]))
  }
  for (const feature of geojson.features ?? []) {
    const g = feature.geometry
    if (!g) continue
    if (g.type === 'Polygon') g.coordinates.forEach(pushRing)
    else if (g.type === 'MultiPolygon') g.coordinates.forEach((poly) => poly.forEach(pushRing))
    else if (g.type === 'LineString') pushRing(g.coordinates)
    else if (g.type === 'MultiLineString') g.coordinates.forEach(pushRing)
  }
  return lines
}

/**
 * Flatten polylines to a single number array with segment lengths alongside, so
 * the runtime can build one BufferGeometry without parsing nested arrays:
 *   { lengths: [n1, n2, ...], coords: [lat, lng, lat, lng, ...] }
 */
function packLines(lines, tolerance = 0) {
  const lengths = []
  const coords = []
  for (const raw of lines) {
    const line = tolerance > 0 ? simplify(raw, tolerance) : raw
    if (line.length < 2) continue
    lengths.push(line.length)
    for (const [lat, lng] of line) coords.push(lat, lng)
  }
  return { lengths, coords }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const write = async (name, data) => {
    const json = JSON.stringify(data)
    await writeFile(new URL(name, OUT_DIR), json)
    const kb = (Buffer.byteLength(json) / 1024).toFixed(0)
    console.log(`  ${name.padEnd(30)} ${kb} KB`)
  }

  console.log('fetching + packing vector geography…')

  const coarse = await fetchJson(SOURCES.countriesCoarse)
  await write('borders-countries-coarse.json', packLines(arcsAsPolylines(coarse), 0.08))

  const fine = await fetchJson(SOURCES.countriesFine)
  await write('borders-countries-fine.json', packLines(arcsAsPolylines(fine), 0.03))

  const admin1 = await fetchJson(SOURCES.admin1)
  await write('borders-admin1.json', packLines(geoJsonLines(admin1), 0.05))

  // cities are points, not boundaries: name + position + population, biggest
  // first, so the runtime can take the top N for the current zoom
  const cities = await fetchJson(SOURCES.cities)
  const points = (cities.features ?? [])
    .map((f) => ({
      name: f.properties?.name ?? f.properties?.nameascii ?? '',
      lat: round(f.geometry.coordinates[1]),
      lng: round(f.geometry.coordinates[0]),
      pop: Math.round(f.properties?.pop_max ?? 0),
    }))
    .filter((c) => c.name && c.pop > 0)
    .sort((a, b) => b.pop - a.pop)
    .slice(0, 1200)
  await write('cities.json', points)

  console.log('done — output in public/geo/')
}

main().catch((err) => {
  console.error(`build-geo failed: ${err.message}`)
  process.exit(1)
})
