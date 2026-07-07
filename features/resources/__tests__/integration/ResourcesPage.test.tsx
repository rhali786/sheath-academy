/**
 * Integration tests for Wave 13 — Resources / curriculum pacing engine
 * TDD: written before full implementation
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResourceForm } from '@/features/resources/front/components/ResourceForm'
import { PacingCard } from '@/features/resources/front/components/PacingCard'
import { VerificationBadge } from '@/features/resources/front/components/VerificationBadge'
import { ResourcesPage } from '@/features/resources/front/pages/ResourcesPage'
import type { Resource } from '@/features/resources/types'
import type { HouseholdContextType } from '@/features/household/front/context/HouseholdContext'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/resources/front/services/api', () => ({
  resourcesApi: {
    listResources: jest.fn(),
    createResource: jest.fn(),
    generateLessons: jest.fn(),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    updateSubject: jest.fn(),
  },
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    createLesson: jest.fn(),
  },
}))

const { useHousehold } = jest.requireMock('@/features/household/front/context') as {
  useHousehold: jest.MockedFunction<() => HouseholdContextType>
}
const { resourcesApi: mockResourcesApi } = jest.requireMock('@/features/resources/front/services/api') as {
  resourcesApi: { listResources: jest.Mock; createResource: jest.Mock; generateLessons: jest.Mock }
}
const { subjectsApi: mockSubjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { updateSubject: jest.Mock }
}

// ── ResourceForm ──────────────────────────────────────────────────────────────

describe('ResourceForm', () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined)
  const onCancel = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it('renders title, publisher, edition, and resource type fields', () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} />)
    expect(screen.getByTestId('resource-title-input')).toBeInTheDocument()
    expect(screen.getByTestId('resource-publisher-input')).toBeInTheDocument()
    expect(screen.getByTestId('resource-edition-input')).toBeInTheDocument()
    expect(screen.getByTestId('resource-type-select')).toBeInTheDocument()
  })

  it('shows lesson generation hint after total pages are entered', async () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} />)
    expect(screen.queryByTestId('lesson-generation-hint')).not.toBeInTheDocument()

    await userEvent.type(screen.getByTestId('resource-total-pages-input'), '360')

    expect(screen.getByTestId('lesson-generation-hint')).toBeInTheDocument()
  })

  it('shows lesson generation hint after total chapters are entered', async () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByTestId('resource-total-chapters-input'), '30')
    expect(screen.getByTestId('lesson-generation-hint')).toBeInTheDocument()
  })

  it('calls onSubmit with form data when submitted', async () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByTestId('resource-title-input'), 'Saxon Math 7/6')
    await userEvent.type(screen.getByTestId('resource-publisher-input'), 'Saxon')
    fireEvent.submit(screen.getByTestId('resource-form'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saxon Math 7/6', publisher: 'Saxon' })
    ))
  })

  it('calls onCancel when Cancel is clicked', async () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('does not render the course dropdown when no courses are provided', () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} />)
    expect(screen.queryByTestId('resource-course-select')).not.toBeInTheDocument()
  })

  it('lists each enrolled course as an option in the course dropdown', () => {
    render(
      <ResourceForm
        workspaceId="ws_001"
        onSubmit={onSubmit}
        courses={[{ id: 'subject_1', name: 'Algebra' }, { id: 'subject_2', name: 'Biology' }]}
      />
    )
    const select = screen.getByTestId('resource-course-select')
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Algebra' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Biology' })).toBeInTheDocument()
  })

  it('selecting a course from the dropdown shows it as a linked-course tag and removes it from the dropdown options', async () => {
    render(
      <ResourceForm
        workspaceId="ws_001"
        onSubmit={onSubmit}
        courses={[{ id: 'subject_1', name: 'Algebra' }, { id: 'subject_2', name: 'Biology' }]}
      />
    )
    await userEvent.selectOptions(screen.getByTestId('resource-course-select'), 'subject_1')

    expect(screen.getByTestId('resource-course-tag-subject_1')).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Algebra' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Biology' })).toBeInTheDocument()
  })

  it('calls onSubmit with courseIds for each course selected via the dropdown', async () => {
    render(
      <ResourceForm
        workspaceId="ws_001"
        onSubmit={onSubmit}
        courses={[{ id: 'subject_1', name: 'Algebra' }, { id: 'subject_2', name: 'Biology' }]}
      />
    )
    await userEvent.type(screen.getByTestId('resource-title-input'), 'Saxon Math 7/6')
    await userEvent.selectOptions(screen.getByTestId('resource-course-select'), 'subject_1')
    await userEvent.selectOptions(screen.getByTestId('resource-course-select'), 'subject_2')
    fireEvent.submit(screen.getByTestId('resource-form'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ courseIds: ['subject_1', 'subject_2'] })
    ))
  })

  it('removing a linked-course tag drops it from courseIds on submit', async () => {
    render(
      <ResourceForm
        workspaceId="ws_001"
        onSubmit={onSubmit}
        courses={[{ id: 'subject_1', name: 'Algebra' }]}
      />
    )
    await userEvent.type(screen.getByTestId('resource-title-input'), 'Saxon Math 7/6')
    await userEvent.selectOptions(screen.getByTestId('resource-course-select'), 'subject_1')
    await userEvent.click(screen.getByTestId('resource-course-tag-remove-subject_1'))
    fireEvent.submit(screen.getByTestId('resource-form'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ courseIds: [] })
    ))
  })

  it('calls onSubmit with an empty courseIds array when no course is selected', async () => {
    render(
      <ResourceForm
        workspaceId="ws_001"
        onSubmit={onSubmit}
        courses={[{ id: 'subject_1', name: 'Algebra' }]}
      />
    )
    await userEvent.type(screen.getByTestId('resource-title-input'), 'Saxon Math 7/6')
    fireEvent.submit(screen.getByTestId('resource-form'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ courseIds: [] })
    ))
  })
})

// ── PacingCard ────────────────────────────────────────────────────────────────

describe('PacingCard', () => {
  it('shows behind-pace message when isOnTrack is false', () => {
    render(
      <PacingCard
        paceResult={{ pagesPerDay: 2.4, pagesPerDayNeeded: 2.525, isOnTrack: false }}
        totalPages={360}
        completedPages={57}
      />
    )
    expect(screen.getByTestId('behind-pace-message')).toBeInTheDocument()
    expect(screen.getByText(/you need 2.5 pages\/day to finish on time/i)).toBeInTheDocument()
  })

  it('shows on-pace message when isOnTrack is true', () => {
    render(
      <PacingCard
        paceResult={{ pagesPerDay: 2.4, pagesPerDayNeeded: 2.4, isOnTrack: true }}
        totalPages={360}
        completedPages={72}
      />
    )
    expect(screen.getByTestId('on-pace-message')).toBeInTheDocument()
  })
})

// ── VerificationBadge ─────────────────────────────────────────────────────────

describe('VerificationBadge', () => {
  it('renders "Verified" badge with correct testid', () => {
    render(<VerificationBadge status="verified" />)
    expect(screen.getByTestId('verification-badge-verified')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('renders "Needs review" badge with correct testid', () => {
    render(<VerificationBadge status="needs-review" />)
    expect(screen.getByTestId('verification-badge-needs-review')).toBeInTheDocument()
    expect(screen.getByText('Needs review')).toBeInTheDocument()
  })
})

// ── ResourcesPage ─────────────────────────────────────────────────────────────

describe('ResourcesPage', () => {
  const loadedHousehold: HouseholdContextType = {
    householdProfile: {
      id: 'household_001',
      workspaceId: 'household_001',
      familyName: 'Test Family',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    studentProfiles: [],
    allSubjects: [],
    familyName: 'Test Family',
    needsSetup: false,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }

  const existingResource: Resource = {
    id: 'resource_001',
    workspaceId: 'household_001',
    title: 'Saxon Math 7/6',
    resourceType: 'textbook',
    totalChapters: 12,
    verificationStatus: 'verified',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useHousehold.mockReturnValue(loadedHousehold)
  })

  it('resource card toggle reads "Plan lessons" when collapsed and "Hide" when expanded', async () => {
    mockResourcesApi.listResources.mockResolvedValue({
      status: 'success', data: [existingResource], message: '', timestamp: '',
    })

    render(<ResourcesPage />)

    const toggle = await screen.findByTestId(`resource-expand-${existingResource.id}`)
    expect(toggle).toHaveTextContent('Plan lessons')
    expect(screen.queryByTestId('lesson-generation-panel')).not.toBeInTheDocument()

    await userEvent.click(toggle)

    expect(toggle).toHaveTextContent('Hide')
    expect(screen.getByTestId('lesson-generation-panel')).toBeInTheDocument()
  })

  it('newly added resource is shown expanded with the Generate lessons panel visible', async () => {
    mockResourcesApi.listResources.mockResolvedValue({
      status: 'success', data: [], message: '', timestamp: '',
    })
    const newResource: Resource = {
      id: 'resource_002',
      workspaceId: 'household_001',
      title: 'New Reader',
      resourceType: 'reader',
      verificationStatus: 'user-submitted',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }
    mockResourcesApi.createResource.mockResolvedValue({
      status: 'success', data: newResource, message: '', timestamp: '',
    })

    render(<ResourcesPage />)

    await waitFor(() => expect(mockResourcesApi.listResources).toHaveBeenCalled())

    await userEvent.click(screen.getByTestId('add-resource-button'))
    await userEvent.type(screen.getByTestId('resource-title-input'), 'New Reader')
    fireEvent.submit(screen.getByTestId('resource-form'))

    expect(await screen.findByTestId('lesson-generation-panel')).toBeInTheDocument()
    expect(screen.getByTestId(`resource-expand-${newResource.id}`)).toHaveTextContent('Hide')
  })

  it('linking a new resource to a selected course calls subjectsApi.updateSubject with the resource id merged into resourceIds', async () => {
    mockResourcesApi.listResources.mockResolvedValue({
      status: 'success', data: [], message: '', timestamp: '',
    })
    const newResource: Resource = {
      id: 'resource_003',
      workspaceId: 'household_001',
      title: 'Algebra Workbook',
      resourceType: 'workbook',
      verificationStatus: 'user-submitted',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    }
    mockResourcesApi.createResource.mockResolvedValue({
      status: 'success', data: newResource, message: '', timestamp: '',
    })
    mockSubjectsApi.updateSubject.mockResolvedValue({
      status: 'success', data: {}, message: '', timestamp: '',
    })
    const refetch = jest.fn()
    useHousehold.mockReturnValue({
      ...loadedHousehold,
      allSubjects: [{
        id: 'subject_1',
        childId: 'child_1',
        learnerIds: ['child_1'],
        resourceIds: ['resource_existing'],
        name: 'Algebra',
        category: 'Math',
        isActive: true,
        order: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
      refetch,
    })

    render(<ResourcesPage />)
    await waitFor(() => expect(mockResourcesApi.listResources).toHaveBeenCalled())

    await userEvent.click(screen.getByTestId('add-resource-button'))
    await userEvent.type(screen.getByTestId('resource-title-input'), 'Algebra Workbook')
    await userEvent.selectOptions(screen.getByTestId('resource-course-select'), 'subject_1')
    fireEvent.submit(screen.getByTestId('resource-form'))

    await waitFor(() => expect(mockSubjectsApi.updateSubject).toHaveBeenCalledWith(
      'subject_1',
      { resourceIds: ['resource_existing', 'resource_003'] }
    ))
    expect(refetch).toHaveBeenCalled()
  })
})
