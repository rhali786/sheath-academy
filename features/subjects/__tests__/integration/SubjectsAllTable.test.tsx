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

describe('SubjectsAllTable — Wave 8 FB-003', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    subjectsApi.archiveSubject.mockResolvedValue({ data: {}, status: 'success', message: '', timestamp: '' })
  })

  it('shows ONE row for a shared course with two learners', async () => {
    const sharedCourse: SubjectCourse = {
      id: 'shared_1',
      childId: 'c1',
      learnerIds: ['c1', 'c2'],
      name: 'Family Arabic',
      category: 'Arabic',
      isActive: true,
      order: 0,
      createdAt: '2026-01-01',
    }
    subjectsApi.getSubjects.mockResolvedValue({ data: [sharedCourse], status: 'success', message: '', timestamp: '' })
    render(<SubjectsAllTable childrenList={childrenList} refreshKey={0} />)
    await waitFor(() => expect(screen.getByTestId('subjects-all-table')).toBeInTheDocument())
    // Only one row for "Family Arabic", not two
    const rows = screen.getAllByText('Family Arabic')
    expect(rows).toHaveLength(1)
  })

  it('shows learner chips for shared course', async () => {
    const sharedCourse: SubjectCourse = {
      id: 'shared_2',
      childId: 'c1',
      learnerIds: ['c1', 'c2'],
      name: 'Joint Quran',
      category: 'Quran',
      isActive: true,
      order: 0,
      createdAt: '2026-01-01',
    }
    subjectsApi.getSubjects.mockResolvedValue({ data: [sharedCourse], status: 'success', message: '', timestamp: '' })
    render(<SubjectsAllTable childrenList={childrenList} refreshKey={0} />)
    await waitFor(() => expect(screen.getByTestId('subjects-all-table')).toBeInTheDocument())
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Ben')).toBeInTheDocument()
  })

  it('renders learner names for each enrolled learner when learnerIds has 3 entries', async () => {
    const childrenList3 = [
      { id: 'c1', name: 'Ada' },
      { id: 'c2', name: 'Ben' },
      { id: 'c3', name: 'Cara' },
    ]
    const sharedCourse3: SubjectCourse = {
      id: 'shared_3',
      childId: 'c1',
      learnerIds: ['c1', 'c2', 'c3'],
      name: 'Group Quran',
      category: 'Quran',
      isActive: true,
      order: 0,
      createdAt: '2026-01-01',
    }
    subjectsApi.getSubjects.mockResolvedValue({ data: [sharedCourse3], status: 'success', message: '', timestamp: '' })
    render(<SubjectsAllTable childrenList={childrenList3} refreshKey={0} />)
    await waitFor(() => expect(screen.getByTestId('subjects-all-table')).toBeInTheDocument())
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Ben')).toBeInTheDocument()
    expect(screen.getByText('Cara')).toBeInTheDocument()
  })

  it('displays "Islamic Studies" not "IslamicStudies" in category column', async () => {
    const islamicRow: SubjectCourse = {
      id: 'isk_1',
      childId: 'c1',
      learnerIds: ['c1'],
      name: 'Fiqh',
      category: 'IslamicStudies',
      isActive: true,
      order: 0,
      createdAt: '2026-01-01',
    }
    subjectsApi.getSubjects.mockResolvedValue({ data: [islamicRow], status: 'success', message: '', timestamp: '' })
    render(<SubjectsAllTable childrenList={childrenList} refreshKey={0} />)
    await waitFor(() => expect(screen.getByTestId('subjects-all-table')).toBeInTheDocument())
    expect(screen.getByText('Islamic Studies')).toBeInTheDocument()
    expect(screen.queryByText('IslamicStudies')).not.toBeInTheDocument()
  })
})
