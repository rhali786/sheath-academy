/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubjectForm } from '@/features/subjects/front/components/SubjectForm'
import type { StudentProfile } from '@/features/lib/types'

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getChildren: jest.fn(),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    createSubject: jest.fn(),
  },
}))

const { childrenApi } = jest.requireMock('@/features/children/front/services/api') as {
  childrenApi: { getChildren: jest.Mock }
}
const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { createSubject: jest.Mock }
}

const householdId = 'workspace_001'

const oneChild: StudentProfile[] = [
  {
    id: 'kid1',
    householdId,
    name: 'Test Child',
    gradeLabel: '3',
    username: 't',
    password: 'p',
    isActive: true,
    createdAt: '2026-01-01',
  },
]

const twoChildren: StudentProfile[] = [
  { ...oneChild[0], id: 'k1', name: 'Ada', username: 'ada1' },
  { ...oneChild[0], id: 'k2', name: 'Ben', username: 'ben1' },
]

describe('SubjectForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state while fetching children', () => {
    childrenApi.getChildren.mockReturnValue(new Promise(() => {}))
    render(<SubjectForm householdId={householdId} />)
    expect(screen.getByTestId('subject-form-loading')).toBeInTheDocument()
  })

  it('renders no-household when householdId is blank', async () => {
    render(<SubjectForm householdId="" />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form-no-household')).toBeInTheDocument()
    })
  })

  it('renders empty state when no children exist for household', async () => {
    childrenApi.getChildren.mockResolvedValue({ data: [] })
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form-no-children')).toBeInTheDocument()
    })
  })

  it('shows child selector when one child exists', async () => {
    childrenApi.getChildren.mockResolvedValue({ data: oneChild })
    render(<SubjectForm householdId={householdId} />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form')).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/subject for \(child\)/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /subject for \(child\)/i })).toHaveValue('kid1')
  })

  it('with hideChildSelect and multiple children, omits child combobox and shows tab hint', async () => {
    childrenApi.getChildren.mockResolvedValue({ data: twoChildren })
    render(<SubjectForm householdId={householdId} hideChildSelect defaultChildId="k1" />)
    await waitFor(() => {
      expect(screen.getByTestId('subject-form')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText(/subject for \(child\)/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('subject-form-tabs-hint')).toBeInTheDocument()
  })

  it('submits valid form and calls onSuccess', async () => {
    childrenApi.getChildren.mockResolvedValue({ data: oneChild })
    subjectsApi.createSubject.mockResolvedValue({ data: {}, status: 'success' })
    const onSuccess = jest.fn()
    render(<SubjectForm householdId={householdId} onSuccess={onSuccess} />)
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
