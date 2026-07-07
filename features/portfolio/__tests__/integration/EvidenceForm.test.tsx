import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { EvidenceForm } from '@/features/portfolio/front/components/EvidenceForm'
import type { CreateEvidenceItemInput, EvidenceItem } from '@/features/portfolio/types'

jest.mock('@/features/portfolio/front/services/api', () => ({
  portfolioApi: {
    listEvidence: jest.fn(),
    createEvidence: jest.fn(),
    updateEvidence: jest.fn(),
    deleteEvidence: jest.fn(),
    getEvidence: jest.fn(),
    listEvidenceByLessonTask: jest.fn(),
    uploadEvidenceAttachment: jest.fn(),
  },
}))

import { portfolioApi } from '@/features/portfolio/front/services/api'
const mockUpload = portfolioApi.uploadEvidenceAttachment as jest.Mock

const mockCreateObjectURL = jest.fn(() => 'blob:http://localhost/fake-preview')
const mockRevokeObjectURL = jest.fn()

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL, writable: true, configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL, writable: true, configurable: true })
})

beforeEach(() => {
  mockCreateObjectURL.mockClear()
  mockRevokeObjectURL.mockClear()
  mockUpload.mockReset()
})

const mockChildren = [
  { id: 'child_a', name: 'Adam' },
  { id: 'child_b', name: 'Khadijah' },
]

const mockSubjects = [
  { id: 'sub_a', name: 'Math', childId: 'child_a', learnerIds: ['child_a'] },
  { id: 'sub_b', name: 'Science', childId: 'child_b', learnerIds: ['child_b'] },
]

const mockLessons = [
  { id: 'lesson_a', title: 'Fractions', dueDate: '2026-05-12', childId: 'child_a', subjectId: 'sub_a' },
]

const FAKE_SAVED_ITEM: EvidenceItem = {
  id: 'evidence_001',
  title: 'Great Notes',
  childId: 'child_a',
  subjectId: 'sub_a',
  date: '2026-05-12',
  type: 'note',
  notes: 'Some great notes',
  createdBy: 'user',
  createdAt: '2026-05-12T00:00:00.000Z',
  updatedAt: '2026-05-12T00:00:00.000Z',
}

function renderForm(onSave = jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)) {
  return render(
    <EvidenceForm
      children={mockChildren}
      subjects={mockSubjects}
      lessons={mockLessons}
      onSave={onSave}
    />
  )
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Great Notes' } })
  fireEvent.change(screen.getByLabelText(/child/i), { target: { value: 'child_a' } })
  fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'sub_a' } })
  fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-05-12' } })
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'note' } })
  fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Some great notes' } })
}

// ── Original tests (preserved) ─────────────────────────────────────────────────

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

  it('renders a file input for attachment upload', () => {
    renderForm()
    const fileInputs = document.querySelectorAll('input[type="file"]')
    expect(fileInputs).toHaveLength(1)
    const input = fileInputs[0] as HTMLInputElement
    expect(input.accept).toContain('image/png')
    expect(input.accept).toContain('application/pdf')
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
    const onSave = jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)
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
    const onSave = jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)
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

  it('shows subjects for initialChildId on first render — regression for empty-dropdown bug', () => {
    render(
      <EvidenceForm
        children={mockChildren}
        subjects={mockSubjects}
        lessons={mockLessons}
        onSave={jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)}
        initialChildId="child_a"
      />
    )
    const subjectSelect = screen.getByLabelText(/subject/i) as HTMLSelectElement
    const options = Array.from(subjectSelect.options).map(o => o.text)
    expect(options).toContain('Math')
    expect(options).not.toContain('Science')
  })

  it('shows subject for a child enrolled as a SECONDARY learner — regression for cb15ba12', () => {
    const sharedCourseSubjects = [
      { id: 'sub_a', name: 'Math', childId: 'child_a', learnerIds: ['child_a'] },
      // child_b is enrolled as a secondary learner; primary is child_a
      { id: 'sub_shared', name: 'Group Science', childId: 'child_a', learnerIds: ['child_a', 'child_b'] },
    ]
    render(
      <EvidenceForm
        children={mockChildren}
        subjects={sharedCourseSubjects}
        lessons={mockLessons}
        onSave={jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)}
        initialChildId="child_b"
      />
    )
    const subjectSelect = screen.getByLabelText(/subject/i) as HTMLSelectElement
    const options = Array.from(subjectSelect.options).map(o => o.text)
    expect(options).toContain('Group Science')
    expect(options).not.toContain('Math')
  })

  it('subject dropdown updates when initialChildId prop changes — regression for async load bug', () => {
    const { rerender } = render(
      <EvidenceForm
        children={mockChildren}
        subjects={mockSubjects}
        lessons={mockLessons}
        onSave={jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)}
        initialChildId={null}
      />
    )
    rerender(
      <EvidenceForm
        children={mockChildren}
        subjects={mockSubjects}
        lessons={mockLessons}
        onSave={jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)}
        initialChildId="child_a"
      />
    )
    const subjectSelect = screen.getByLabelText(/subject/i) as HTMLSelectElement
    const options = Array.from(subjectSelect.options).map(o => o.text)
    expect(options).toContain('Math')
    expect(options).not.toContain('Science')
  })

  it('resets form after successful save', async () => {
    const onSave = jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)
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

// ── File attachment tests ─────────────────────────────────────────────────────

describe('EvidenceForm — file attachment', () => {
  it('shows inline error for file over 2MB, does not upload', async () => {
    renderForm()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File(['x'.repeat(2_097_153)], 'big.png', { type: 'image/png' })
    Object.defineProperty(bigFile, 'size', { value: 2_097_153 })
    fireEvent.change(fileInput, { target: { files: [bigFile] } })

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument()
    })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('shows inline error for disallowed MIME type, does not upload', async () => {
    renderForm()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = new File(['data'], 'notes.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [badFile] } })

    await waitFor(() => {
      expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument()
    })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('shows image preview via createObjectURL when a valid image is selected', async () => {
    renderForm()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const imgFile = new File(['fake png'], 'photo.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [imgFile] } })

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(imgFile)
      expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:http://localhost/fake-preview')
    })
  })

  it('revokes the old preview URL when a new file is selected', async () => {
    renderForm()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const firstFile = new File(['fake1'], 'photo1.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [firstFile] } })

    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalledTimes(1))

    const secondFile = new File(['fake2'], 'photo2.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [secondFile] } })

    await waitFor(() => {
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-preview')
    })
  })

  it('revokes the preview URL on unmount', async () => {
    const { unmount } = renderForm()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const imgFile = new File(['fake'], 'photo.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [imgFile] } })

    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalledTimes(1))
    unmount()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-preview')
  })

  it('uploads the file ONLY after record save succeeds (two-step submit)', async () => {
    const onSave = jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)
    mockUpload.mockResolvedValue({ status: 'success', data: { id: 'patt_001' } })
    renderForm(onSave)

    fillValidForm()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const imgFile = new File(['fake png'], 'photo.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [imgFile] } })

    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
      expect(mockUpload).toHaveBeenCalledWith('evidence_001', imgFile)
    })
  })

  it('does NOT upload when no file is selected', async () => {
    const onSave = jest.fn().mockResolvedValue(FAKE_SAVED_ITEM)
    renderForm(onSave)

    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('does NOT upload when onSave rejects (record save failed)', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('Server error'))
    renderForm(onSave)

    fillValidForm()

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const imgFile = new File(['fake'], 'photo.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [imgFile] } })

    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(mockUpload).not.toHaveBeenCalled()
  })
})
