/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RolloverCoursesPanel } from '@/features/subjects/front/components/RolloverCoursesPanel'
import type { SchoolYear } from '@/features/school-year/types'
import type { SubjectCourse } from '@/features/subjects/types'

jest.mock('@/features/school-year/front/services/api', () => ({
  schoolYearApi: {
    getSchoolYears: jest.fn(),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(),
    rolloverCourses: jest.fn(),
  },
}))

const { schoolYearApi } = jest.requireMock('@/features/school-year/front/services/api') as {
  schoolYearApi: { getSchoolYears: jest.Mock }
}
const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { getSubjects: jest.Mock; rolloverCourses: jest.Mock }
}

const activeYear: SchoolYear = {
  id: 'sy_2025',
  workspaceId: 'hh_1',
  name: '2025-2026',
  startDate: '2025-08-01',
  endDate: '2026-06-30',
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
}

const targetYear: SchoolYear = {
  id: 'sy_2026',
  workspaceId: 'hh_1',
  name: '2026-2027',
  startDate: '2026-08-01',
  endDate: '2027-06-30',
  isActive: false,
  createdAt: '2025-01-01T00:00:00.000Z',
}

const courses: SubjectCourse[] = [
  {
    id: 'subject_a',
    childId: 'l1',
    learnerIds: ['l1'],
    name: 'Algebra',
    category: 'Math',
    isActive: true,
    order: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'subject_b',
    childId: 'l1',
    learnerIds: ['l1'],
    name: 'Biology',
    category: 'Science',
    isActive: true,
    order: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
]

beforeEach(() => {
  schoolYearApi.getSchoolYears.mockReset()
  subjectsApi.getSubjects.mockReset()
  subjectsApi.rolloverCourses.mockReset()
})

describe('RolloverCoursesPanel', () => {
  it('renders loading state', () => {
    schoolYearApi.getSchoolYears.mockReturnValue(new Promise(() => {}))
    subjectsApi.getSubjects.mockReturnValue(new Promise(() => {}))
    render(<RolloverCoursesPanel householdId="hh_1" activeYear={activeYear} />)
    expect(screen.getByTestId('rollover-panel-loading')).toBeInTheDocument()
  })

  it('renders empty state when no other school year exists', async () => {
    schoolYearApi.getSchoolYears.mockResolvedValue({ data: [activeYear] })
    subjectsApi.getSubjects.mockResolvedValue({ data: courses })
    render(<RolloverCoursesPanel householdId="hh_1" activeYear={activeYear} />)
    expect(await screen.findByTestId('rollover-panel-empty')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /roll over courses/i })).not.toBeInTheDocument()
  })

  it('renders populated state with courses selected by default', async () => {
    schoolYearApi.getSchoolYears.mockResolvedValue({ data: [activeYear, targetYear] })
    subjectsApi.getSubjects.mockResolvedValue({ data: courses })
    render(<RolloverCoursesPanel householdId="hh_1" activeYear={activeYear} />)
    expect(await screen.findByTestId('rollover-panel')).toBeInTheDocument()
    expect(screen.getByLabelText('Algebra')).toBeChecked()
    expect(screen.getByLabelText('Biology')).toBeChecked()
    expect(screen.getByRole('button', { name: /roll over courses to 2026-2027/i })).toBeInTheDocument()
  })

  it('shows styled confirm; cancel skips API; confirm calls rolloverCourses', async () => {
    const user = userEvent.setup()
    schoolYearApi.getSchoolYears.mockResolvedValue({ data: [activeYear, targetYear] })
    subjectsApi.getSubjects.mockResolvedValue({ data: courses })
    subjectsApi.rolloverCourses.mockResolvedValue({ status: 'success', data: [] })

    render(<RolloverCoursesPanel householdId="hh_1" activeYear={activeYear} />)
    await screen.findByTestId('rollover-panel')

    await user.click(screen.getByLabelText('Biology'))
    await user.click(screen.getByRole('button', { name: /roll over courses to 2026-2027/i }))

    expect(screen.getByText(/roll over 1 course from 2025-2026 to 2026-2027/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(subjectsApi.rolloverCourses).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /roll over courses to 2026-2027/i }))
    await user.click(screen.getByRole('button', { name: 'Roll over' }))

    await waitFor(() => {
      expect(subjectsApi.rolloverCourses).toHaveBeenCalledWith({
        fromYearId: 'sy_2025',
        toYearId: 'sy_2026',
        courseIds: ['subject_a'],
      })
    })
    expect(await screen.findByRole('status')).toHaveTextContent(/rolled over 1 course/i)
  })
})
