let counter = 0

export function generateResourceId(): string {
  counter++
  return `res_${Date.now()}_${counter}`
}

export function resetIdCounter(): void {
  counter = 0
}
