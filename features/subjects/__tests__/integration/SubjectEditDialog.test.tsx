/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubjectEditDialog } from '@/features/subjects/front/components/SubjectEditDialog'
import type { SubjectCourse } from '@/features/subjects/types'
import type { Resource } from '@/features/resources/types'

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    updateSubject: jest.fn(),
  },
}))

jest.mock('@/features/resources/front/services/api', () => ({
  resourcesApi: {
    listResources: jest.fn(),
  },
}))

const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { updateSubject: jest.Mock }
}

const { resourcesApi } = jest.requireMock('@/features/resources/front/services/api') as {
  resourcesApi: { listResources: jest.Mock }
}

const childrenList = [
  { id: 'c1', name: 'Ada' },
  { id: 'c2', name: 'Ben' },
]

const resourcesList: Resource[] = [
  {
    id: 'r1',
    workspaceId: 'household_001',
    title: 'Singapore Math 5A',
    resourceType: 'textbook',
    verificationStatus: 'verified',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'r2',
    workspaceId: 'household_001',
    title: 'Khan Academy Algebra',
    resourceType: 'online-course',
    verificationStatus: 'verified',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

const subject: SubjectCourse = {
  id: 's1',
  childId: 'c1',
  learnerIds: ['c1'],
  resourceIds: [],
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
    resourcesApi.listResources.mockResolvedValue({
      data: resourcesList,
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
        resourceIds: [],
      })
    })
    expect(onSaved).toHaveBeenCalled()
  })

  it('renders a Linked resources multi-select populated from resourcesApi.getResources()', async () => {
    render(
      <SubjectEditDialog
        open
        subject={subject}
        childrenList={childrenList}
        onClose={jest.fn()}
        onSaved={jest.fn()}
      />,
    )

    expect(resourcesApi.listResources).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText('Singapore Math 5A')).toBeInTheDocument()
      expect(screen.getByText('Khan Academy Algebra')).toBeInTheDocument()
    })
  })

  it('pre-selects resourceIds already linked to the course', async () => {
    render(
      <SubjectEditDialog
        open
        subject={{ ...subject, resourceIds: ['r2'] }}
        childrenList={childrenList}
        onClose={jest.fn()}
        onSaved={jest.fn()}
      />,
    )

    await waitFor(() => {
      const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
      expect(boxes.find((b) => b.closest('label')?.textContent?.includes('Khan Academy Algebra'))?.checked).toBe(true)
      expect(boxes.find((b) => b.closest('label')?.textContent?.includes('Singapore Math 5A'))?.checked).toBe(false)
    })
  })

  it('toggling a resource and saving calls the update API with the updated resourceIds', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('Singapore Math 5A')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('checkbox', { name: /Singapore Math 5A/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(subjectsApi.updateSubject).toHaveBeenCalledWith('s1', {
        name: 'Algebra I',
        learnerIds: ['c1'],
        category: 'Math',
        resourceIds: ['r1'],
      })
    })
    expect(onSaved).toHaveBeenCalled()
  })
})
