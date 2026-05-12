/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { SubjectList } from '@/features/subjects/front/components/SubjectList'
import type { SubjectCourse } from '@/features/subjects/types'

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(),
    archiveSubject: jest.fn(),
  },
}))

const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { getSubjects: jest.Mock; archiveSubject: jest.Mock }
}

const sample: SubjectCourse[] = [
  {
    id: 's1',
    childId: 'kid1',
    name: 'Math',
    category: 'Math',
    isActive: true,
    order: 0,
    createdAt: '2026-01-01',
  },
]

describe('SubjectList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading then populated list', async () => {
    subjectsApi.getSubjects.mockResolvedValue({ data: sample })
    render(<SubjectList childId="kid1" />)
    expect(screen.getByTestId('subject-list-loading')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('subject-list')).toBeInTheDocument()
    })
    expect(screen.getByTestId('subject-list')).toHaveTextContent('Math')
  })

  it('shows empty state when no subjects', async () => {
    subjectsApi.getSubjects.mockResolvedValue({ data: [] })
    render(<SubjectList childId="kid1" />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-list-empty')).toBeInTheDocument()
    })
  })
})
