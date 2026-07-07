import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { LessonSteps } from '@/features/plan/front/components/LessonSteps'

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    listSteps: jest.fn(),
    createStep: jest.fn(),
    updateStep: jest.fn(),
    deleteStep: jest.fn(),
  },
}))

import { plannerApi } from '@/features/plan/front/services/api'
import type { LessonStep } from '@/features/plan/types'

const mockList = plannerApi.listSteps as jest.Mock
const mockCreate = plannerApi.createStep as jest.Mock
const mockUpdate = plannerApi.updateStep as jest.Mock
const mockDelete = plannerApi.deleteStep as jest.Mock

function makeStep(overrides: Partial<LessonStep> = {}): LessonStep {
  return { id: 'step_1', lessonTaskId: 'lt_1', order: 0, stepText: 'Read p.10', type: 'reading', doneCriteria: null, quantity: null, ...overrides }
}

beforeEach(() => {
  mockList.mockImplementation(() => Promise.resolve([]))
  mockCreate.mockImplementation(() => Promise.resolve(makeStep()))
  mockUpdate.mockImplementation(() => Promise.resolve(makeStep()))
  mockDelete.mockImplementation(() => Promise.resolve())
})
afterEach(() => {
  mockList.mockReset(); mockCreate.mockReset(); mockUpdate.mockReset(); mockDelete.mockReset()
})

describe('LessonSteps', () => {
  it('shows loading then the empty state', async () => {
    render(<LessonSteps lessonTaskId="lt_1" />)
    expect(screen.getByText(/loading steps/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('No steps yet')).toBeInTheDocument())
  })

  it('renders an ordered list of populated steps', async () => {
    mockList.mockImplementation(() => Promise.resolve([
      makeStep({ id: 's1', stepText: 'Read p.10', order: 0 }),
      makeStep({ id: 's2', stepText: 'Solve set B', order: 1, type: 'practice' }),
    ]))
    render(<LessonSteps lessonTaskId="lt_1" />)
    await waitFor(() => expect(screen.getByText('Read p.10')).toBeInTheDocument())
    expect(screen.getByText('Solve set B')).toBeInTheDocument()
  })

  it('adds a step through the collapsible add-form', async () => {
    render(<LessonSteps lessonTaskId="lt_1" />)
    await waitFor(() => expect(screen.getByTestId('add-step-toggle-lt_1')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('add-step-toggle-lt_1'))
    await waitFor(() => expect(screen.getByTestId('add-step-form-lt_1')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Step text'), { target: { value: 'New step' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add step' }))
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith('lt_1', expect.objectContaining({ stepText: 'New step', type: 'instruction' })))
    await waitFor(() => expect(screen.getByText('Step added')).toBeInTheDocument())
  })

  it('blocks adding a step with empty text', async () => {
    render(<LessonSteps lessonTaskId="lt_1" />)
    await waitFor(() => expect(screen.getByTestId('add-step-toggle-lt_1')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('add-step-toggle-lt_1'))
    fireEvent.click(screen.getByRole('button', { name: 'Add step' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/step text is required/i))
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('edits a step', async () => {
    mockList.mockImplementation(() => Promise.resolve([makeStep({ id: 's1', stepText: 'Read p.10' })]))
    render(<LessonSteps lessonTaskId="lt_1" />)
    await waitFor(() => expect(screen.getByText('Read p.10')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Edit step' }))
    fireEvent.change(screen.getByLabelText('Step text'), { target: { value: 'Read p.12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('lt_1', 's1', expect.objectContaining({ stepText: 'Read p.12' })))
  })

  it('deletes a step through the styled confirmation (confirm + cancel)', async () => {
    mockList.mockImplementation(() => Promise.resolve([makeStep({ id: 's1', stepText: 'Read p.10' })]))
    render(<LessonSteps lessonTaskId="lt_1" />)
    await waitFor(() => expect(screen.getByText('Read p.10')).toBeInTheDocument())

    // cancel path
    fireEvent.click(screen.getByRole('button', { name: 'Delete step' }))
    await waitFor(() => expect(screen.getByText('Delete this step?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Delete this step?')).not.toBeInTheDocument())
    expect(mockDelete).not.toHaveBeenCalled()

    // confirm path
    fireEvent.click(screen.getByRole('button', { name: 'Delete step' }))
    await waitFor(() => expect(screen.getByText('Delete this step?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('lt_1', 's1'))
  })

  it('shows an error when steps fail to load', async () => {
    mockList.mockImplementation(() => Promise.reject(new Error('boom')))
    render(<LessonSteps lessonTaskId="lt_1" />)
    await waitFor(() => expect(screen.getByText(/could not load steps/i)).toBeInTheDocument())
  })
})
