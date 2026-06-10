import type { ApiResponse } from '@/features/lib/types'
import type { ConversationSummary, Message, ConversationParticipant, Conversation } from '@/features/messaging/types'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, init)
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {}
    throw new Error(message)
  }
  return res.json()
}

function get<T>(path: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(path)
}

function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function del<T>(path: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { method: 'DELETE' })
}

export interface ConversationDetail {
  conversation: ConversationSummary
  messages: Message[]
  participants: ConversationParticipant[]
}

export interface MessagesPage {
  messages: Message[]
  hasMore: boolean
}

export interface UnreadCount {
  count: number
}

export interface ConversationList {
  conversations: ConversationSummary[]
}

export function listConversations(): Promise<ApiResponse<ConversationList>> {
  return get('/api/messaging/conversations')
}

export function getConversation(id: string): Promise<ApiResponse<ConversationDetail>> {
  return get(`/api/messaging/conversations/${id}`)
}

export function sendMessage(convId: string, body: string): Promise<ApiResponse<Message>> {
  return post(`/api/messaging/conversations/${convId}/messages`, { body })
}

export function getMessages(convId: string, after?: string, limit?: number): Promise<ApiResponse<MessagesPage>> {
  const params = new URLSearchParams()
  if (after) params.set('after', after)
  if (limit != null) params.set('limit', String(limit))
  const qs = params.toString()
  return get(`/api/messaging/conversations/${convId}/messages${qs ? `?${qs}` : ''}`)
}

export function markRead(convId: string): Promise<ApiResponse<{ ok: boolean }>> {
  return post(`/api/messaging/conversations/${convId}/read`, {})
}

export function getUnread(): Promise<ApiResponse<UnreadCount>> {
  return get('/api/messaging/unread')
}

export function createDirectConversation(
  target: { userId: string } | { email: string }
): Promise<ApiResponse<Conversation>> {
  return post('/api/messaging/conversations', { type: 'direct', target })
}

export function createGroupConversation(
  title: string,
  participantUserIds: string[]
): Promise<ApiResponse<Conversation>> {
  return post('/api/messaging/conversations', { type: 'group', title, participantUserIds })
}

export function addParticipant(convId: string, userId: string): Promise<ApiResponse<ConversationParticipant>> {
  return post(`/api/messaging/conversations/${convId}/participants`, { userId })
}

export function removeParticipant(convId: string, userId: string): Promise<ApiResponse<{ ok: boolean }>> {
  return del(`/api/messaging/conversations/${convId}/participants/${userId}`)
}

export function getAttachmentUrl(id: string): string {
  return `${getApiBaseUrl()}/api/messaging/attachments/${id}`
}
