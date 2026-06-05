import { NextResponse } from 'next/server'
import * as conversationsHandler from './routes/conversations'
import * as conversationDetailHandler from './routes/conversation-detail'
import * as conversationMessagesHandler from './routes/conversation-messages'
import * as conversationReadHandler from './routes/conversation-read'
import * as conversationParticipantsHandler from './routes/conversation-participants'
import * as attachmentsHandler from './routes/attachments'
import * as unreadHandler from './routes/unread'

export async function handleMessagingRoute(
  slug: string[],
  request: Request,
): Promise<NextResponse | Response | null> {
  const method = request.method

  // GET /messaging/unread
  if (slug.length === 1 && slug[0] === 'unread' && method === 'GET') {
    return unreadHandler.GET()
  }

  // GET/POST /messaging/conversations
  if (slug.length === 1 && slug[0] === 'conversations') {
    if (method === 'GET') return conversationsHandler.GET()
    if (method === 'POST') return conversationsHandler.POST(request)
  }

  // GET /messaging/conversations/:id
  if (slug.length === 2 && slug[0] === 'conversations' && method === 'GET') {
    return conversationDetailHandler.GET(request, slug[1])
  }

  // GET/POST /messaging/conversations/:id/messages
  if (slug.length === 3 && slug[0] === 'conversations' && slug[2] === 'messages') {
    if (method === 'GET') return conversationMessagesHandler.GET(request, slug[1])
    if (method === 'POST') return conversationMessagesHandler.POST(request, slug[1])
  }

  // POST /messaging/conversations/:id/read
  if (slug.length === 3 && slug[0] === 'conversations' && slug[2] === 'read' && method === 'POST') {
    return conversationReadHandler.POST(request, slug[1])
  }

  // POST /messaging/conversations/:id/participants
  if (
    slug.length === 3 &&
    slug[0] === 'conversations' &&
    slug[2] === 'participants' &&
    method === 'POST'
  ) {
    return conversationParticipantsHandler.POST(request, slug[1])
  }

  // DELETE /messaging/conversations/:id/participants/:userId
  if (
    slug.length === 4 &&
    slug[0] === 'conversations' &&
    slug[2] === 'participants' &&
    method === 'DELETE'
  ) {
    return conversationParticipantsHandler.DELETE(request, slug[1], slug[3])
  }

  // GET /messaging/attachments/:id
  if (slug.length === 2 && slug[0] === 'attachments' && method === 'GET') {
    return attachmentsHandler.GET(request, slug[1])
  }

  return null
}
