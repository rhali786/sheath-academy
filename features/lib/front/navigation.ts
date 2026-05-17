export function childScopedHref(basePath: string, childId?: string | null): string {
  if (!childId) return basePath
  return `${basePath}?childId=${encodeURIComponent(childId)}`
}
