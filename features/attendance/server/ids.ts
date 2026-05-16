let counter = 0

export function generateAttendanceId(): string {
  return `attendance_${Date.now()}_${++counter}`
}

export function resetIdCounter(): void {
  counter = 0
}
