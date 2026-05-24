import { render, screen, waitFor } from '@testing-library/react'
import { HouseholdProvider, useHousehold } from '@/features/household/front/context'

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(() =>
      Promise.resolve({ data: { id: 'hh_1', familyName: 'Test', weekStartDay: 'Monday' }, status: 'success', message: '', timestamp: '' })
    ),
  },
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(() =>
      Promise.resolve({
        data: [
          { id: 'c1', householdId: 'hh_1', name: 'Adam', isActive: true, gradeLabel: '5', username: 'adam', password: '', createdAt: '' },
          { id: 'c2', householdId: 'hh_1', name: 'Khadijah', isActive: true, gradeLabel: '3', username: 'k', password: '', createdAt: '' },
        ],
        status: 'success',
        message: '',
        timestamp: '',
      })
    ),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(() =>
      Promise.resolve({
        data: [
          { id: 's1', name: 'Math', childId: 'c1', category: 'Mathematics', isActive: true, order: 1, createdAt: '' },
          { id: 's2', name: 'Quran', childId: 'c2', category: 'Islamic Studies', isActive: true, order: 1, createdAt: '' },
        ],
        status: 'success',
        message: '',
        timestamp: '',
      })
    ),
  },
}))

function Consumer() {
  const { loading, studentProfiles, allSubjects, householdProfile } = useHousehold()
  if (loading) return <div>loading</div>
  return (
    <div>
      <div data-testid="family">{householdProfile?.familyName}</div>
      <div data-testid="child-count">{studentProfiles.length}</div>
      <div data-testid="subject-count">{allSubjects.length}</div>
    </div>
  )
}

describe('HouseholdProvider', () => {
  test('fetches profile, children, and subjects in parallel and exposes them via context', async () => {
    render(<HouseholdProvider><Consumer /></HouseholdProvider>)

    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())

    expect(screen.getByTestId('family').textContent).toBe('Test')
    expect(screen.getByTestId('child-count').textContent).toBe('2')
    expect(screen.getByTestId('subject-count').textContent).toBe('2')
  })

  test('loading is true until all three requests complete', async () => {
    render(<HouseholdProvider><Consumer /></HouseholdProvider>)
    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())
  })

  test('studentProfiles is empty array before load completes', () => {
    const { result } = (() => {
      let captured: ReturnType<typeof useHousehold> | null = null
      function Spy() {
        captured = useHousehold()
        return null
      }
      render(<HouseholdProvider><Spy /></HouseholdProvider>)
      return { result: captured! }
    })()
    expect(result.studentProfiles).toEqual([])
    expect(result.allSubjects).toEqual([])
  })
})
