import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EvidenceListItem } from '@/features/portfolio/front/components/EvidenceListItem'
import type { EvidenceItem, EvidenceAttachmentMeta } from '@/features/portfolio/types'

function makeItem(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: 'evidence_001',
    title: 'Test Evidence',
    childId: 'child_a',
    subjectId: 'sub_a',
    date: '2026-05-12',
    type: 'note',
    notes: 'Some notes here',
    createdBy: 'demo-parent',
    createdAt: '2026-05-12T09:00:00Z',
    updatedAt: '2026-05-12T09:00:00Z',
    ...overrides,
  }
}

function makeAttachment(overrides: Partial<EvidenceAttachmentMeta> = {}): EvidenceAttachmentMeta {
  return {
    id: 'patt_001',
    evidenceItemId: 'evidence_001',
    filename: 'photo.png',
    mimeType: 'image/png',
    sizeBytes: 512,
    createdAt: '2026-05-12T09:00:00Z',
    ...overrides,
  }
}

// ── Original tests (preserved) ─────────────────────────────────────────────────

describe('EvidenceListItem — read state', () => {
  it('renders the title in read state', () => {
    render(
      <EvidenceListItem
        item={makeItem({ title: 'My Portfolio Item' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.getByText('My Portfolio Item')).toBeInTheDocument()
  })

  it('shows Pencil icon button when onUpdate is provided', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /edit evidence/i })).toBeInTheDocument()
  })

  it('shows Pencil icon button when legacy onEdit is provided', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onEdit={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /edit evidence/i })).toBeInTheDocument()
  })

  it('shows Trash icon button when onDelete is provided', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /delete evidence/i })).toBeInTheDocument()
  })

  it('does not show edit/delete buttons when no handlers provided', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.queryByRole('button', { name: /edit evidence/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete evidence/i })).not.toBeInTheDocument()
  })

  it('inline edit form is NOT visible in read state', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn()}
      />
    )
    expect(screen.queryByRole('button', { name: /save evidence/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel edit/i })).not.toBeInTheDocument()
  })
})

describe('EvidenceListItem — edit expansion (inline)', () => {
  it('clicking Pencil expands inline edit form with onUpdate', () => {
    render(
      <EvidenceListItem
        item={makeItem({ title: 'Clickable Item' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    expect(screen.getByRole('button', { name: /save evidence/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit evidence/i })).not.toBeInTheDocument()
  })

  it('edit form is prefilled with current title', () => {
    render(
      <EvidenceListItem
        item={makeItem({ title: 'Original Title' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    const titleInput = screen.getByDisplayValue('Original Title')
    expect(titleInput).toBeInTheDocument()
  })

  it('Cancel collapses inline form without calling onUpdate', () => {
    const onUpdate = jest.fn()
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel edit/i }))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /edit evidence/i })).toBeInTheDocument()
  })

  it('Save calls onUpdate with item id and patch', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <EvidenceListItem
        item={makeItem({ id: 'ev_save', title: 'Original' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('ev_save', expect.objectContaining({ title: 'Original' }))
    })
  })

  it('clicking Pencil with legacy onEdit calls onEdit (no inline expansion)', () => {
    const onEdit = jest.fn()
    render(
      <EvidenceListItem
        item={makeItem({ id: 'ev_legacy', title: 'Legacy Edit' })}
        childName="Adam"
        subjectName="Math"
        onEdit={onEdit}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'ev_legacy' }))
    expect(screen.queryByRole('button', { name: /save evidence/i })).not.toBeInTheDocument()
  })
})

describe('EvidenceListItem — delete confirmation', () => {
  it('shows InlineConfirm panel when Trash icon is clicked', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onDelete={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete evidence/i }))
    expect(screen.getByRole('group', { name: /delete this evidence item/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('Cancel hides InlineConfirm panel and does not call onDelete', () => {
    const onDelete = jest.fn()
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete evidence/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /delete evidence/i })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /delete this evidence item/i })).not.toBeInTheDocument()
  })

  it('Confirm delete calls onDelete with item id', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined)
    render(
      <EvidenceListItem
        item={makeItem({ id: 'ev_del_123' })}
        childName="Adam"
        subjectName="Math"
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete evidence/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('ev_del_123')
    })
  })

  it('error in onDelete keeps InlineConfirm panel open and shows error message', async () => {
    const onDelete = jest.fn().mockRejectedValue(new Error('Server error'))
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete evidence/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByRole('group', { name: /delete this evidence item/i })).toBeInTheDocument()
    })
  })
})

// ── Attachment rendering ───────────────────────────────────────────────────────

describe('EvidenceListItem — attachments', () => {
  it('renders an image thumbnail for an image attachment', () => {
    const attachment = makeAttachment({ id: 'patt_img', mimeType: 'image/png', filename: 'photo.png' })
    render(
      <EvidenceListItem
        item={makeItem({ attachments: [attachment] })}
        childName="Adam"
        subjectName="Math"
      />
    )
    const img = screen.getByRole('img', { name: /photo\.png/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', expect.stringContaining('patt_img'))
  })

  it('image thumbnail link opens the GET serve route', () => {
    const attachment = makeAttachment({ id: 'patt_img', mimeType: 'image/png' })
    render(
      <EvidenceListItem
        item={makeItem({ attachments: [attachment] })}
        childName="Adam"
        subjectName="Math"
      />
    )
    const link = screen.getByRole('link', { name: /photo\.png/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('/api/portfolio/evidence/attachments/patt_img'))
  })

  it('renders a filename link for a PDF attachment (no thumbnail)', () => {
    const attachment = makeAttachment({
      id: 'patt_pdf',
      mimeType: 'application/pdf',
      filename: 'essay.pdf',
    })
    render(
      <EvidenceListItem
        item={makeItem({ attachments: [attachment] })}
        childName="Adam"
        subjectName="Math"
      />
    )
    const link = screen.getByRole('link', { name: /essay\.pdf/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('/api/portfolio/evidence/attachments/patt_pdf'))
    // PDF should not render an img element
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('attachment links are visually distinct from the url link', () => {
    const attachment = makeAttachment({ id: 'patt_img' })
    render(
      <EvidenceListItem
        item={makeItem({ url: 'https://example.com', attachments: [attachment] })}
        childName="Adam"
        subjectName="Math"
      />
    )
    const urlLink = screen.getByRole('link', { name: /https:\/\/example\.com/i })
    const attachLink = screen.getByRole('link', { name: /photo\.png/i })
    expect(urlLink).toBeInTheDocument()
    expect(attachLink).toBeInTheDocument()
    // They are separate links
    expect(urlLink).not.toBe(attachLink)
  })

  it('shows no attachment section when item has no attachments', () => {
    render(
      <EvidenceListItem
        item={makeItem({ attachments: [] })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows remove button per attachment when onDeleteAttachment is provided', () => {
    const attachment = makeAttachment()
    render(
      <EvidenceListItem
        item={makeItem({ attachments: [attachment] })}
        childName="Adam"
        subjectName="Math"
        onDeleteAttachment={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /remove photo\.png/i })).toBeInTheDocument()
  })

  it('clicking remove opens InlineConfirm for that attachment', () => {
    const attachment = makeAttachment({ filename: 'photo.png' })
    render(
      <EvidenceListItem
        item={makeItem({ attachments: [attachment] })}
        childName="Adam"
        subjectName="Math"
        onDeleteAttachment={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /remove photo\.png/i }))
    expect(screen.getByRole('group', { name: /remove attachment/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('Cancel from attachment InlineConfirm closes panel without calling onDeleteAttachment', () => {
    const onDeleteAttachment = jest.fn()
    const attachment = makeAttachment()
    render(
      <EvidenceListItem
        item={makeItem({ attachments: [attachment] })}
        childName="Adam"
        subjectName="Math"
        onDeleteAttachment={onDeleteAttachment}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /remove photo\.png/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onDeleteAttachment).not.toHaveBeenCalled()
    expect(screen.queryByRole('group', { name: /remove attachment/i })).not.toBeInTheDocument()
  })

  it('Confirming attachment delete calls onDeleteAttachment with attachmentId', async () => {
    const onDeleteAttachment = jest.fn().mockResolvedValue(undefined)
    const attachment = makeAttachment({ id: 'patt_del_001' })
    render(
      <EvidenceListItem
        item={makeItem({ attachments: [attachment] })}
        childName="Adam"
        subjectName="Math"
        onDeleteAttachment={onDeleteAttachment}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /remove photo\.png/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => {
      expect(onDeleteAttachment).toHaveBeenCalledWith('patt_del_001')
    })
  })
})

// ── Edit mode — attachment management ─────────────────────────────────────────

const mockCreateObjectURL = jest.fn(() => 'blob:http://localhost/fake-preview')
const mockRevokeObjectURL = jest.fn()

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL, writable: true, configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL, writable: true, configurable: true })
})
beforeEach(() => { mockCreateObjectURL.mockClear(); mockRevokeObjectURL.mockClear() })

describe('EvidenceListItem — edit mode attachment management', () => {
  function renderEditing(
    item: EvidenceItem,
    onUploadAttachment = jest.fn().mockResolvedValue(undefined),
    onDeleteAttachment = jest.fn().mockResolvedValue(undefined),
  ) {
    render(
      <EvidenceListItem
        item={item}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn().mockResolvedValue(undefined)}
        onDeleteAttachment={onDeleteAttachment}
        onUploadAttachment={onUploadAttachment}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
  }

  it('shows existing attachments in edit mode', () => {
    const attachment = makeAttachment({ filename: 'photo.png' })
    renderEditing(makeItem({ attachments: [attachment] }))
    expect(screen.getByText('photo.png')).toBeInTheDocument()
  })

  it('shows a file input in edit mode when onUploadAttachment is provided', () => {
    renderEditing(makeItem())
    expect(document.querySelector('input[type="file"]')).not.toBeNull()
  })

  it('shows inline error for oversized file, does not upload', async () => {
    const onUpload = jest.fn()
    renderEditing(makeItem(), onUpload)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File(['x'], 'big.png', { type: 'image/png' })
    Object.defineProperty(bigFile, 'size', { value: 2_097_153 })
    fireEvent.change(fileInput, { target: { files: [bigFile] } })
    await waitFor(() => expect(screen.getByText(/file too large/i)).toBeInTheDocument())
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('shows inline error for disallowed MIME type, does not upload', async () => {
    const onUpload = jest.fn()
    renderEditing(makeItem(), onUpload)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = new File(['data'], 'notes.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [badFile] } })
    await waitFor(() => expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument())
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('calls onUploadAttachment with evidenceId and file when valid file selected', async () => {
    const onUpload = jest.fn().mockResolvedValue(undefined)
    renderEditing(makeItem({ id: 'evidence_001' }), onUpload)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const imgFile = new File(['fake'], 'photo.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [imgFile] } })
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith('evidence_001', imgFile))
  })

  it('shows a remove button per attachment in edit mode when onDeleteAttachment provided', () => {
    const attachment = makeAttachment({ filename: 'photo.png' })
    renderEditing(makeItem({ attachments: [attachment] }))
    expect(screen.getByRole('button', { name: /remove photo\.png/i })).toBeInTheDocument()
  })

  it('clicking remove in edit mode calls onDeleteAttachment after confirmation', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined)
    const attachment = makeAttachment({ id: 'patt_edit_del', filename: 'photo.png' })
    renderEditing(makeItem({ attachments: [attachment] }), jest.fn(), onDelete)
    fireEvent.click(screen.getByRole('button', { name: /remove photo\.png/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('patt_edit_del'))
  })
})
