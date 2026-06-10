const AVATAR_GRADIENTS: Array<{ from: string; to: string }> = [
  { from: '#2d9862', to: '#1a5c3a' },
  { from: '#0ea5e9', to: '#0369a1' },
  { from: '#8b5cf6', to: '#6d28d9' },
  { from: '#f59e0b', to: '#d97706' },
  { from: '#ec4899', to: '#be185d' },
  { from: '#14b8a6', to: '#0f766e' },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getInitials(name?: string | null, email?: string): string {
  const trimmedName = name?.trim()
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
    }
    return trimmedName.slice(0, 2).toUpperCase()
  }

  const local = email?.split('@')[0]?.trim()
  if (local) return local.slice(0, 2).toUpperCase()
  return '?'
}

export function getAvatarSeed(name?: string | null, email?: string): string {
  return (name?.trim() || email?.trim() || 'unknown').toLowerCase()
}

export function getAvatarStyle(seed: string): { background: string } {
  const gradient = AVATAR_GRADIENTS[hashString(seed) % AVATAR_GRADIENTS.length]
  return { background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }
}
