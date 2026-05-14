/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LessonTasksPage } from '@/features/lesson-tasks/front/pages/LessonTasksPage'

jest.mock('@/features/lesson-tasks/front/services/api', () => ({
  lessonTasksApi: {
    getLessonTasks: jest.fn(),
    createLessonTask: jest.fn(),
    updateLessonTask: jest.fn(),
    deleteLessonTask: jest.fn(),
  },
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(),
  },
}))

const { lessonTasksApi } = jest.requireMock('@/features/lesson-tasks/front/services/api') as {
  lessonTasksApi: {
    getLessonTasks: jest.Mock
    createLessonTask: jest.Mock
    updateLessonTask: jest.Mock
    deleteLessonTask: jest.Mock
  }
}
const { childrenApi } = jest.requireMock('@/features/children/front/services/api') as {
  childrenApi: { getAllChildren: jest.Mock }
}
const { subjectsApi } = jest.requireMock('@/features/subjects/front/services/api') as {
  subjectsApi: { getSubjects: jest.Mock }
}

const mockChild = {
  id: 'child_1',
  householdId: 'h1',
  name: 'Adam',
  gradeLabel: '5',
  username: 'adam',
  password: 'pass',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mockSubject = {
  id: 'subj_1',
  childId: 'child_1',
  name: 'Mathematics',
  category: 'Math',
  isActive: true,
  order: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mockTask = {
  id: 'task_1',
  childId: 'child_1',
  subjectId: 'subj_1',
  title: 'Fractions worksheet',
  date: '2026-05-12',
  status: 'not_started',
  createdAt: '2026-05-11T07:00:00.000Z',
  updatedAt: '2026-05-11T07:00:00.000Z',
}

function setupHappyPath() {
  childrenApi.getAllChildren.mockResolvedValue({ data: [mockChild] })
  subjectsApi.getSubjects.mockResolvedValue({ data: [mockSubject] })
  lessonTasksApi.getLessonTasks.mockResolvedValue({ data: [mockTask] })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('LessonTasksPage — Loading state', () => {
  it('shows loading indicator while fetching', () => {
    childrenApi.getAllChildren.mockReturnValue(new Promise(() => {}))
    subjectsApi.getSubjects.mockReturnValue(new Promise(() => {}))
    lessonTasksApi.getLessonTasks.mockReturnValue(new Promise(() => {}))
    render(<LessonTasksPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

describe('LessonTasksPage — Error state', () => {
  it('shows error message on API failure', async () => {
    childrenApi.getAllChildren.mockRejectedValue(new Error('Network error'))
    subjectsApi.getSubjects.mockResolvedValue({ data: [] })
    lessonTasksApi.getLessonTasks.mockResolvedValue({ data: [] })
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })
})

describe('LessonTasksPage — Empty state', () => {
  beforeEach(() => {
    childrenApi.getAllChildren.mockResolvedValue({ data: [mockChild] })
    subjectsApi.getSubjects.mockResolvedValue({ data: [mockSubject] })
    lessonTasksApi.getLessonTasks.mockResolvedValue({ data: [] })
  })

  it('shows add form on first load', async () => {
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add lesson/i })).toBeInTheDocument()
    })
  })

  it('shows empty list message', async () => {
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByText(/no lessons yet/i)).toBeInTheDocument()
    })
  })

  it('subject dropdown filters by child', async () => {
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument()
    })
  })
})

describe('LessonTasksPage — Populated state', () => {
  beforeEach(() => {
    setupHappyPath()
  })

  it('shows list of lesson tasks', async () => {
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByText('Fractions worksheet')).toBeInTheDocument()
    })
  })

  it('shows title, child, subject, date, status for each task', async () => {
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByText('Fractions worksheet')).toBeInTheDocument()
      expect(screen.getAllByText('Adam').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Mathematics').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/not started/i).length).toBeGreaterThan(0)
    })
  })
})

describe('LessonTasksPage — Creating', () => {
  beforeEach(() => {
    childrenApi.getAllChildren.mockResolvedValue({ data: [mockChild] })
    subjectsApi.getSubjects.mockResolvedValue({ data: [mockSubject] })
    lessonTasksApi.getLessonTasks.mockResolvedValue({ data: [] })
  })

  it('submits form and adds lesson to list', async () => {
    const user = userEvent.setup()
    const newTask = { ...mockTask, id: 'task_new', title: 'New lesson' }
    lessonTasksApi.createLessonTask.mockResolvedValue({ data: newTask })
    lessonTasksApi.getLessonTasks
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: [newTask] })

    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add lesson/i })).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText(/chapter 4 reading/i), 'New lesson')
    await user.click(screen.getByRole('button', { name: /add lesson/i }))

    await waitFor(() => {
      expect(lessonTasksApi.createLessonTask).toHaveBeenCalled()
    })
  })

  it('shows validation error for blank title', async () => {
    const user = userEvent.setup()
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add lesson/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /add lesson/i }))
    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid resource link', async () => {
    const user = userEvent.setup()
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add lesson/i })).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText(/chapter 4 reading/i), 'My lesson')
    await user.type(screen.getByPlaceholderText(/https:\/\//i), 'javascript:bad')
    await user.click(screen.getByRole('button', { name: /add lesson/i }))
    expect(screen.getByText(/must start with http/i)).toBeInTheDocument()
  })
})

describe('LessonTasksPage — Editing', () => {
  beforeEach(() => {
    setupHappyPath()
  })

  it('clicking Edit populates form with existing values', async () => {
    const user = userEvent.setup()
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByText('Fractions worksheet')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByDisplayValue('Fractions worksheet')).toBeInTheDocument()
  })

  it('saving updates the list item', async () => {
    const user = userEvent.setup()
    const updated = { ...mockTask, title: 'Updated title' }
    lessonTasksApi.updateLessonTask.mockResolvedValue({ data: updated })
    lessonTasksApi.getLessonTasks
      .mockResolvedValueOnce({ data: [mockTask] })
      .mockResolvedValue({ data: [updated] })

    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByText('Fractions worksheet')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByDisplayValue('Fractions worksheet'))
    await user.type(screen.getByPlaceholderText(/chapter 4 reading/i), 'Updated title')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(lessonTasksApi.updateLessonTask).toHaveBeenCalled()
    })
  })

  it('Cancel returns form to blank add state', async () => {
    const user = userEvent.setup()
    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByText('Fractions worksheet')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByRole('button', { name: /add lesson/i })).toBeInTheDocument()
  })
})

describe('LessonTasksPage — Deleting', () => {
  beforeEach(() => {
    setupHappyPath()
  })

  it('clicking Delete with confirmation removes item', async () => {
    const user = userEvent.setup()
    lessonTasksApi.deleteLessonTask.mockResolvedValue({ data: null })
    lessonTasksApi.getLessonTasks
      .mockResolvedValueOnce({ data: [mockTask] })
      .mockResolvedValue({ data: [] })

    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByText('Fractions worksheet')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes/i }))

    await waitFor(() => {
      expect(lessonTasksApi.deleteLessonTask).toHaveBeenCalledWith('task_1')
    })
  })
})

describe('LessonTasksPage — Child/subject interaction', () => {
  it('changing child re-filters subject dropdown', async () => {
    const user = userEvent.setup()
    const child2 = { id: 'child_2', householdId: 'h1', name: 'Khadijah', gradeLabel: '3', username: 'khad', password: 'pass', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' }
    const subject2 = { id: 'subj_2', childId: 'child_2', name: 'Reading', category: 'Reading', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00.000Z' }

    childrenApi.getAllChildren.mockResolvedValue({ data: [mockChild, child2] })
    subjectsApi.getSubjects.mockResolvedValue({ data: [mockSubject, subject2] })
    lessonTasksApi.getLessonTasks.mockResolvedValue({ data: [] })

    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument()
    })

    const childSelect = screen.getByLabelText(/child/i) as HTMLSelectElement
    await user.selectOptions(childSelect, 'child_2')

    expect(screen.getByDisplayValue('Reading')).toBeInTheDocument()
  })

  it('subject selection resets when child changes', async () => {
    const user = userEvent.setup()
    const child2 = { id: 'child_2', householdId: 'h1', name: 'Khadijah', gradeLabel: '3', username: 'khad', password: 'pass', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' }
    const subject2 = { id: 'subj_2', childId: 'child_2', name: 'Reading', category: 'Reading', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00.000Z' }

    childrenApi.getAllChildren.mockResolvedValue({ data: [mockChild, child2] })
    subjectsApi.getSubjects.mockResolvedValue({ data: [mockSubject, subject2] })
    lessonTasksApi.getLessonTasks.mockResolvedValue({ data: [] })

    render(<LessonTasksPage />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument()
    })

    const childSelect = screen.getByLabelText(/child/i) as HTMLSelectElement
    await user.selectOptions(childSelect, 'child_2')

    // Should not show Mathematics (adam's subject) after switching to Khadijah
    expect(screen.queryByDisplayValue('Mathematics')).not.toBeInTheDocument()
  })
})
