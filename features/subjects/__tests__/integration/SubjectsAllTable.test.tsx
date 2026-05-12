/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubjectsAllTable } from '@/features/subjects/front/components/SubjectsAllTable'
import type { SubjectCourse } from '@/features/subjects/types'

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(),
    archiveSubject: jest.fn(),
    updateSubject: jest.fn(),
  },
}))

const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: {
    getSubjects: jest.Mock
    archiveSubject: jest.Mock
    updateSubject: jest.Mock
  }
}

const childrenList = [
  { id: 'c1', name: 'Ada' },
  { id: 'c2', name: 'Ben' },
]

const rows: SubjectCourse[] = [
  {
    id: 's1',
    childId: 'c1',
    name: 'Algebra I',
    category: 'Math',
    isActive: true,
    order: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 's2',
    childId: 'c2',
    name: 'Literature',
    category: 'Reading',
    isActive: true,
    order: 0,
    createdAt: '2026-01-01',
  },
]

describe('SubjectsAllTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    subjectsApi.getSubjects.mockResolvedValue({ data: rows, status: 'success', message: '', timestamp: '' })
    subjectsApi.archiveSubject.mockResolvedValue({ data: rows[0], status: 'success', message: '', timestamp: '' })
  })

  it('renders table with child names', async () => {
    render(<SubjectsAllTable childrenList={childrenList} refreshKey={0} />)
    await waitFor(() => {
      expect(screen.getByTestId('subjects-all-table')).toBeInTheDocument()
    })
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Ben')).toBeInTheDocument()
    expect(screen.getByText('Algebra I')).toBeInTheDocument()
    expect(screen.getByText('Literature')).toBeInTheDocument()
  })

  it('opens edit dialog when Edit is clicked', async () => {
    render(<SubjectsAllTable childrenList={childrenList} refreshKey={0} />)
    await waitFor(() => expect(screen.getByTestId('subjects-all-table')).toBeInTheDocument())
    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    await userEvent.click(editButtons[0])
    expect(screen.getByRole('dialog', { name: /edit subject/i })).toBeInTheDocument()
    expect(screen.getByTestId('subject-edit-form')).toBeInTheDocument()
  })
})
