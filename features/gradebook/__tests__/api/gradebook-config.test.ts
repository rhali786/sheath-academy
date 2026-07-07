/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/gradebook/server/repository', () => ({
  listGradingScales: jest.fn(),
  createGradingScale: jest.fn(),
  updateGradingScale: jest.fn(),
  deleteGradingScale: jest.fn(),
  listAggregationRules: jest.fn(),
  createAggregationRule: jest.fn(),
  updateAggregationRule: jest.fn(),
  deleteAggregationRule: jest.fn(),
}))

import {
  createGradingScale, updateGradingScale, deleteGradingScale,
  createAggregationRule, updateAggregationRule, deleteAggregationRule,
} from '@/features/gradebook/server/repository'
import * as scales from '@/features/gradebook/api/routes/grading-scales'
import * as rules from '@/features/gradebook/api/routes/aggregation-rules'

const mockCreateScale = createGradingScale as jest.Mock
const mockUpdateScale = updateGradingScale as jest.Mock
const mockDeleteScale = deleteGradingScale as jest.Mock
const mockCreateRule = createAggregationRule as jest.Mock
const mockUpdateRule = updateAggregationRule as jest.Mock
const mockDeleteRule = deleteAggregationRule as jest.Mock

function req(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  mockCreateScale.mockReset(); mockUpdateScale.mockReset(); mockDeleteScale.mockReset()
  mockCreateRule.mockReset(); mockUpdateRule.mockReset(); mockDeleteRule.mockReset()
})

describe('grading-scales routes', () => {
  it('POST returns 400 without name/bands', async () => {
    const res = await scales.POST(req('http://localhost/api/gradebook/grading-scales', 'POST', { name: 'x' }))
    expect(res.status).toBe(400)
  })

  it('POST creates a scale', async () => {
    mockCreateScale.mockResolvedValue({ id: 'gs1', householdId: 'hh_test', name: 'Std', bands: [] })
    const res = await scales.POST(req('http://localhost/api/gradebook/grading-scales', 'POST', { name: 'Std', bands: [] }))
    expect(res.status).toBe(201)
    expect(mockCreateScale).toHaveBeenCalledWith('hh_test', { name: 'Std', bands: [] })
  })

  it('PATCH returns 404 when missing', async () => {
    mockUpdateScale.mockResolvedValue(null)
    const res = await scales.PATCH('nope', req('http://localhost/api/gradebook/grading-scales/nope', 'PATCH', { name: 'y' }))
    expect(res.status).toBe(404)
  })

  it('DELETE removes a scale', async () => {
    mockDeleteScale.mockResolvedValue(true)
    const res = await scales.DELETE('gs1')
    expect(res.status).toBe(200)
    expect(mockDeleteScale).toHaveBeenCalledWith('gs1', 'hh_test')
  })
})

describe('aggregation-rules routes', () => {
  it('POST returns 400 for an invalid strategy', async () => {
    const res = await rules.POST(req('http://localhost/api/gradebook/aggregation-rules', 'POST', { name: 'x', strategy: 'bogus' }))
    expect(res.status).toBe(400)
  })

  it('POST creates a rule', async () => {
    mockCreateRule.mockResolvedValue({ id: 'ar1', householdId: 'hh_test', name: 'Best', strategy: 'highest' })
    const res = await rules.POST(req('http://localhost/api/gradebook/aggregation-rules', 'POST', { name: 'Best', strategy: 'highest' }))
    expect(res.status).toBe(201)
    expect(mockCreateRule).toHaveBeenCalledWith('hh_test', { name: 'Best', strategy: 'highest' })
  })

  it('PATCH returns 400 for an invalid strategy', async () => {
    const res = await rules.PATCH('ar1', req('http://localhost/api/gradebook/aggregation-rules/ar1', 'PATCH', { strategy: 'bogus' }))
    expect(res.status).toBe(400)
  })

  it('DELETE removes a rule', async () => {
    mockDeleteRule.mockResolvedValue(true)
    const res = await rules.DELETE('ar1')
    expect(res.status).toBe(200)
    expect(mockDeleteRule).toHaveBeenCalledWith('ar1', 'hh_test')
  })
})
