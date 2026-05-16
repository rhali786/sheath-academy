import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EvidenceForm } from '@/features/portfolio/front/components/EvidenceForm'
import type { CreateEvidenceItemInput } from '@/features/portfolio/types'

jest.mock('@/features/portfolio/front/services/api', () => ({
  portfolioApi: {
    listEvidence: jest.fn(),
    createEvidence: jest.fn(),
    updateEvidence: jest.fn(),
    deleteEvidence: jest.fn(),
    getEvidence: jest.fn(),
    listEvidenceByLessonTask: jest.fn(),
  },
}))

const mockChildren = [
  { id: 'child_a', name: 'Adam' },
  { id: 'child_b', name: 'Khadijah' },
]

const mockSubjects = [
  { id: 'sub_a', name: 'Math', childId: 'child_a' },
  { id: 'sub_b', name: 'Science', childId: 'child_b' },
]

const mockLessons = [
  { id: 'lesson_a', title: 'Fractions', dueDate: '2026-05-12', childId: 'child_a', subjectId: 'sub_a' },
]

function renderForm(onSave = jest.fn().mockResolvedValue(undefined)) {
  return render(
    <EvidenceForm
      children={mockChildren}
      subjects={mockSubjects}
      lessons={mockLessons}
      onSave={onSave}
    />
  )
}

describe('EvidenceForm', () => {
  it('renders all required fields', () => {
    renderForm()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/child/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/parent reflection/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument()
  })

  it('shows validation error when title is empty and user submits', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
  })

  it('shows URL required error for link type without URL', async () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Link' } })
    fireEvent.change(screen.getByLabelText(/child/i), { target: { value: 'child_a' } })
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'sub_a' } })
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'link' } })

    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    await waitFor(() => {
      expect(screen.getByText(/url is required for link type/i)).toBeInTheDocument()
    })
  })

  it('shows notes required error for note type without notes and without URL', async () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Note' } })
    fireEvent.change(screen.getByLabelText(/child/i), { target: { value: 'child_a' } })
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'sub_a' } })
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'note' } })

    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    await waitFor(() => {
      expect(screen.getByText(/notes or url is required for note type/i)).toBeInTheDocument()
    })
  })

  it('calls onSave with correct data for valid note evidence', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    renderForm(onSave)

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Great Notes' } })
    fireEvent.change(screen.getByLabelText(/child/i), { target: { value: 'child_a' } })
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'sub_a' } })
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-05-12' } })
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'note' } })
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Some great notes' } })
    fireEvent.change(screen.getByLabelText(/parent reflection/i), {
      target: { value: 'This shows strong independent work.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining<Partial<CreateEvidenceItemInput>>({
          title: 'Great Notes',
          childId: 'child_a',
          subjectId: 'sub_a',
          type: 'note',
          notes: 'Some great notes',
          reflection: 'This shows strong independent work.',
        })
      )
    })
  })

  it('calls onSave with correct data for valid URL evidence', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    renderForm(onSave)

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Khan Academy' } })
    fireEvent.change(screen.getByLabelText(/child/i), { target: { value: 'child_a' } })
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'sub_a' } })
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-05-12' } })
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'link' } })
    fireEvent.change(screen.getByLabelText(/url/i), { target: { value: 'https://khanacademy.org' } })

    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining<Partial<CreateEvidenceItemInput>>({
          title: 'Khan Academy',
          type: 'link',
          url: 'https://khanacademy.org',
        })
      )
    })
  })

  it('does NOT render file/photo upload controls', () => {
    renderForm()
    const fileInputs = document.querySelectorAll('input[type="file"]')
    expect(fileInputs).toHaveLength(0)
  })

  it('resets form after successful save', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    renderForm(onSave)

    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'To Be Reset' } })
    fireEvent.change(screen.getByLabelText(/child/i), { target: { value: 'child_a' } })
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'sub_a' } })
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'note' } })
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Some notes' } })

    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('')
    })
  })
})
