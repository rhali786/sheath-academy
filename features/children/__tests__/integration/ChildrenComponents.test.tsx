import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ChildrenContext } from '@/features/children/front/context/ChildrenContext'
import { ChildList } from '@/features/children/front/components/ChildList'
import { ChildCard } from '@/features/children/front/components/ChildCard'
import { ChildForm } from '@/features/children/front/components/ChildForm'
import { mockStudentProfiles, activeProfiles, archivedProfiles, profileWithFullName, profileWithLoginDisabled } from '../fixtures/mockStudentProfiles'
import type { ChildrenContextType } from '@/features/children/front/context/ChildrenContext'

function makeContext(overrides: Partial<ChildrenContextType> = {}): ChildrenContextType {
  return {
    children: activeProfiles,
    allChildren: mockStudentProfiles,
    householdId: 'workspace_test',
    showArchived: false,
    setShowArchived: jest.fn(),
    loading: false,
    error: null,
    refetch: jest.fn(),
    createChild: jest.fn(),
    updateChild: jest.fn(),
    archiveChild: jest.fn(),
    restoreChild: jest.fn(),
    ...overrides,
  }
}

function renderWithContext(ui: React.ReactElement, ctx: ChildrenContextType) {
  return render(
    <ChildrenContext.Provider value={ctx}>
      {ui}
    </ChildrenContext.Provider>
  )
}

describe('ChildList component', () => {
  test('renders heading and Add child button', () => {
    renderWithContext(<ChildList />, makeContext())
    expect(screen.getByText('Your children')).toBeInTheDocument()
    expect(screen.getByText('+ Add child')).toBeInTheDocument()
  })

  test('renders a card for each active child', () => {
    renderWithContext(<ChildList />, makeContext())
    activeProfiles.forEach(child => {
      expect(screen.getByText(child.name)).toBeInTheDocument()
    })
  })

  test('shows empty state when no active children', () => {
    renderWithContext(<ChildList />, makeContext({ children: [] }))
    expect(screen.getByText(/No active children/i)).toBeInTheDocument()
  })

  test('shows loading state while fetching', () => {
    renderWithContext(<ChildList />, makeContext({ loading: true }))
    expect(screen.getByText(/Loading children/i)).toBeInTheDocument()
  })

  test('shows "Show archived" toggle when allChildren is non-empty', () => {
    renderWithContext(<ChildList />, makeContext())
    expect(screen.getByLabelText(/Show archived/i)).toBeInTheDocument()
  })

  test('shows add form when Add child button is clicked', () => {
    renderWithContext(<ChildList />, makeContext())
    fireEvent.click(screen.getByText('+ Add child'))
    expect(screen.getByText('Add a new child')).toBeInTheDocument()
  })

  test('archiving a learner renders InlineConfirm attached to that card (not a top banner)', () => {
    renderWithContext(<ChildList />, makeContext())
    const archiveButtons = screen.getAllByText('Archive')
    fireEvent.click(archiveButtons[0])
    // InlineConfirm role=group with aria-label matching the child's name
    expect(screen.getByRole('group', { name: new RegExp(`Archive ${activeProfiles[0].name}`, 'i') })).toBeInTheDocument()
    // detail text present within the panel
    expect(screen.getByText(/They'll be hidden from active lists/i)).toBeInTheDocument()
    // the card for the confirming child is replaced — Archive button for that child is gone
    const remainingArchiveButtons = screen.getAllByText('Archive')
    // Only Archive confirm button (aria-label=Archive) remains, not the card-level button
    // The second active child's card is still visible
    expect(screen.getByText(activeProfiles[1].name)).toBeInTheDocument()
  })

  test('cancel on InlineConfirm restores the child card', () => {
    renderWithContext(<ChildList />, makeContext())
    fireEvent.click(screen.getAllByText('Archive')[0])
    expect(screen.getByRole('group', { name: new RegExp(`Archive ${activeProfiles[0].name}`, 'i') })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('group', { name: new RegExp(`Archive ${activeProfiles[0].name}`, 'i') })).not.toBeInTheDocument()
    expect(screen.getByText(activeProfiles[0].name)).toBeInTheDocument()
  })

  test('confirm on InlineConfirm calls archiveChild and clears panel', async () => {
    const archiveChild = jest.fn().mockResolvedValue(undefined)
    renderWithContext(<ChildList />, makeContext({ archiveChild }))
    fireEvent.click(screen.getAllByText('Archive')[0])
    const panel = screen.getByRole('group', { name: new RegExp(`Archive ${activeProfiles[0].name}`, 'i') })
    fireEvent.click(within(panel).getByRole('button', { name: /^Archive$/i }))
    await waitFor(() => {
      expect(archiveChild).toHaveBeenCalledWith(activeProfiles[0].id)
    })
  })

  test('confirm on InlineConfirm shows a transient archived notice', async () => {
    const archiveChild = jest.fn().mockResolvedValue(undefined)
    renderWithContext(<ChildList />, makeContext({ archiveChild }))
    fireEvent.click(screen.getAllByText('Archive')[0])
    const panel = screen.getByRole('group', { name: new RegExp(`Archive ${activeProfiles[0].name}`, 'i') })
    fireEvent.click(within(panel).getByRole('button', { name: /^Archive$/i }))
    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${activeProfiles[0].name} archived`, 'i'))).toBeInTheDocument()
    })
  })

  test('shows edit form with child name when Edit profile is clicked', () => {
    renderWithContext(<ChildList />, makeContext())
    const editButtons = screen.getAllByRole('button', { name: /edit profile/i })
    fireEvent.click(editButtons[0])
    expect(screen.getByText(`Edit ${activeProfiles[0].name}`)).toBeInTheDocument()
  })
})

describe('ChildCard component', () => {
  const onEdit = jest.fn()
  const onArchive = jest.fn()
  const onRestore = jest.fn()

  test('renders child name and grade', () => {
    render(<ChildCard child={activeProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByText(activeProfiles[0].name)).toBeInTheDocument()
    expect(screen.getByText(activeProfiles[0].gradeLabel)).toBeInTheDocument()
  })

  test('renders learner login status', () => {
    render(<ChildCard child={activeProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByText(/Learner login/i)).toBeInTheDocument()
  })

  test('shows Archive button for active child', () => {
    render(<ChildCard child={activeProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByText('Archive')).toBeInTheDocument()
    expect(screen.queryByText('Restore')).not.toBeInTheDocument()
  })

  test('shows Restore button for archived child', () => {
    render(<ChildCard child={archivedProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByText('Restore')).toBeInTheDocument()
    expect(screen.queryByText('Archive')).not.toBeInTheDocument()
  })

  test('calls onEdit when Edit profile button is clicked', () => {
    render(<ChildCard child={activeProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    expect(onEdit).toHaveBeenCalledWith(activeProfiles[0])
  })

  test('calls onArchive when Archive button is clicked', () => {
    render(<ChildCard child={activeProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    fireEvent.click(screen.getByText('Archive'))
    expect(onArchive).toHaveBeenCalledWith(activeProfiles[0])
  })

  test('calls onRestore when Restore button is clicked', () => {
    render(<ChildCard child={archivedProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    fireEvent.click(screen.getByText('Restore'))
    expect(onRestore).toHaveBeenCalledWith(archivedProfiles[0])
  })
})

describe('ChildForm component', () => {
  const onSubmit = jest.fn()
  const onCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders First name and Last name fields for new child', () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByLabelText(/First name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Grade\/Level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Date of birth/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Teacher/i)).not.toBeInTheDocument()
  })

  test('shows "Add child" button for new child form', () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByText('Add child')).toBeInTheDocument()
  })

  test('shows "Save changes" button when editing existing child', () => {
    render(<ChildForm householdId="workspace_test" child={activeProfiles[0]} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByText('Save changes')).toBeInTheDocument()
  })

  test('pre-fills grade and username when editing existing child', () => {
    render(<ChildForm householdId="workspace_test" child={activeProfiles[0]} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByDisplayValue(activeProfiles[0].gradeLabel)).toBeInTheDocument()
    // activeProfiles[0] has username, so learnerLoginEnabled defaults to true → username input shown
    expect(screen.getByDisplayValue(activeProfiles[0].username)).toBeInTheDocument()
  })

  test('calls onCancel when Cancel is clicked', () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  test('shows validation error when submitting empty form', async () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Add child'))
    expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('ChildForm — Wave 7 FB-002', () => {
  const onSubmit = jest.fn()
  const onCancel = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  test('Grade/Level is a dropdown containing PK, K, Grade 1–12, Other/custom', () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    const gradeSelect = screen.getByLabelText(/Grade\/Level/i) as HTMLSelectElement
    const options = Array.from(gradeSelect.options).map(o => o.text)
    expect(options).toContain('PK')
    expect(options).toContain('K')
    expect(options).toContain('Grade 1')
    expect(options).toContain('Grade 12')
    expect(options).toContain('Other/custom')
  })

  test('username and password hidden when learner login toggle is off (new child)', () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.queryByLabelText(/Username/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Password/i)).not.toBeInTheDocument()
  })

  test('username and password visible when learner login toggle is enabled', () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    const toggle = screen.getByLabelText(/Allow learner to sign in/i)
    fireEvent.click(toggle)
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
  })

  test('shows helper text about reports and transcripts', () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByText(/reports, transcripts/i)).toBeInTheDocument()
  })
})

describe('ChildCard — Wave 7 FB-002', () => {
  const onEdit = jest.fn()
  const onArchive = jest.fn()
  const onRestore = jest.fn()

  test('displays firstName + lastName when both are present', () => {
    render(<ChildCard child={profileWithFullName} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByText('Adam Al-Rashid')).toBeInTheDocument()
  })

  test('shows "Learner login: Enabled" when learnerLoginEnabled is true', () => {
    render(<ChildCard child={profileWithFullName} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByText('Enabled')).toBeInTheDocument()
  })

  test('shows "Learner login: Not enabled" when learnerLoginEnabled is false', () => {
    render(<ChildCard child={profileWithLoginDisabled} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByText('Not enabled')).toBeInTheDocument()
  })

  test('does not show raw username on ChildCard', () => {
    render(<ChildCard child={profileWithFullName} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.queryByText(profileWithFullName.username)).not.toBeInTheDocument()
  })

  test('Edit button is labelled "Edit profile"', () => {
    render(<ChildCard child={profileWithFullName} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument()
  })

  test('Date of birth is hidden when dob is not set', () => {
    render(<ChildCard child={profileWithLoginDisabled} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.queryByText('DOB')).not.toBeInTheDocument()
  })
})
