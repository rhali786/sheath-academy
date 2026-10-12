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
