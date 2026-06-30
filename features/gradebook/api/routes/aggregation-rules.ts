import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { AggregationRule, AggregationStrategy } from '@/features/gradebook/types'
import {
  listAggregationRules,
  createAggregationRule,
  updateAggregationRule,
  deleteAggregationRule,
} from '@/features/gradebook/server/repository'

const VALID_STRATEGIES: AggregationStrategy[] = ['average', 'most_recent', 'highest']

export async function GET(_request: Request): Promise<NextResponse<ApiResponse<AggregationRule[]>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const rules = await listAggregationRules(householdId)
    return NextResponse.json({ status: 'success', data: rules, message: 'Aggregation rules retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: [], message: 'Failed to retrieve aggregation rules', timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<AggregationRule | null>>> {
  const body = await request.json()
  const { name, strategy } = body
  if (!name || !strategy || !VALID_STRATEGIES.includes(strategy)) {
    return NextResponse.json({ status: 'error', data: null, message: 'name and a valid strategy are required', timestamp: new Date().toISOString() }, { status: 400 })
  }
  try {
    const { householdId } = getRequestAuthCtx()
    const rule = await createAggregationRule(householdId, { name, strategy })
    return NextResponse.json({ status: 'success', data: rule, message: 'Aggregation rule created', timestamp: new Date().toISOString() }, { status: 201 })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Failed to create aggregation rule', timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function PATCH(id: string, request: Request): Promise<NextResponse<ApiResponse<AggregationRule | null>>> {
  const body = await request.json()
  if (body.strategy !== undefined && !VALID_STRATEGIES.includes(body.strategy)) {
    return NextResponse.json({ status: 'error', data: null, message: 'Invalid strategy', timestamp: new Date().toISOString() }, { status: 400 })
  }
  try {
    const { householdId } = getRequestAuthCtx()
    const updated = await updateAggregationRule(id, householdId, { name: body.name, strategy: body.strategy })
    if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Aggregation rule not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: updated, message: 'Aggregation rule updated', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Aggregation rule not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const removed = await deleteAggregationRule(id, householdId)
    if (!removed) return NextResponse.json({ status: 'error', data: null, message: 'Aggregation rule not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: null, message: 'Aggregation rule deleted', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Aggregation rule not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}
