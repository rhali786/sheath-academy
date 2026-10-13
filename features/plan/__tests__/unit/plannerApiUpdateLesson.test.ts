import { plannerApi } from '@/features/plan/front/services/api'

// The lesson editor shows why a save was refused (e.g. a course the learner is not
// enrolled in), so updateLesson must surface the server's message, not "Request failed: 400".
describe('plannerApi.updateLesson', () => {
  const realFetch = global.fetch
  afterEach(() => { global.fetch = realFetch })

  it("rejects with the server's message on a 400", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ status: 'error', data: null, message: "Math 3 is not one of this learner's courses." }),
    }) as unknown as typeof fetch

    await expect(plannerApi.updateLesson('l1', { childId: 'c2' })).rejects.toThrow("Math 3 is not one of this learner's courses.")
  })

  it('falls back to the status when the body has no message', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('not json') } }) as unknown as typeof fetch
    await expect(plannerApi.updateLesson('l1', {})).rejects.toThrow('Request failed: 500')
  })
})

describe('plannerApi.deleteLesson', () => {
  const realFetch = global.fetch
  afterEach(() => { global.fetch = realFetch })

  it('deletes one copy by default and returns how many were removed', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'success', data: { deleted: 1 } }) })
    global.fetch = fetchMock as unknown as typeof fetch
    await expect(plannerApi.deleteLesson('l1')).resolves.toBe(1)
    expect(String(fetchMock.mock.calls[0][0]).endsWith('/api/plan/lessons/l1')).toBe(true)
  })

  it('asks for the whole group with deleteGroup', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'success', data: { deleted: 5 } }) })
    global.fetch = fetchMock as unknown as typeof fetch
    await expect(plannerApi.deleteLesson('l1', { deleteGroup: true })).resolves.toBe(5)
    expect(String(fetchMock.mock.calls[0][0]).endsWith('/api/plan/lessons/l1?deleteGroup=true')).toBe(true)
  })

  it("rejects with the server's message", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ message: 'Lesson not found' }) }) as unknown as typeof fetch
    await expect(plannerApi.deleteLesson('l1')).rejects.toThrow('Lesson not found')
  })
})
