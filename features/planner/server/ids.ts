let lessonTaskCounter = 0

export function generateLessonTaskId(): string {
  return `lesson_${Date.now()}_${++lessonTaskCounter}`
}

export function resetIdCounter(): void {
  lessonTaskCounter = 0
}
