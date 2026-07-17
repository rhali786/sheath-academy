import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { GradebookPage } from '@/features/gradebook/front/pages/GradebookPage'

jest.mock('@/features/gradebook/front/services/api', () => ({
  gradebookApi: {
    getSummaries: jest.fn(),
    getNeedsAttention: jest.fn(),
    getScores: jest.fn(),
    createScore: jest.fn(),
    updateScore: jest.fn(),
    deleteScore: jest.fn(),
    getGradingScales: jest.fn(),
    getAggregationRules: jest.fn(),
    createGradingScale: jest.fn(),
    deleteGradingScale: jest.fn(),
    createAggregationRule: jest.fn(),
    deleteAggregationRule: jest.fn(),
    updateSubjectConfig: jest.fn(),
  },
}))

jest.mock('@/features/layout/front/context/LearnerContext', () => ({
  useLearner: jest.fn(),
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn(),
  },
}))

import { gradebookApi } from '@/features/gradebook/front/services/api'
import { plannerApi } from '@/features/plan/front/services/api'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { mockGradebookSummaries, mockScores } from '@/features/gradebook/__tests__/fixtures/mockGradebook'
import type { LessonTask } from '@/features/plan/types'

const mockGetSummaries = gradebookApi.getSummaries as jest.Mock
const mockGetNeedsAttention = gradebookApi.getNeedsAttention as jest.Mock
const mockGetScores = gradebookApi.getScores as jest.Mock
const mockCreateScore = gradebookApi.createScore as jest.Mock
const mockUpdateScore = gradebookApi.updateScore as jest.Mock
const mockDeleteScore = gradebookApi.deleteScore as jest.Mock
const mockGetScales = gradebookApi.getGradingScales as jest.Mock
const mockGetRules = gradebookApi.getAggregationRules as jest.Mock
const mockCreateScale = gradebookApi.createGradingScale as jest.Mock
const mockDeleteScale = gradebookApi.deleteGradingScale as jest.Mock
const mockCreateRule = gradebookApi.createAggregationRule as jest.Mock
const mockDeleteRule = gradebookApi.deleteAggregationRule as jest.Mock
const mockUpdateSubjectConfig = gradebookApi.updateSubjectConfig as jest.Mock
const mockUseLearner = useLearner as jest.Mock
const mockGetLessons = plannerApi.getLessons as jest.Mock

function ok<T>(data: T) {
  return Promise.resolve({ status: 'success', data, message: 'ok', timestamp: '' })
}

describe('GradebookPage', () => {
  beforeEach(() => {
    mockUseLearner.mockImplementation(() => ({ selectedChildId: null, setSelectedChildId: jest.fn() }))
    mockGetSummaries.mockImplementation(() => ok(mockGradebookSummaries))
    mockGetNeedsAttention.mockImplementation(() => ok([]))
    mockGetScores.mockImplementation(() => ok([]))
    mockCreateScore.mockImplementation(() => ok(null))
    mockUpdateScore.mockImplementation(() => ok(null))
    mockDeleteScore.mockImplementation(() => ok(null))
    mockGetScales.mockImplementation(() => ok([{ id: 'gs1', householdId: 'hh', name: 'Standard', bands: [] }]))
    mockGetRules.mockImplementation(() => ok([{ id: 'ar1', householdId: 'hh', name: 'Best', strategy: 'highest' }]))
    mockCreateScale.mockImplementation(() => ok(null))
    mockDeleteScale.mockImplementation(() => ok(null))
    mockCreateRule.mockImplementation(() => ok(null))
    mockDeleteRule.mockImplementation(() => ok(null))
    mockUpdateSubjectConfig.mockImplementation(() => ok(null))
    mockGetLessons.mockImplementation(() => Promise.resolve([]))
  })

  afterEach(() => {
    mockUseLearner.mockReset()
    mockGetSummaries.mockReset()
    mockGetNeedsAttention.mockReset()
    mockGetScores.mockReset()
    mockCreateScore.mockReset()
    mockUpdateScore.mockReset()
    mockDeleteScore.mockReset()
    mockGetScales.mockReset()
    mockGetRules.mockReset()
    mockCreateScale.mockReset()
    mockDeleteScale.mockReset()
    mockCreateRule.mockReset()
    mockDeleteRule.mockReset()
    mockUpdateSubjectConfig.mockReset()
    mockGetLessons.mockReset()
  })

  it('shows loading state initially', () => {
    mockGetSummaries.mockImplementation(() => new Promise(() => {}))
    render(<GradebookPage />)
    expect(screen.getByTestId('gradebook-loading')).toBeInTheDocument()
  })

  it('shows populated learner cards after load', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByText('Layth')).toBeInTheDocument()
      expect(screen.getByText('Hawa')).toBeInTheDocument()
    })
  })

  it('shows empty "all caught up" state when no needs-attention items', async () => {
    mockGetSummaries.mockImplementation(() =>
      ok([{ ...mockGradebookSummaries[0], needsAttentionSubjects: [] }])
    )
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByTestId('gradebook-all-caught-up')).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    mockGetSummaries.mockImplementation(() => Promise.reject(new Error('Network error')))
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByTestId('gradebook-error')).toBeInTheDocument()
    })
  })

  it('shows needs-attention queue when subjects have missing/decaying scores', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      // Layth has a Quran subject with null grade → needs attention
      expect(screen.getByTestId('gradebook-needs-attention')).toBeInTheDocument()
    })
  })

  it('clicking a needs-attention item expands that subject and opens its Add score form', async () => {
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByTestId('gradebook-needs-attention')).toBeInTheDocument())

    // Not expanded yet — score history for Layth's Quran subject isn't rendered.
    expect(screen.queryByTestId(`score-history-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[1].subjectId}`)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /missing.*quran/i }))

    await waitFor(() => {
      expect(screen.getByTestId(`score-history-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[1].subjectId}`)).toBeInTheDocument()
    })
    // The Add score form auto-opens (toggle button now reads "Cancel").
    await waitFor(() => {
      expect(screen.getByTestId(`add-score-toggle-${mockGradebookSummaries[0].subjects[1].subjectId}`)).toHaveTextContent('Cancel')
    })
  })

  it('renders subject grade pills with letter grades', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      // Layth Math → A
      expect(screen.getAllByText('A').length).toBeGreaterThan(0)
    })
  })

  it('shows GPA when available', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByText(/4\.0/)).toBeInTheDocument()
    })
  })

  it('shows empty learner card for Talut who has no scores', async () => {
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByText('Talut')).toBeInTheDocument()
      expect(screen.getByTestId('learner-empty-talut')).toBeInTheDocument()
    })
  })

  it('subject rows are clickable buttons', async () => {
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByText('Layth')).toBeInTheDocument())
    const mathRow = screen.getByTestId(`subject-row-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`)
    expect(mathRow.tagName).toBe('BUTTON')
  })

  it('clicking a subject row fetches and shows score history', async () => {
    const laythScores = mockScores.filter(s => s.learnerId === mockGradebookSummaries[0].learnerId && s.subjectId === mockGradebookSummaries[0].subjects[0].subjectId)
    mockGetScores.mockImplementation(() => ok(laythScores))
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByText('Layth')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId(`subject-row-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`))
    await waitFor(() => {
      expect(screen.getByTestId(`score-history-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`)).toBeInTheDocument()
    })
  })

  it('clicking an expanded subject row collapses it', async () => {
    mockGetScores.mockImplementation(() => ok([]))
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByText('Layth')).toBeInTheDocument())
    const rowId = `subject-row-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`
    fireEvent.click(screen.getByTestId(rowId))
    await waitFor(() => expect(screen.getByTestId(`score-history-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`)).toBeInTheDocument())
    fireEvent.click(screen.getByTestId(rowId))
    expect(screen.queryByTestId(`score-history-${mockGradebookSummaries[0].learnerId}-${mockGradebookSummaries[0].subjects[0].subjectId}`)).not.toBeInTheDocument()
  })

  // ─── Phase 1: score CRUD interactions ─────────────────────────────────────
  const laythMathSubjectId = mockGradebookSummaries[0].subjects[0].subjectId
  const laythId = mockGradebookSummaries[0].learnerId

  async function expandLaythMath() {
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByText('Layth')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId(`subject-row-${laythId}-${laythMathSubjectId}`))
    await waitFor(() => expect(screen.getByTestId(`add-score-toggle-${laythMathSubjectId}`)).toBeInTheDocument())
  }

  it('adds a score via the collapsible add-form', async () => {
    await expandLaythMath()
    fireEvent.click(screen.getByTestId(`add-score-toggle-${laythMathSubjectId}`))
    await waitFor(() => expect(screen.getByTestId(`add-score-form-${laythMathSubjectId}`)).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Numeric score'), { target: { value: '91' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add score' }))

    await waitFor(() => expect(mockCreateScore).toHaveBeenCalledWith(
      expect.objectContaining({ learnerId: laythId, subjectId: laythMathSubjectId, state: 'graded', numericValue: 91 }),
    ))
    await waitFor(() => expect(screen.getByText('Score added')).toBeInTheDocument())
  })

  it('blocks adding a graded score with no numeric value', async () => {
    await expandLaythMath()
    fireEvent.click(screen.getByTestId(`add-score-toggle-${laythMathSubjectId}`))
    await waitFor(() => expect(screen.getByTestId(`add-score-form-${laythMathSubjectId}`)).toBeInTheDocument())
    // leave numeric blank
    fireEvent.click(screen.getByRole('button', { name: 'Add score' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/score/i))
    expect(mockCreateScore).not.toHaveBeenCalled()
  })

  it('edits an existing score', async () => {
    mockGetScores.mockImplementation(() => ok([
      { id: 'sc_1', subjectId: laythMathSubjectId, learnerId: laythId, householdId: 'hh', state: 'graded', numericValue: 80, source: 'parent', occurredAt: '2026-05-01', comment: '' },
    ]))
    await expandLaythMath()
    await waitFor(() => expect(screen.getByText('80%')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Edit score' }))
    fireEvent.change(screen.getByLabelText('Numeric score'), { target: { value: '95' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mockUpdateScore).toHaveBeenCalledWith('sc_1', expect.objectContaining({ numericValue: 95, state: 'graded' })))
    await waitFor(() => expect(screen.getByText('Score updated')).toBeInTheDocument())
  })

  it('deletes a score through the styled confirmation (confirm path)', async () => {
    mockGetScores.mockImplementation(() => ok([
      { id: 'sc_1', subjectId: laythMathSubjectId, learnerId: laythId, householdId: 'hh', state: 'graded', numericValue: 80, source: 'parent', occurredAt: '2026-05-01', comment: '' },
    ]))
    await expandLaythMath()
    await waitFor(() => expect(screen.getByText('80%')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete score' }))
    await waitFor(() => expect(screen.getByText('Delete this score?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteScore).toHaveBeenCalledWith('sc_1'))
    await waitFor(() => expect(screen.getByText('Score deleted')).toBeInTheDocument())
  })

  it('cancels a delete without calling the API (cancel path)', async () => {
    mockGetScores.mockImplementation(() => ok([
      { id: 'sc_1', subjectId: laythMathSubjectId, learnerId: laythId, householdId: 'hh', state: 'graded', numericValue: 80, source: 'parent', occurredAt: '2026-05-01', comment: '' },
    ]))
    await expandLaythMath()
    await waitFor(() => expect(screen.getByText('80%')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete score' }))
    await waitFor(() => expect(screen.getByText('Delete this score?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Delete this score?')).not.toBeInTheDocument())
    expect(mockDeleteScore).not.toHaveBeenCalled()
  })

  it('shows an error when score loading fails', async () => {
    mockGetScores.mockImplementation(() => Promise.reject(new Error('boom')))
    await expandLaythMath()
    await waitFor(() => expect(screen.getByText(/could not load scores/i)).toBeInTheDocument())
  })

  // ─── Phase 6: course-config + scale/rule management ───────────────────────
  it('saves subject course-config through the owner route and refetches summaries', async () => {
    await expandLaythMath()
    fireEvent.click(screen.getByTestId(`course-config-toggle-${laythMathSubjectId}`))
    await waitFor(() => expect(screen.getByTestId(`subject-config-${laythMathSubjectId}`)).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Credit hours'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Grading scale'), { target: { value: 'gs1' } })
    fireEvent.change(screen.getByLabelText('Aggregation rule'), { target: { value: 'ar1' } })
    const summariesCallsBefore = mockGetSummaries.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Save config' }))

    await waitFor(() => expect(mockUpdateSubjectConfig).toHaveBeenCalledWith(laythMathSubjectId, expect.objectContaining({
      creditHours: 4, gradingScaleId: 'gs1', aggregationRuleId: 'ar1',
    })))
    // GPA is re-derived by refetching summaries after the config save
    await waitFor(() => expect(mockGetSummaries.mock.calls.length).toBeGreaterThan(summariesCallsBefore))
  })

  it('creates a grading scale from the config manager', async () => {
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByTestId('toggle-grading-config')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('toggle-grading-config'))
    fireEvent.change(screen.getByLabelText('New grading scale name'), { target: { value: 'Mastery' } })
    fireEvent.click(screen.getAllByRole('button', { name: /add/i })[0])
    await waitFor(() => expect(mockCreateScale).toHaveBeenCalledWith('Mastery', expect.any(Array)))
  })

  it('creates an aggregation rule from the config manager', async () => {
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByTestId('toggle-grading-config')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('toggle-grading-config'))
    fireEvent.change(screen.getByLabelText('New aggregation rule name'), { target: { value: 'Latest' } })
    fireEvent.change(screen.getByLabelText('New aggregation rule strategy'), { target: { value: 'most_recent' } })
    fireEvent.click(screen.getAllByRole('button', { name: /add/i })[1])
    await waitFor(() => expect(mockCreateRule).toHaveBeenCalledWith('Latest', 'most_recent'))
  })

  it('deletes a grading scale through the styled confirmation', async () => {
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByTestId('toggle-grading-config')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('toggle-grading-config'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete grading scale Standard' }))
    await waitFor(() => expect(screen.getByText('Delete this grading scale?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteScale).toHaveBeenCalledWith('gs1'))
  })

  // ─── G7d: scheduled assignments + inline grade assignment ─────────────────
  function assignmentLesson(overrides: Partial<LessonTask> = {}): LessonTask {
    return {
      id: 'lt_assign_1',
      childId: laythId,
      subjectId: laythMathSubjectId,
      householdId: 'hh',
      title: 'Chapter 4 Quiz',
      dueDate: '2026-05-20',
      status: 'not_started',
      order: 0,
      lessonType: 'Assessment',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      ...overrides,
    }
  }

  /** Only return the given lessons for Layth's fetch (childIds: [laythId]) — other learner cards get []. */
  function lessonsOnlyForLayth(lessons: LessonTask[]) {
    return (_week: unknown, childIds?: string[]) =>
      Promise.resolve(childIds && childIds[0] === laythId ? lessons : [])
  }

  it('lists scheduled assignments (assessment-type lessons) for a learner with an Assign grade action', async () => {
    mockGetLessons.mockImplementation(lessonsOnlyForLayth([assignmentLesson()]))
    render(<GradebookPage />)
    await waitFor(() => {
      expect(screen.getByTestId(`scheduled-assignments-${laythId}`)).toBeInTheDocument()
    })
    expect(screen.getByText('Chapter 4 Quiz')).toBeInTheDocument()
    expect(screen.getByTestId('assign-grade-toggle-lt_assign_1')).toBeInTheDocument()
  })

  it('does not list plain (non-assessment) lessons or already-started lessons as scheduled assignments', async () => {
    mockGetLessons.mockImplementation(lessonsOnlyForLayth([
      assignmentLesson({ id: 'lt_reading', lessonType: 'Reading' }),
      assignmentLesson({ id: 'lt_done', status: 'completed' }),
    ]))
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByText('Layth')).toBeInTheDocument())
    expect(screen.queryByTestId(`scheduled-assignments-${laythId}`)).not.toBeInTheDocument()
  })

  it('assigning a grade to a scheduled assignment records a Score linked to that lesson', async () => {
    mockGetLessons.mockImplementation(lessonsOnlyForLayth([assignmentLesson()]))
    render(<GradebookPage />)
    await waitFor(() => expect(screen.getByTestId('assign-grade-toggle-lt_assign_1')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('assign-grade-toggle-lt_assign_1'))
    await waitFor(() => expect(screen.getByTestId('assign-grade-form-lt_assign_1')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Numeric score'), { target: { value: '87' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save grade' }))

    await waitFor(() => expect(mockCreateScore).toHaveBeenCalledWith(
      expect.objectContaining({
        learnerId: laythId,
        subjectId: laythMathSubjectId,
        lessonTaskId: 'lt_assign_1',
        state: 'graded',
        numericValue: 87,
      }),
    ))
    // Graded assignment drops out of the scheduled list and a confirmation shows.
    await waitFor(() => expect(screen.getByText('Grade assigned')).toBeInTheDocument())
    expect(screen.queryByTestId('assignment-row-lt_assign_1')).not.toBeInTheDocument()
  })
})
