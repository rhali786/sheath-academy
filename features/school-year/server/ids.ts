let counter = 0

export function generateSchoolYearId(): string {
  counter++
  return `schoolyear_${Date.now()}_${counter}`
}

export function resetIdCounter(): void {
  counter = 0
}
