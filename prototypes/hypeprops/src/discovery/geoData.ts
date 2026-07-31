import { useEffect, useState } from 'react'
import type { CityPoint, PackedLines } from './types'

/**
 * Lazy loaders for the vector geography built by `scripts/build-geo.mjs`.
 * The fine border set is ~450KB, so nothing here blocks the first globe frame:
 * each dataset is fetched the first time a zoom band asks for it, then cached
 * at module scope for the rest of the session.
 */

export type BorderSet = 'countries-coarse' | 'countries-fine' | 'admin1'

const FILES: Record<BorderSet, string> = {
  'countries-coarse': '/geo/borders-countries-coarse.json',
  'countries-fine': '/geo/borders-countries-fine.json',
  admin1: '/geo/borders-admin1.json',
}

const lineCache = new Map<BorderSet, PackedLines>()
const linePending = new Map<BorderSet, Promise<PackedLines>>()

function loadLines(set: BorderSet): Promise<PackedLines> {
  const cached = lineCache.get(set)
  if (cached) return Promise.resolve(cached)
  let pending = linePending.get(set)
  if (!pending) {
    pending = fetch(FILES[set])
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} loading ${FILES[set]}`)
        return res.json() as Promise<PackedLines>
      })
      .then((data) => {
        lineCache.set(set, data)
        return data
      })
      .finally(() => linePending.delete(set))
    linePending.set(set, pending)
  }
  return pending
}

/** packed polylines for the requested sets; `null` until the first one lands */
export function useBorderLines(sets: BorderSet[]): PackedLines[] | null {
  const key = sets.join(',')
  const [lines, setLines] = useState<PackedLines[] | null>(() => {
    const hit = sets.map((s) => lineCache.get(s))
    return hit.every(Boolean) ? (hit as PackedLines[]) : null
  })

  useEffect(() => {
    let live = true
    const wanted = key.split(',').filter(Boolean) as BorderSet[]
    // keep the previous band's lines on screen while the next set downloads —
    // blanking the borders mid-zoom reads as a glitch
    Promise.all(wanted.map(loadLines))
      .then((data) => {
        if (live) setLines(data)
      })
      .catch((err) => console.warn('discovery: border layer unavailable —', err.message))
    return () => {
      live = false
    }
  }, [key])

  return lines
}

let cityCache: CityPoint[] | null = null
let cityPending: Promise<CityPoint[]> | null = null

function loadCities(): Promise<CityPoint[]> {
  if (cityCache) return Promise.resolve(cityCache)
  cityPending ??= fetch('/geo/cities.json')
    .then((res) => {
      if (!res.ok) throw new Error(`${res.status} loading /geo/cities.json`)
      return res.json() as Promise<CityPoint[]>
    })
    .then((data) => {
      cityCache = data
      return data
    })
    .finally(() => {
      cityPending = null
    })
  return cityPending
}

const NO_CITIES: CityPoint[] = []

/**
 * The populated-places list, biggest first. Returns nothing while disabled —
 * reading the module cache regardless would leak Earth's cities onto the Moon
 * once they'd been fetched during an earlier Earth visit.
 */
export function useCityPoints(enabled: boolean): CityPoint[] {
  const [loaded, setLoaded] = useState<CityPoint[] | null>(() => cityCache)

  useEffect(() => {
    if (!enabled || loaded) return
    let live = true
    loadCities()
      .then((data) => {
        if (live) setLoaded(data)
      })
      .catch((err) => console.warn('discovery: city labels unavailable —', err.message))
    return () => {
      live = false
    }
  }, [enabled, loaded])

  return enabled ? (loaded ?? NO_CITIES) : NO_CITIES
}
