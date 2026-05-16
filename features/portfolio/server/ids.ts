let counter = 0

export function generateEvidenceId(): string {
  return `evidence_${Date.now()}_${++counter}`
}

export function resetIdCounter(): void {
  counter = 0
}
