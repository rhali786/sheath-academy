/** @jest-environment node */

jest.mock('@/features/children/server/service', () => ({
  getStudentProfile: jest.fn((id: string) =>
    id === 'child_a' ? { id: 'child_a' } : null
  ),
}))

jest.mock('@/features/subjects/server/service', () => ({
  getSubject: jest.fn((id: string) =>
    id === 'sub_a' ? { id: 'sub_a', childId: 'child_a' } : null
  ),
}))

jest.mock('@/features/plan/server/service', () => ({
  getLessonTask: jest.fn((id: string) =>
    id === 'lesson_a' ? { id: 'lesson_a', childId: 'child_a' } : undefined
  ),
}))

import {
  listEvidenceItems,
  getEvidenceItemById,
  createEvidenceItem,
  updateEvidenceItem,
  deleteEvidenceItem,
  listEvidenceByChild,
  listEvidenceBySubject,
  listEvidenceByLessonTask,
  resetEvidenceStore,
} from '@/features/portfolio/server/service'
import type { CreateEvidenceItemInput } from '@/features/portfolio/types'

function validInput(overrides: Partial<CreateEvidenceItemInput> = {}): CreateEvidenceItemInput {
  return {
    title: 'Test Evidence',
    childId: 'child_a',
    subjectId: 'sub_a',
    date: '2026-05-12',
    type: 'note',
    notes: 'Some notes',
    ...overrides,
  }
}

beforeEach(() => {
  resetEvidenceStore()
})

describe('createEvidenceItem', () => {
  it('creates an evidence item with valid input', () => {
    const { item, errors } = createEvidenceItem(validInput())
    expect(errors).toHaveLength(0)
    expect(item).not.toBeNull()
    expect(item?.title).toBe('Test Evidence')
    expect(item?.childId).toBe('child_a')
    expect(item?.id).toBeDefined()
    expect(item?.createdAt).toBeDefined()
    expect(item?.updatedAt).toBeDefined()
    expect(item?.createdBy).toBe('system')
  })

  it('returns errors and does not insert for invalid input', () => {
    const before = listEvidenceItems().length
    const { item, errors } = createEvidenceItem(validInput({ title: '' }))
    expect(errors.length).toBeGreaterThan(0)
    expect(item).toBeNull()
    expect(listEvidenceItems().length).toBe(before)
  })

  it('creates evidence with lessonTaskId', () => {
    const { item, errors } = createEvidenceItem(validInput({ lessonTaskId: 'lesson_a' }))
    expect(errors).toHaveLength(0)
    expect(item?.lessonTaskId).toBe('lesson_a')
  })
})

describe('listEvidenceItems', () => {
  it('returns all items when no filter', () => {
    createEvidenceItem(validInput({ title: 'Item 1' }))
    createEvidenceItem(validInput({ title: 'Item 2' }))
    const items = listEvidenceItems()
    expect(items.length).toBeGreaterThanOrEqual(2)
  })

  it('filters by childId', () => {
    createEvidenceItem(validInput({ title: 'For child_a' }))
    const items = listEvidenceItems({ childId: 'child_a' })
    items.forEach(i => expect(i.childId).toBe('child_a'))
    expect(items.length).toBeGreaterThan(0)
  })

  it('filters by subjectId', () => {
    createEvidenceItem(validInput({ title: 'Sub A' }))
    const items = listEvidenceItems({ subjectId: 'sub_a' })
    items.forEach(i => expect(i.subjectId).toBe('sub_a'))
    expect(items.length).toBeGreaterThan(0)
  })

  it('filters by lessonTaskId', () => {
    createEvidenceItem(validInput({ lessonTaskId: 'lesson_a' }))
    createEvidenceItem(validInput({ title: 'No lesson' }))
    const items = listEvidenceItems({ lessonTaskId: 'lesson_a' })
    items.forEach(i => expect(i.lessonTaskId).toBe('lesson_a'))
    expect(items.length).toBe(1)
  })
})

describe('listEvidenceByChild', () => {
  it('returns items for the given child', () => {
    createEvidenceItem(validInput({ title: 'Child A item' }))
    const items = listEvidenceByChild('child_a')
    expect(items.length).toBeGreaterThan(0)
    items.forEach(i => expect(i.childId).toBe('child_a'))
  })

  it('returns empty for unknown child', () => {
    const items = listEvidenceByChild('unknown')
    expect(items).toHaveLength(0)
  })
})

describe('listEvidenceBySubject', () => {
  it('returns items for the given subject', () => {
    createEvidenceItem(validInput({ title: 'Sub item' }))
    const items = listEvidenceBySubject('child_a', 'sub_a')
    expect(items.length).toBeGreaterThan(0)
    items.forEach(i => expect(i.subjectId).toBe('sub_a'))
  })
})

describe('listEvidenceByLessonTask', () => {
  it('returns items linked to the lesson task', () => {
    createEvidenceItem(validInput({ lessonTaskId: 'lesson_a' }))
    createEvidenceItem(validInput({ title: 'No link' }))
    const items = listEvidenceByLessonTask('lesson_a')
    expect(items.length).toBe(1)
    expect(items[0].lessonTaskId).toBe('lesson_a')
  })
})

describe('getEvidenceItemById', () => {
  it('returns the correct item', () => {
    const { item } = createEvidenceItem(validInput({ title: 'Find me' }))
    const found = getEvidenceItemById(item!.id)
    expect(found?.title).toBe('Find me')
  })

  it('returns undefined for unknown id', () => {
    expect(getEvidenceItemById('nope')).toBeUndefined()
  })
})

describe('updateEvidenceItem', () => {
  it('patches the item correctly', () => {
    const { item } = createEvidenceItem(validInput({ title: 'Original' }))
    const { item: updated, errors } = updateEvidenceItem(item!.id, { title: 'Updated' })
    expect(errors).toHaveLength(0)
    expect(updated?.title).toBe('Updated')
    expect(updated?.subjectId).toBe('sub_a')
  })

  it('returns errors for invalid patch', () => {
    const { item } = createEvidenceItem(validInput())
    const { item: updated, errors } = updateEvidenceItem(item!.id, { title: '' })
    expect(errors.length).toBeGreaterThan(0)
    expect(updated).toBeNull()
  })

  it('returns null item when id not found', () => {
    const { item, errors } = updateEvidenceItem('nonexistent', { title: 'X' })
    expect(item).toBeNull()
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('deleteEvidenceItem', () => {
  it('removes the item and returns true', () => {
    const { item } = createEvidenceItem(validInput())
    const result = deleteEvidenceItem(item!.id)
    expect(result).toBe(true)
    expect(getEvidenceItemById(item!.id)).toBeUndefined()
  })

  it('returns false for unknown id', () => {
    expect(deleteEvidenceItem('nope')).toBe(false)
  })
})

describe('Feature 31 — reflection field', () => {
  it('createEvidenceItem stores reflection when provided', () => {
    const { item, errors } = createEvidenceItem(
      validInput({ reflection: 'This shows mastery of the topic.' })
    )
    expect(errors).toHaveLength(0)
    expect(item?.reflection).toBe('This shows mastery of the topic.')
  })
})

describe('Feature 32 — extended filters and 50-item limit', () => {
  it('listEvidenceItems filters by type', () => {
    createEvidenceItem(validInput({ title: 'A note', type: 'note' }))
    createEvidenceItem(validInput({ title: 'A link', type: 'link', url: 'https://example.com' }))
    const notes = listEvidenceItems({ type: 'note' })
    notes.forEach(i => expect(i.type).toBe('note'))
    expect(notes.length).toBeGreaterThan(0)
    const links = listEvidenceItems({ type: 'link' })
    links.forEach(i => expect(i.type).toBe('link'))
  })

  it('listEvidenceItems filters by startDate', () => {
    createEvidenceItem(validInput({ title: 'Early', date: '2026-01-01' }))
    createEvidenceItem(validInput({ title: 'Late', date: '2026-06-01' }))
    const items = listEvidenceItems({ startDate: '2026-06-01' })
    items.forEach(i => expect(i.date >= '2026-06-01').toBe(true))
    expect(items.some(i => i.title === 'Late')).toBe(true)
    expect(items.some(i => i.title === 'Early')).toBe(false)
  })

  it('listEvidenceItems filters by endDate', () => {
    createEvidenceItem(validInput({ title: 'Early', date: '2026-01-01' }))
    createEvidenceItem(validInput({ title: 'Late', date: '2026-06-01' }))
    const items = listEvidenceItems({ endDate: '2026-01-31' })
    items.forEach(i => expect(i.date <= '2026-01-31').toBe(true))
    expect(items.some(i => i.title === 'Early')).toBe(true)
    expect(items.some(i => i.title === 'Late')).toBe(false)
  })

  it('listEvidenceItems returns max 50 items', () => {
    for (let i = 0; i < 55; i++) {
      createEvidenceItem(validInput({ title: `Item ${i}` }))
    }
    const items = listEvidenceItems()
    expect(items.length).toBeLessThanOrEqual(50)
  })

  it('sorts newest created evidence first', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-05-01T09:00:00Z'))
    createEvidenceItem(validInput({ title: 'Older item' }))
    jest.setSystemTime(new Date('2026-05-02T09:00:00Z'))
    createEvidenceItem(validInput({ title: 'Newer item' }))

    const items = listEvidenceItems().filter(i => i.title.endsWith('item'))

    expect(items[0].title).toBe('Newer item')
    jest.useRealTimers()
  })
})
