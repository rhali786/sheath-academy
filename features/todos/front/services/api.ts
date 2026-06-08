import type { ApiResponse } from '@/features/lib/types'
import type { PersonalTodo } from '@/features/todos/types'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

async function get<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function del<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export const todosApi = {
  list: (): Promise<ApiResponse<PersonalTodo[]>> => get('/api/todos'),

  create: (body: { text: string; dueDate?: string }): Promise<ApiResponse<PersonalTodo>> =>
    post('/api/todos', body),

  update: (
    id: string,
    body: { text?: string; dueDate?: string | null; done?: boolean; sortOrder?: number },
  ): Promise<ApiResponse<PersonalTodo>> => patch(`/api/todos/${encodeURIComponent(id)}`, body),

  toggle: (id: string, done: boolean): Promise<ApiResponse<PersonalTodo>> =>
    patch(`/api/todos/${encodeURIComponent(id)}`, { done }),

  remove: (id: string): Promise<ApiResponse<null>> => del(`/api/todos/${encodeURIComponent(id)}`),

  reorder: (orderedIds: string[]): Promise<ApiResponse<PersonalTodo>[]> =>
    Promise.all(orderedIds.map((id, index) => todosApi.update(id, { sortOrder: index }))),
}
