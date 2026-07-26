/** Deterministic avatar styling from a username — same visual language as the
 * channel avatars in the sidebar/browse grid. */

const GRADIENTS = [
  'linear-gradient(135deg,#53fc18,#3fc411)',
  'linear-gradient(135deg,#60a5fa,#a78bfa)',
  'linear-gradient(135deg,#fb923c,#f87171)',
  'linear-gradient(135deg,#f472b6,#facc15)',
  'linear-gradient(135deg,#34d399,#60a5fa)',
  'linear-gradient(135deg,#a78bfa,#f472b6)',
  'linear-gradient(135deg,#22d3ee,#3b82f6)',
  'linear-gradient(135deg,#facc15,#fb923c)',
]

export function avatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export function avatarInitials(name: string): string {
  const caps = name.replace(/[^A-Z]/g, '')
  return (caps.length >= 2 ? caps.slice(0, 2) : name.slice(0, 2)).toUpperCase()
}
