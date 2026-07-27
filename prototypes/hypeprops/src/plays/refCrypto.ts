/**
 * Ref — hashing and seeds, DEMO STUB.
 *
 * These are deterministic, display-only digests: same input always gives the
 * same string, so the on-stage "recompute it yourself" beat genuinely works.
 * They are NOT cryptographic and prove nothing.
 *
 * TODO (see PLAYS-SPEC.md Section 5.2): replace with the real construction —
 * Web Crypto SHA-256 for commitments and the hash chain, HMAC-SHA256 byte
 * stream over (server_seed, client_seed, nonce, round) for draws, mirroring
 * the documented Stake provably-fair scheme. The signatures below are already
 * the shapes the real version needs, so swapping it in is a file-local change.
 *
 *   export async function sha256Hex(input: string): Promise<string> {
 *     const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
 *     return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
 *   }
 *   export async function hmacSha256(key: string, message: string): Promise<Uint8Array> { … }
 */

/** FNV-1a — fast, deterministic, non-cryptographic */
function fnv1a(input: string, seed = 0x811c9dc5): number {
  let h = seed
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** 64 hex chars, sha256-shaped so the UI reads like the real thing */
export function digestHex(input: string): string {
  let out = ''
  for (let block = 0; block < 8; block++) {
    out += fnv1a(`${block}:${input}`).toString(16).padStart(8, '0')
  }
  return out
}

export const shortHash = (hex: string, n = 10): string => `${hex.slice(0, n)}…`

/** deterministic JSON: sorted keys, so a payload always hashes the same */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  const obj = value as Record<string, unknown>
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
    .join(',')}}`
}

export function randomHex(bytes = 32): string {
  let out = ''
  for (let i = 0; i < bytes; i++) out += Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  return out
}

/**
 * Chat collectively fixes the client seed: derived from the entry messages,
 * ordered by message id, so it cannot be known when the streamer commits.
 */
export function clientSeed(entries: { msgId: string; content: string }[]): string {
  const joined = [...entries]
    .sort((a, b) => a.msgId.localeCompare(b.msgId))
    .map((e) => `${e.msgId}:${e.content}`)
    .join('|')
  return digestHex(joined)
}

/** byte stream stand-in: deterministic per (serverSeed, clientSeed, nonce, round) */
export function seedBytes(serverSeed: string, seedClient: string, nonce: number, round = 0): number[] {
  const hex = digestHex(`${serverSeed}:${seedClient}:${nonce}:${round}`)
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16))
  return bytes
}

/** uniform-ish index over `count` from the seed stream (4 bytes per result) */
export function drawIndex(serverSeed: string, seedClient: string, nonce: number, count: number): number {
  if (count <= 0) return -1
  const b = seedBytes(serverSeed, seedClient, nonce)
  const value = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0
  return value % count
}

/** hash chain over the event log: h_i = digest(h_{i-1} || canonical(event)) */
export const chainNext = (prev: string, event: unknown): string => digestHex(`${prev}||${canonical(event)}`)
