import type { Brand, BrandProp, PropModel } from '../engine/types'

/** self-contained SVG logo as a data URL — no asset sourcing on the critical path */
export function textLogo(text: string, bg: string, fg = '#ffffff'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="128" viewBox="0 0 256 128"><rect width="256" height="128" rx="20" fill="${bg}"/><text x="128" y="82" font-family="Arial Black, Arial, sans-serif" font-size="52" font-weight="900" text-anchor="middle" fill="${fg}" letter-spacing="2">${text}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const BRANDS: Brand[] = [
  {
    id: 'volt',
    name: 'VOLT Energy',
    verified: true,
    logoUrl: textLogo('VOLT', '#0f172a', '#a3e635'),
    primaryColor: '#a3e635',
  },
  {
    id: 'nova',
    name: 'Nova Cola',
    verified: true,
    logoUrl: textLogo('NOVA', '#7f1d1d', '#ffffff'),
    primaryColor: '#ef4444',
  },
  {
    id: 'byte',
    name: 'BYTE Gaming',
    verified: true,
    logoUrl: textLogo('BYTE', '#1e1b4b', '#818cf8'),
    primaryColor: '#818cf8',
  },
]

export const PROP_MODELS: PropModel[] = [
  {
    id: 'cap',
    type: 'hat',
    name: 'Snapback Cap',
    glbUrl: 'primitive:cap',
    // canonical-face cm: forehead surface is at z≈5, so the crown center sits
    // well behind it (≈ -3) for the band to wrap the skull, not float ahead of it
    anchor: { position: [0, 6.8, -3.0], rotation: [-0.12, 0, 0], scale: 1.08 },
  },
  {
    id: 'glasses',
    type: 'glasses',
    name: 'Deal Shades',
    glbUrl: 'primitive:glasses',
    // eye line sits a touch above the head origin, pushed toward the camera
    anchor: { position: [0, 1.6, 5.4], rotation: [0, 0, 0], scale: 1 },
  },
]

export const SEED_BRAND_PROPS: BrandProp[] = [
  {
    id: 'bp-volt-cap',
    brandId: 'volt',
    propModelId: 'cap',
    skin: { baseColor: '#a3e635', logoUrl: textLogo('VOLT', '#0f172a', '#a3e635'), finish: 'matte' },
    priceUsd: 2000,
    baseDurationSec: 30,
  },
  {
    id: 'bp-nova-glasses',
    brandId: 'nova',
    propModelId: 'glasses',
    skin: { baseColor: '#ef4444', logoUrl: textLogo('NOVA', '#7f1d1d'), finish: 'gloss' },
    priceUsd: 3500,
    baseDurationSec: 25,
  },
  {
    id: 'bp-byte-cap',
    brandId: 'byte',
    propModelId: 'cap',
    skin: { baseColor: '#1e1b4b', logoUrl: textLogo('BYTE', '#1e1b4b', '#818cf8'), finish: 'metallic' },
    priceUsd: 1500,
    baseDurationSec: 20,
  },
]
