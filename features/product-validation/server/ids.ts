let counter = 0

export function generateProductValidationResponseId(): string {
  return `pvr_${Date.now()}_${++counter}`
}

export function resetProductValidationIdCounter(): void {
  counter = 0
}
