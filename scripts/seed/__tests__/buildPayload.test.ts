import { buildDemoSeedPayload, summarizePayload, HISTORY_DAYS } from '../buildPayload'
import { getDemoHouseholdConfigs } from '../demoConfig'

describe('buildDemoSeedPayload', () => {
  const configs = getDemoHouseholdConfigs('dev@sheathacademy.ai', 'amina@gmail.com')

  it('builds thousands of history rows without DB access', () => {
    const payload = buildDemoSeedPayload(configs)
    const counts = summarizePayload(payload)

    expect(payload.users).toHaveLength(2)
    expect(payload.households).toHaveLength(2)
    expect(payload.learners).toHaveLength(10)
    expect(counts.attendanceEvents).toBeGreaterThan(1000)
    expect(counts.lessonTasks).toBeGreaterThan(500)
    expect(counts.quranSessions).toBeGreaterThanOrEqual(400)
    expect(counts.portfolioEvidence).toBeGreaterThan(40)
  })

  it('uses varied attendance statuses', () => {
    const payload = buildDemoSeedPayload(configs)
    const statuses = new Set(payload.attendanceEvents.map(r => r.status))

    expect(statuses.has('present')).toBe(true)
    expect(statuses.has('partial')).toBe(true)
    expect(statuses.has('excused')).toBe(true)
    expect(statuses.has('sick')).toBe(true)
    expect(statuses.has('absent')).toBe(true)
  })

  it('sets completedAt and historical updatedAt on completed lessons', () => {
    const payload = buildDemoSeedPayload(configs)
    const completed = payload.lessonTasks.filter(t => t.status === 'completed')

    expect(completed.length).toBeGreaterThan(0)
    for (const task of completed.slice(0, 20)) {
      expect(task.completedAt).not.toBeNull()
      expect(task.updatedAt.toISOString().slice(0, 10)).toBe(task.dueDate)
    }
  })

  it('covers HISTORY_DAYS window', () => {
    expect(HISTORY_DAYS).toBe(150)
  })
})
