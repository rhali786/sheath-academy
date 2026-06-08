export interface PersonalTodo {
  id: string
  householdId: string
  text: string
  done: boolean
  dueDate: string | null
  sortOrder: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTodoInput {
  text: string
  dueDate?: string
}

export interface UpdateTodoInput {
  text?: string
  dueDate?: string | null
  done?: boolean
  sortOrder?: number
}
