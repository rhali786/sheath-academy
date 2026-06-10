import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { PeoplePage } from '@/features/children/front/pages/PeoplePage'
import { activeProfiles } from '../fixtures/mockStudentProfiles'
import type { ApiResponse } from '@/features/lib/types'

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getChildren: jest.fn(),
    createChild: jest.fn(),
    updateChild: jest.fn(),
    archiveChild: jest.fn(),
    restoreChild: jest.fn(),
  },
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

import { childrenApi } from '@/features/children/front/services/api'
import { useHousehold } from '@/features/household/front/context'

const mockGetChildren = childrenApi.getChildren as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: '', timestamp: '' }
}

beforeEach(() => {
  mockUseHousehold.mockImplementation(() => ({
    householdProfile: { id: 'hh_test' },
    studentProfiles: [],
    allSubjects: [],
    loading: false,
    refetch: jest.fn(),
  }))
  mockGetChildren.mockResolvedValue(ok(activeProfiles))
})

describe('PeoplePage', () => {
  test('shows loading then populated ChildList when children load', async () => {
    render(<PeoplePage />)
    expect(screen.getByText(/Loading children/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Your children')).toBeInTheDocument()
    })
    activeProfiles.forEach((child) => {
      expect(screen.getByText(child.name)).toBeInTheDocument()
    })
    expect(mockGetChildren).toHaveBeenCalledWith('hh_test', true)
  })

  test('shows empty state when children=[]', async () => {
    mockGetChildren.mockResolvedValue(ok([]))
    render(<PeoplePage />)
    await waitFor(() => {
      expect(screen.getByText(/No active children/i)).toBeInTheDocument()
    })
  })
})
