/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubjectForm } from '@/features/subjects/front/components/SubjectForm'
import type { StudentProfile } from '@/features/lib/types'

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    createSubject: jest.fn(),
  },
}))

const { childrenApi } = jest.requireMock('@/features/children/front/services/api') as {
  childrenApi: { getAllChildren: jest.Mock }
}
const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { createSubject: jest.Mock }
}

const oneChild: StudentProfile[] = [
  {
    id: 'kid1',
    householdId: 'h1',
    name: 'Test Child',
    gradeLabel: '3',
    username: 't',
    password: 'p',
    isActive: true,
    createdAt: '2026-01-01',
  },
]

describe('SubjectForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state while fetching children', () => {
    childrenApi.getAllChildren.mockReturnValue(new Promise(() => {}))
    render(<SubjectForm />)
    expect(screen.getByTestId('subject-form-loading')).toBeInTheDocument()
  })

  it('renders empty state when no children exist', async () => {
    childrenApi.getAllChildren.mockResolvedValue({ data: [] })
    render(<SubjectForm />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form-no-children')).toBeInTheDocument()
    })
  })

  it('submits valid form and calls onSuccess', async () => {
    childrenApi.getAllChildren.mockResolvedValue({ data: oneChild })
    subjectsApi.createSubject.mockResolvedValue({ data: {}, status: 'success' })
    const onSuccess = jest.fn()
    render(<SubjectForm onSuccess={onSuccess} />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form')).toBeInTheDocument()
    })
    await userEvent.type(screen.getByPlaceholderText(/Algebra/i), 'Algebra I')
    await userEvent.click(screen.getByRole('button', { name: /Add subject/i }))
    await waitFor(() => {
      expect(subjectsApi.createSubject).toHaveBeenCalled()
    })
    expect(onSuccess).toHaveBeenCalled()
  })
})
