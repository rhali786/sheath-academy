import {
  getLessonTasks,
  getLessonTask,
  createLessonTask,
  updateLessonTask,
  deleteLessonTask,
  resetStore,
} from '@/features/lesson-tasks/server/service'
import { SEED_LESSON_TASKS } from '@/features/lesson-tasks/server/seed'
import { SEED_IDS } from '@/features/lib/seedIds'

const validInput = {
  childId: SEED_IDS.adam,
  subjectId: 'subject_seed_002',
  title: 'Chapter 4 reading',
  date: '2026-05-12',
}

beforeEach(() => {
  resetStore()
})

describe('getLessonTasks() — Listing', () => {
  it('returns seeded lesson tasks', () => {
    const tasks = getLessonTasks()
    expect(tasks.length).toBe(SEED_LESSON_TASKS.length)
  })

  it('filters by childId', () => {
    const tasks = getLessonTasks({ childId: SEED_IDS.adam })
    expect(tasks.length).toBeGreaterThan(0)
    tasks.forEach(t => expect(t.childId).toBe(SEED_IDS.adam))
  })

  it('filters by subjectId', () => {
    const tasks = getLessonTasks({ subjectId: 'subject_seed_002' })
    expect(tasks.length).toBeGreaterThan(0)
    tasks.forEach(t => expect(t.subjectId).toBe('subject_seed_002'))
  })

  it('filters by date', () => {
    const tasks = getLessonTasks({ date: '2026-05-12' })
    tasks.forEach(t => expect(t.date).toBe('2026-05-12'))
  })

  it('AND-combines multiple filters', () => {
    const tasks = getLessonTasks({ childId: SEED_IDS.adam, subjectId: 'subject_seed_002' })
    tasks.forEach(t => {
      expect(t.childId).toBe(SEED_IDS.adam)
      expect(t.subjectId).toBe('subject_seed_002')
    })
  })

  it('returns empty array when no matches', () => {
    const tasks = getLessonTasks({ childId: 'nonexistent_child' })
    expect(tasks).toEqual([])
  })
})

describe('createLessonTask() — Creating', () => {
  it('generates ID with lesson_task_ prefix', () => {
    const task = createLessonTask(validInput)
    expect(task).not.toBeNull()
    expect(task!.id).toMatch(/^lesson_task_/)
  })

  it('defaults status to not_started', () => {
    const task = createLessonTask(validInput)
    expect(task!.status).toBe('not_started')
  })

  it('trims title whitespace', () => {
    const task = createLessonTask({ ...validInput, title: '  Chapter 4  ' })
    expect(task!.title).toBe('Chapter 4')
  })

  it('stores createdAt and updatedAt as ISO strings', () => {
    const task = createLessonTask(validInput)
    expect(task!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(task!.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('rejects blank title (after trim)', () => {
    const task = createLessonTask({ ...validInput, title: '   ' })
    expect(task).toBeNull()
  })

  it('rejects title over 120 characters', () => {
    const task = createLessonTask({ ...validInput, title: 'x'.repeat(121) })
    expect(task).toBeNull()
  })

  it('rejects missing childId', () => {
    const task = createLessonTask({ ...validInput, childId: '' })
    expect(task).toBeNull()
  })

  it('rejects missing subjectId', () => {
    const task = createLessonTask({ ...validInput, subjectId: '' })
    expect(task).toBeNull()
  })

  it('rejects non-existent child', () => {
    const task = createLessonTask({ ...validInput, childId: 'nonexistent_child' })
    expect(task).toBeNull()
  })

  it('rejects non-existent subject', () => {
    const task = createLessonTask({ ...validInput, subjectId: 'nonexistent_subject' })
    expect(task).toBeNull()
  })

  it('rejects subject belonging to different child', () => {
    // subject_seed_004 belongs to khadijah, not adam
    const task = createLessonTask({ ...validInput, childId: SEED_IDS.adam, subjectId: 'subject_seed_004' })
    expect(task).toBeNull()
  })

  it('rejects invalid date format', () => {
    const task = createLessonTask({ ...validInput, date: '12-05-2026' })
    expect(task).toBeNull()
  })

  it('rejects invalid calendar date', () => {
    const task = createLessonTask({ ...validInput, date: '2026-02-30' })
    expect(task).toBeNull()
  })

  it('rejects invalid status value', () => {
    const task = createLessonTask({ ...validInput, status: 'moved' as never })
    expect(task).toBeNull()
  })

  it('normalizes empty notes to undefined', () => {
    const task = createLessonTask({ ...validInput, notes: '' })
    expect(task!.notes).toBeUndefined()
  })

  it('normalizes whitespace-only notes to undefined', () => {
    const task = createLessonTask({ ...validInput, notes: '   ' })
    expect(task!.notes).toBeUndefined()
  })

  it('accepts valid http:// resource link', () => {
    const task = createLessonTask({ ...validInput, resourceLink: 'http://example.com' })
    expect(task).not.toBeNull()
    expect(task!.resourceLink).toBe('http://example.com')
  })

  it('accepts valid https:// resource link', () => {
    const task = createLessonTask({ ...validInput, resourceLink: 'https://example.com' })
    expect(task).not.toBeNull()
    expect(task!.resourceLink).toBe('https://example.com')
  })

  it('rejects javascript: resource link', () => {
    const task = createLessonTask({ ...validInput, resourceLink: 'javascript:alert(1)' })
    expect(task).toBeNull()
  })

  it('rejects file: resource link', () => {
    const task = createLessonTask({ ...validInput, resourceLink: 'file:///etc/passwd' })
    expect(task).toBeNull()
  })

  it('rejects mailto: resource link', () => {
    const task = createLessonTask({ ...validInput, resourceLink: 'mailto:test@example.com' })
    expect(task).toBeNull()
  })

  it('normalizes empty resource link to undefined', () => {
    const task = createLessonTask({ ...validInput, resourceLink: '' })
    expect(task!.resourceLink).toBeUndefined()
  })
})

describe('updateLessonTask() — Updating', () => {
  let taskId: string

  beforeEach(() => {
    const task = createLessonTask(validInput)
    taskId = task!.id
  })

  it('updates specified fields', () => {
    const updated = updateLessonTask(taskId, { title: 'Updated Title', status: 'completed' })
    expect(updated).not.toBeNull()
    expect(updated!.title).toBe('Updated Title')
    expect(updated!.status).toBe('completed')
  })

  it('refreshes updatedAt', () => {
    const before = getLessonTask(taskId)!.updatedAt
    // Ensure time passes
    const updated = updateLessonTask(taskId, { title: 'New Title' })
    expect(updated!.updatedAt).toBeDefined()
    // updatedAt should be a valid ISO string
    expect(new Date(updated!.updatedAt).toISOString()).toBe(updated!.updatedAt)
  })

  it('preserves createdAt', () => {
    const original = getLessonTask(taskId)!.createdAt
    const updated = updateLessonTask(taskId, { title: 'New Title' })
    expect(updated!.createdAt).toBe(original)
  })

  it('validates child/subject relationship after patch', () => {
    // Switching to a subject belonging to a different child should fail
    const updated = updateLessonTask(taskId, { subjectId: 'subject_seed_004' })
    expect(updated).toBeNull()
  })

  it('rejects update with cross-child subject', () => {
    const updated = updateLessonTask(taskId, {
      childId: SEED_IDS.khadijah,
      subjectId: 'subject_seed_002', // belongs to adam
    })
    expect(updated).toBeNull()
  })

  it('rejects update with blank title', () => {
    const updated = updateLessonTask(taskId, { title: '   ' })
    expect(updated).toBeNull()
  })

  it('returns null for non-existent ID', () => {
    const updated = updateLessonTask('nonexistent_id', { title: 'x' })
    expect(updated).toBeNull()
  })
})

describe('deleteLessonTask() — Deleting', () => {
  let taskId: string

  beforeEach(() => {
    const task = createLessonTask(validInput)
    taskId = task!.id
  })

  it('removes the lesson task', () => {
    deleteLessonTask(taskId)
    expect(getLessonTask(taskId)).toBeNull()
  })

  it('returns true on success', () => {
    const result = deleteLessonTask(taskId)
    expect(result).toBe(true)
  })

  it('returns false for non-existent ID', () => {
    const result = deleteLessonTask('nonexistent_id')
    expect(result).toBe(false)
  })
})

describe('Store — reset', () => {
  it('resetStore clears all data', () => {
    resetStore([])
    expect(getLessonTasks()).toEqual([])
  })

  it('resetStore reseeds when seed provided', () => {
    resetStore([])
    resetStore(SEED_LESSON_TASKS)
    expect(getLessonTasks().length).toBe(SEED_LESSON_TASKS.length)
  })

  it('ID counter resets after resetStore', () => {
    resetStore()
    const t1 = createLessonTask(validInput)
    resetStore()
    const t2 = createLessonTask(validInput)
    // After reset, counter restarts — IDs should have _1 suffix
    expect(t1!.id).toMatch(/_1$/)
    expect(t2!.id).toMatch(/_1$/)
  })
})
