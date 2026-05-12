let counter = 0

export function generateSubjectId(): string {
  counter++
  return `subject_${Date.now()}_${counter}`
}

export function resetIdCounter(): void {
  counter = 0
}
