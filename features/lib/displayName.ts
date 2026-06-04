export function displayName(user: { name?: string | null; email?: string | null }): string {
  const trimmed = user.name?.trim()
  if (trimmed) return trimmed
  return user.email ?? ''
}
