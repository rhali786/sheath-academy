import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChildrenContext } from '@/features/children/front/context/ChildrenContext'
import { ChildList } from '@/features/children/front/components/ChildList'
import { ChildCard } from '@/features/children/front/components/ChildCard'
import { ChildForm } from '@/features/children/front/components/ChildForm'
import { mockStudentProfiles, activeProfiles, archivedProfiles } from '../fixtures/mockStudentProfiles'
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

  test('shows archive confirm prompt when Archive is clicked on a card', () => {
    renderWithContext(<ChildList />, makeContext())
    const archiveButtons = screen.getAllByText('Archive')
    fireEvent.click(archiveButtons[0])
    expect(screen.getByText(/They'll be hidden from active lists/i)).toBeInTheDocument()
  })

  test('shows edit form with child name when Edit is clicked', () => {
    renderWithContext(<ChildList />, makeContext())
    const editButtons = screen.getAllByText('Edit')
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

  test('renders teacher name when present', () => {
    render(<ChildCard child={activeProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByText(activeProfiles[0].teacherName!)).toBeInTheDocument()
  })

  test('renders username', () => {
    render(<ChildCard child={activeProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    expect(screen.getByText(activeProfiles[0].username)).toBeInTheDocument()
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

  test('calls onEdit when Edit button is clicked', () => {
    render(<ChildCard child={activeProfiles[0]} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} />)
    fireEvent.click(screen.getByText('Edit'))
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

  test('renders all required fields for new child', () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByLabelText(/Child's name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Grade\/Level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Date of birth/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Teacher/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
  })

  test('shows "Add child" button for new child form', () => {
    render(<ChildForm householdId="workspace_test" onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByText('Add child')).toBeInTheDocument()
  })

  test('shows "Save changes" button when editing existing child', () => {
    render(<ChildForm householdId="workspace_test" child={activeProfiles[0]} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByText('Save changes')).toBeInTheDocument()
  })

  test('pre-fills fields when editing existing child', () => {
    render(<ChildForm householdId="workspace_test" child={activeProfiles[0]} onSubmit={onSubmit} onCancel={onCancel} />)
    expect(screen.getByDisplayValue(activeProfiles[0].name)).toBeInTheDocument()
    expect(screen.getByDisplayValue(activeProfiles[0].gradeLabel)).toBeInTheDocument()
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
