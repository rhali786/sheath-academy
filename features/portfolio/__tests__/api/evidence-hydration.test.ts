/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/portfolio/server/repository', () => ({
  listEvidenceRows: jest.fn(),
  getEvidenceRow: jest.fn(),
  createEvidenceRow: jest.fn(),
}))

jest.mock('@/features/portfolio/server/attachments-repository', () => ({
  insertEvidenceAttachment: jest.fn(),
  getEvidenceAttachment: jest.fn(),
  listEvidenceAttachments: jest.fn(),
  listEvidenceAttachmentsForItems: jest.fn(),
  deleteEvidenceAttachment: jest.fn(),
}))

// admin-metrics import used inside POST
jest.mock('@/features/admin-metrics/server/instrument', () => ({
  trackEvidenceCreated: jest.fn().mockResolvedValue(undefined),
}))

import { listEvidenceRows, getEvidenceRow } from '@/features/portfolio/server/repository'
import {
  listEvidenceAttachments,
  listEvidenceAttachmentsForItems,
} from '@/features/portfolio/server/attachments-repository'
import { GET as listGet } from '@/features/portfolio/api/routes/evidence'
import { GET as getById } from '@/features/portfolio/api/routes/evidence-id'

const mockList = listEvidenceRows as jest.Mock
const mockGet = getEvidenceRow as jest.Mock
const mockListAttachments = listEvidenceAttachments as jest.Mock
const mockListForItems = listEvidenceAttachmentsForItems as jest.Mock

const FAKE_ROW = {
  id: 'evidence_001',
  householdId: 'hh_test',
  learnerId: 'learner_a',
  subjectId: 'sub_a',
  lessonTaskId: null,
  quranSessionId: null,
  attendanceEventId: null,
  title: 'Math worksheet',
  description: 'Some notes',
  evidenceType: 'note',
  url: null,
  evidenceDate: '2026-06-09',
  createdAt: new Date('2026-06-09T00:00:00Z'),
  updatedAt: new Date('2026-06-09T00:00:00Z'),
}

const FAKE_ATTACHMENT = {
  id: 'patt_001',
  evidenceItemId: 'evidence_001',
  filename: 'photo.png',
  mimeType: 'image/png',
  sizeBytes: 512,
  createdAt: '2026-06-09T00:00:00.000Z',
}

beforeEach(() => {
  mockList.mockReset()
  mockGet.mockReset()
  mockListAttachments.mockReset()
  mockListForItems.mockReset()
})

// ── GET /api/portfolio/evidence — list hydration ───────────────────────────────

describe('GET /api/portfolio/evidence — attachment hydration', () => {
  it('returns items with attachments array populated', async () => {
    mockList.mockResolvedValue([FAKE_ROW])
    mockListForItems.mockResolvedValue([FAKE_ATTACHMENT])

    const res = await listGet(new Request('http://localhost/api/portfolio/evidence'))
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0].attachments).toEqual([FAKE_ATTACHMENT])
    expect(mockListForItems).toHaveBeenCalledWith(['evidence_001'])
  })

  it('returns items with empty attachments array when none exist', async () => {
    mockList.mockResolvedValue([FAKE_ROW])
    mockListForItems.mockResolvedValue([])

    const res = await listGet(new Request('http://localhost/api/portfolio/evidence'))
    const body = await res.json()

    expect(body.data[0].attachments).toEqual([])
  })

  it('does not call listEvidenceAttachmentsForItems when list is empty', async () => {
    mockList.mockResolvedValue([])

    const res = await listGet(new Request('http://localhost/api/portfolio/evidence'))
    const body = await res.json()

    expect(body.data).toEqual([])
    expect(mockListForItems).not.toHaveBeenCalled()
  })

  it('assigns attachments to the correct evidence item when multiple items returned', async () => {
    const row2 = { ...FAKE_ROW, id: 'evidence_002', title: 'Art project' }
    const att2 = { ...FAKE_ATTACHMENT, id: 'patt_002', evidenceItemId: 'evidence_002', filename: 'art.pdf' }
    mockList.mockResolvedValue([FAKE_ROW, row2])
    mockListForItems.mockResolvedValue([FAKE_ATTACHMENT, att2])

    const res = await listGet(new Request('http://localhost/api/portfolio/evidence'))
    const body = await res.json()

    const item1 = body.data.find((i: any) => i.id === 'evidence_001')
    const item2 = body.data.find((i: any) => i.id === 'evidence_002')
    expect(item1.attachments).toHaveLength(1)
    expect(item1.attachments[0].id).toBe('patt_001')
    expect(item2.attachments).toHaveLength(1)
    expect(item2.attachments[0].id).toBe('patt_002')
  })
})

// ── GET /api/portfolio/evidence/:id — single item hydration ───────────────────

describe('GET /api/portfolio/evidence/:id — attachment hydration', () => {
  it('returns the item with its attachments populated', async () => {
    mockGet.mockResolvedValue(FAKE_ROW)
    mockListAttachments.mockResolvedValue([FAKE_ATTACHMENT])

    const res = await getById('evidence_001')
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(body.data.attachments).toEqual([FAKE_ATTACHMENT])
    expect(mockListAttachments).toHaveBeenCalledWith('evidence_001')
  })

  it('returns the item with empty attachments array when none exist', async () => {
    mockGet.mockResolvedValue(FAKE_ROW)
    mockListAttachments.mockResolvedValue([])

    const res = await getById('evidence_001')
    const body = await res.json()

    expect(body.data.attachments).toEqual([])
  })

  it('returns 404 when item not found (no attachment fetch attempted)', async () => {
    mockGet.mockResolvedValue(null)

    const res = await getById('missing')
    expect(res.status).toBe(404)
    expect(mockListAttachments).not.toHaveBeenCalled()
  })
})
