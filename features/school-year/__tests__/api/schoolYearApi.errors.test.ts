/**
 * UAT 5.2 — the client service must surface the server's refusal message instead
 * of a bare "Request failed: 403", for every verb the School year tab uses.
 */
import { schoolYearApi } from '@/features/school-year/front/services/api'
import { LEARNER_READ_DENIED, LEARNER_WRITE_DENIED, fakeResponse } from '../fixtures/learnerDenials'

const mockFetch = jest.fn()

beforeEach(() => {
  mockFetch.mockReset()
  global.fetch = mockFetch as unknown as typeof fetch
})

describe('schoolYearApi error messages (UAT 5.2)', () => {
  it('createSchoolYear rejects with the server message when a learner is refused', async () => {
    mockFetch.mockResolvedValue(fakeResponse(LEARNER_WRITE_DENIED))
    await expect(
      schoolYearApi.createSchoolYear({ name: '2026–2027', startDate: '2026-08-01', endDate: '2027-05-31' }),
    ).rejects.toThrow(LEARNER_WRITE_DENIED.body.message)
  })

  it('activateSchoolYear rejects with the server message when a learner is refused', async () => {
    mockFetch.mockResolvedValue(fakeResponse(LEARNER_WRITE_DENIED))
    await expect(schoolYearApi.activateSchoolYear('sy_1')).rejects.toThrow(LEARNER_WRITE_DENIED.body.message)
  })

  it('getActiveSchoolYear rejects with the server message when a learner is refused', async () => {
    mockFetch.mockResolvedValue(fakeResponse(LEARNER_READ_DENIED))
    await expect(schoolYearApi.getActiveSchoolYear()).rejects.toThrow(LEARNER_READ_DENIED.body.message)
  })

  it('updateSchoolYear (already correct) still rejects with the server message', async () => {
    mockFetch.mockResolvedValue(fakeResponse(LEARNER_WRITE_DENIED))
    await expect(schoolYearApi.updateSchoolYear('sy_1', { breaks: [] })).rejects.toThrow(
      LEARNER_WRITE_DENIED.body.message,
    )
  })

  it('falls back to the status when the error body is not JSON', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new SyntaxError('html') } })
    await expect(
      schoolYearApi.createSchoolYear({ name: 'x', startDate: '2026-08-01', endDate: '2027-05-31' }),
    ).rejects.toThrow('Request failed: 502')
  })
})
