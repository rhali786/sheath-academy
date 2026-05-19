import type { ApiResponse } from '@/features/lib/types'
import type {
  Resource,
  ResourceType,
  VerificationStatus,
  PaceInput,
  PaceResult,
  GenerateLessonsInput,
  GeneratedLesson,
} from '@/features/resources/types'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
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

export const resourcesApi = {
  listResources: async (workspaceId?: string): Promise<ApiResponse<Resource[]>> => {
    const qs = workspaceId ? `?workspaceId=${workspaceId}` : ''
    return get<Resource[]>(`/api/resources${qs}`)
  },

  createResource: async (data: {
    workspaceId: string
    title: string
    resourceType: ResourceType
    publisher?: string
    author?: string
    edition?: string
    gradeLevel?: string
    subjectCategory?: string
    isbn?: string
    totalPages?: number
    totalLessons?: number
    totalChapters?: number
  }): Promise<ApiResponse<Resource>> => {
    return post<Resource>('/api/resources', data)
  },

  getResource: async (id: string): Promise<ApiResponse<Resource>> => {
    return get<Resource>(`/api/resources/${id}`)
  },

  updateVerification: async (id: string, status: VerificationStatus): Promise<ApiResponse<Resource>> => {
    return patch<Resource>(`/api/resources/${id}/verification`, { verificationStatus: status })
  },

  calculatePace: async (input: PaceInput): Promise<ApiResponse<PaceResult>> => {
    return post<PaceResult>('/api/resources/pace', input)
  },

  generateLessons: async (input: GenerateLessonsInput): Promise<ApiResponse<GeneratedLesson[]>> => {
    return post<GeneratedLesson[]>('/api/resources/generate-lessons', input)
  },
}
