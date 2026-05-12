let quranCounter = 0
let taskCounter = 0

export function generateTaskId(): string {
  taskCounter++
  return `task_${Date.now()}_${taskCounter}`
}

export function generateQuranSessionId(existingCount: number): string {
  return `quran_${String(existingCount + 1).padStart(3, '0')}`
}

export function resetIdCounters(): void {
  quranCounter = 0
  taskCounter = 0
}
