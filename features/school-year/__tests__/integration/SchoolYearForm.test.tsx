import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SchoolYearForm } from '@/features/school-year/front/components/SchoolYearForm'
import { schoolYearApi } from '@/features/school-year/front/services/api'

jest.mock('@/features/school-year/front/services/api', () => ({
  schoolYearApi: {
    createSchoolYear: jest.fn(),
  },
}))

const mockCreateSchoolYear = schoolYearApi.createSchoolYear as jest.Mock

const VALID_YEAR = {
  id: 'schoolyear_test_001',
  workspaceId: 'workspace_seed_001',
  name: 'Test Year',
  startDate: '2026-08-01',
  endDate: '2027-05-31',
  isActive: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SchoolYearForm component', () => {
  it('renders the form with name, startDate, endDate fields', () => {
    render(<SchoolYearForm />)
    expect(screen.getByLabelText(/School year name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/End date/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('shows a validation error when endDate is before startDate', async () => {
    render(<SchoolYearForm />)

    fireEvent.change(screen.getByLabelText(/School year name/i), {
      target: { value: 'Test Year' },
    })
    fireEvent.change(screen.getByLabelText(/Start date/i), {
      target: { value: '2026-08-01' },
    })
    fireEvent.change(screen.getByLabelText(/End date/i), {
      target: { value: '2026-07-01' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument()
    })
    expect(mockCreateSchoolYear).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data on valid submit', async () => {
    mockCreateSchoolYear.mockResolvedValueOnce({
      status: 'success',
      data: VALID_YEAR,
      message: 'Created',
      timestamp: new Date().toISOString(),
    })

    const onSuccess = jest.fn()
    render(<SchoolYearForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/School year name/i), {
      target: { value: 'Test Year' },
    })
    fireEvent.change(screen.getByLabelText(/Start date/i), {
      target: { value: '2026-08-01' },
    })
    fireEvent.change(screen.getByLabelText(/End date/i), {
      target: { value: '2027-05-31' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockCreateSchoolYear).toHaveBeenCalledWith({
        name: 'Test Year',
        startDate: '2026-08-01',
        endDate: '2027-05-31',
        isActive: true,
      })
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('shows loading state during submission', async () => {
    let resolveSubmit!: (v: unknown) => void
    mockCreateSchoolYear.mockReturnValueOnce(
      new Promise(res => {
        resolveSubmit = res
      })
    )

    render(<SchoolYearForm />)

    fireEvent.change(screen.getByLabelText(/School year name/i), {
      target: { value: 'Test Year' },
    })
    fireEvent.change(screen.getByLabelText(/Start date/i), {
      target: { value: '2026-08-01' },
    })
    fireEvent.change(screen.getByLabelText(/End date/i), {
      target: { value: '2027-05-31' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
    })

    resolveSubmit({
      status: 'success',
      data: VALID_YEAR,
      message: 'Created',
      timestamp: new Date().toISOString(),
    })
  })

  it('shows error message on API failure', async () => {
    mockCreateSchoolYear.mockRejectedValueOnce(new Error('Server error'))

    render(<SchoolYearForm />)

    fireEvent.change(screen.getByLabelText(/School year name/i), {
      target: { value: 'Test Year' },
    })
    fireEvent.change(screen.getByLabelText(/Start date/i), {
      target: { value: '2026-08-01' },
    })
    fireEvent.change(screen.getByLabelText(/End date/i), {
      target: { value: '2027-05-31' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when name is empty', async () => {
    render(<SchoolYearForm />)

    fireEvent.change(screen.getByLabelText(/Start date/i), {
      target: { value: '2026-08-01' },
    })
    fireEvent.change(screen.getByLabelText(/End date/i), {
      target: { value: '2027-05-31' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })
    expect(mockCreateSchoolYear).not.toHaveBeenCalled()
  })
})
