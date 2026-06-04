'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { MemberWithUser } from '@/features/household/server/repository'
import type { HouseholdInvitationRow } from '@/features/household/server/repository'

export function MemberManager() {
  const { data: session } = useSession()
  const householdId = session?.user?.householdId
  const currentUserId = session?.user?.userId

  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [invitations, setInvitations] = useState<HouseholdInvitationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!householdId) return
    setLoading(true)
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/household/members'),
        fetch('/api/household/invitations'),
      ])
      const membersJson = await membersRes.json()
      const invitesJson = await invitesRes.json()
      setMembers(membersJson.data?.members ?? [])
      setInvitations(invitesJson.data?.invitations ?? [])
    } finally {
      setLoading(false)
    }
  }, [householdId])

  useEffect(() => { load() }, [load])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.message ?? 'Failed to send invite')
        return
      }
      setInviteEmail('')
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (invitationId: string) => {
    await fetch('/api/household/invite/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId }),
    })
    await load()
  }

  const handleRemove = async (userId: string) => {
    await fetch('/api/household/member', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    await load()
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading members…</p>
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold mb-3">Members</h3>
        <ul className="space-y-2">
          {members.map(m => (
            <li key={m.memberId} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {m.name ?? m.email}
                {m.name && m.email !== m.name && (
                  <span className="ml-1 text-muted-foreground">{m.email}</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {m.role === 'owner' && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">owner</span>
                )}
                {m.userId !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemove(m.userId)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {pendingInvitations.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Pending invitations</h3>
          <ul className="space-y-2">
            {pendingInvitations.map(inv => (
              <li key={inv.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{inv.email}</span>
                <button
                  type="button"
                  onClick={() => handleRevoke(inv.id)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold mb-3">Invite someone</h3>
        <form onSubmit={handleInvite} className="flex gap-2">
          <label htmlFor="invite-email" className="sr-only">Email</label>
          <input
            id="invite-email"
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 border rounded px-3 py-1.5 text-sm"
            aria-label="Email"
          />
          <button
            type="submit"
            disabled={submitting || !inviteEmail}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            Send invite
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </section>
    </div>
  )
}
