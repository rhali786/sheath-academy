export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
}
