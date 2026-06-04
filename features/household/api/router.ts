import { NextResponse } from 'next/server'
import * as householdProfileHandler from './routes/household-profile'
import * as switchHandler from './routes/switch'
import * as inviteHandler from './routes/invite'
import * as acceptHandler from './routes/accept'
import * as revokeHandler from './routes/revoke'
import * as memberRemoveHandler from './routes/member-remove'
import * as membersHandler from './routes/members'

export async function handleHouseholdRoute(
  slug: string[],
  request: Request
): Promise<NextResponse | null> {
  const method = request.method

  // GET /household/profile
  if (slug.length === 1 && slug[0] === 'profile' && method === 'GET') {
    return householdProfileHandler.GET()
  }

  // POST /household/profile — first-time setup (set household name)
  if (slug.length === 1 && slug[0] === 'profile' && method === 'POST') {
    return householdProfileHandler.POST(request)
  }

  // PUT /household/profile  — rename household
  if (slug.length === 1 && slug[0] === 'profile' && method === 'PUT') {
    return householdProfileHandler.PUT(request)
  }

  // POST /household/switch — change active household (multi-household users)
  if (slug.length === 1 && slug[0] === 'switch' && method === 'POST') {
    return switchHandler.POST(request)
  }

  // POST /household/invite — send invitation to a new member
  if (slug.length === 1 && slug[0] === 'invite' && method === 'POST') {
    return inviteHandler.POST(request)
  }

  // POST /household/invite/accept — accept an invitation via token
  if (slug.length === 2 && slug[0] === 'invite' && slug[1] === 'accept' && method === 'POST') {
    return acceptHandler.POST(request)
  }

  // POST /household/invite/revoke — revoke a pending invitation
  if (slug.length === 2 && slug[0] === 'invite' && slug[1] === 'revoke' && method === 'POST') {
    return revokeHandler.POST(request)
  }

  // DELETE /household/member — remove a member from the household
  if (slug.length === 1 && slug[0] === 'member' && method === 'DELETE') {
    return memberRemoveHandler.DELETE(request)
  }

  // GET /household/members — list members with user info
  if (slug.length === 1 && slug[0] === 'members' && method === 'GET') {
    return membersHandler.GET()
  }

  // GET /household/invitations — list invitations for the household
  if (slug.length === 1 && slug[0] === 'invitations' && method === 'GET') {
    return membersHandler.getInvitations()
  }

  return null
}
