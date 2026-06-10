/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubjectEditDialog } from '@/features/subjects/front/components/SubjectEditDialog'
import type { SubjectCourse } from '@/features/subjects/types'

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    updateSubject: jest.fn(),
  },
}))

const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { updateSubject: jest.Mock }
}

const childrenList = [
  { id: 'c1', name: 'Ada' },
  { id: 'c2', name: 'Ben' },
]

const subject: SubjectCourse = {
  id: 's1',
  childId: 'c1',
  learnerIds: ['c1'],
  name: 'Algebra I',
  category: 'Math',
  isActive: true,
  order: 0,
  createdAt: '2026-01-01',
}

describe('SubjectEditDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    subjectsApi.updateSubject.mockResolvedValue({
      data: { ...subject, learnerIds: ['c1', 'c2'] },
      status: 'success',
      message: '',
      timestamp: '',
    })
  })

  it('pre-selects all enrolled learners as checkboxes', () => {
    render(
      <SubjectEditDialog
        open
        subject={{ ...subject, learnerIds: ['c1', 'c2'] }}
        childrenList={childrenList}
        onClose={jest.fn()}
        onSaved={jest.fn()}
      />,
    )
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(boxes.find((b) => b.closest('label')?.textContent?.includes('Ada'))?.checked).toBe(true)
    expect(boxes.find((b) => b.closest('label')?.textContent?.includes('Ben'))?.checked).toBe(true)
  })

  it('sends full learnerIds array when a second learner is checked on save', async () => {
    const onSaved = jest.fn()
    render(
      <SubjectEditDialog
        open
        subject={subject}
        childrenList={childrenList}
        onClose={jest.fn()}
        onSaved={onSaved}
      />,
    )

    await userEvent.click(screen.getByRole('checkbox', { name: /Ben/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(subjectsApi.updateSubject).toHaveBeenCalledWith('s1', {
        name: 'Algebra I',
        learnerIds: ['c1', 'c2'],
        category: 'Math',
      })
    })
    expect(onSaved).toHaveBeenCalled()
  })
})
