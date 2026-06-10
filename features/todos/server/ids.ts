let counter = 0

export function generateTodoId(): string {
  counter++
  return `todo_${Date.now()}_${counter}`
}

export function resetIdCounter(): void {
  counter = 0
}
