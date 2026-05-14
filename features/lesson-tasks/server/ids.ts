// In-memory MVP only. Migrate to UUID on Postgres.
let counter = 0

export function generateLessonTaskId(): string {
  counter++
  return `lesson_task_${Date.now()}_${counter}`
}

export function resetIdCounter(): void {
  counter = 0
}
