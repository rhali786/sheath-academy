import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { BadgeDefinition } from '@/features/badges/types'
import {
  getBadgeDefinitionById,
  updateBadgeDefinition,
  deleteBadgeDefinition,
} from '@/features/badges/server/repository'

/**
 * Guards mutation of a badge definition:
 * - 404 when no row with this id exists
 * - 403 when the row is a platform starter (householdId null) or belongs to
 *   another household (only the owning household may edit/delete custom badges)
 * Returns null when the caller is cleared to proceed.
 */
async function guardOwnedDefinition(id: string, householdId: string): Promise<NextResponse<ApiResponse<BadgeDefinition | null>> | null> {
  const existing = await getBadgeDefinitionById(id)
  if (!existing) {
    return NextResponse.json({ status: 'error', data: null, message: 'Badge not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
  if (existing.householdId === null || existing.householdId !== householdId) {
    return NextResponse.json({ status: 'error', data: null, message: 'Starter badges and badges owned by another household cannot be modified', timestamp: new Date().toISOString() }, { status: 403 })
  }
  return null
}

export async function PATCH(
  id: string,
  request: Request,
): Promise<NextResponse<ApiResponse<BadgeDefinition | null>>> {
  const body = await request.json()
  try {
    const { householdId } = getRequestAuthCtx()
    const guard = await guardOwnedDefinition(id, householdId)
    if (guard) return guard

    const updated = await updateBadgeDefinition(id, householdId, {
      title: body.title,
      description: body.description,
      criteria: body.criteria,
      emblemKey: body.emblemKey,
      gradeBands: body.gradeBands,
      verificationRequirement: body.verificationRequirement,
      visibility: body.visibility,
      enabled: body.enabled,
    })
    if (!updated) {
      return NextResponse.json({ status: 'error', data: null, message: 'Badge not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: updated, message: 'Badge updated', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Failed to update badge', timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const guard = await guardOwnedDefinition(id, householdId)
    if (guard) return guard as NextResponse<ApiResponse<null>>

    const removed = await deleteBadgeDefinition(id, householdId)
    if (!removed) {
      return NextResponse.json({ status: 'error', data: null, message: 'Badge not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: null, message: 'Badge deleted', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Failed to delete badge', timestamp: new Date().toISOString() }, { status: 500 })
  }
}
