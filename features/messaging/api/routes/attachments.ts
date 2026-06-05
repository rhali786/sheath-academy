import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { assertConversationParticipant, MessagingError } from '@/features/messaging/server/service'
import { getAttachment } from '@/features/messaging/server/repository'
import { resolveAttachmentConversation } from '../attachmentUtils'
import { err } from '../responseHelpers'

export async function GET(request: Request, attachmentId: string) {
  const auth = getRequestAuthCtx()

  const attachment = await getAttachment(attachmentId)
  if (!attachment) return err(404, 'Attachment not found')

  const conversationId = await resolveAttachmentConversation(attachment.messageId)
  if (!conversationId) return err(404, 'Attachment not found')

  try {
    await assertConversationParticipant(conversationId, auth.userId)
  } catch (e) {
    if (e instanceof MessagingError) return err(e.status, e.message)
    throw e
  }

  return new Response(new Uint8Array(attachment.data as unknown as Buffer), {
    headers: { 'Content-Type': attachment.mimeType },
  })
}
