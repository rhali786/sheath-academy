'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Check, X, FileText } from 'lucide-react'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import type { EvidenceItem, EvidenceType, CreateEvidenceItemInput, EvidenceAttachmentMeta } from '@/features/portfolio/types'

const MAX_ATTACHMENT_BYTES = 2_097_152
const ALLOWED_ATTACHMENT_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'])

const TYPE_LABELS: Record<EvidenceType, string> = {
  note: 'Note',
  link: 'Link',
  writing_sample: 'Writing Sample',
  project: 'Project',
  recitation: 'Recitation',
  other: 'Other',
}

const TYPE_COLORS: Record<EvidenceType, string> = {
  note: 'bg-blue-100 text-blue-800',
  link: 'bg-purple-100 text-purple-800',
  writing_sample: 'bg-green-100 text-green-800',
  project: 'bg-yellow-100 text-yellow-800',
  recitation: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'writing_sample', label: 'Writing Sample' },
  { value: 'project', label: 'Project' },
  { value: 'recitation', label: 'Recitation' },
  { value: 'other', label: 'Other' },
]

interface ChildOption { id: string; name: string }
interface SubjectOption { id: string; name: string; childId: string }
interface LessonOption { id: string; title: string; dueDate: string; childId: string; subjectId: string }

interface Props {
  item: EvidenceItem
  childName: string
  subjectName: string
  /** When provided, enables inline edit expansion */
  onUpdate?: (id: string, patch: Partial<CreateEvidenceItemInput>) => Promise<void>
  /** When provided, enables delete confirmation */
  onDelete?: (id: string) => Promise<void>
  /** When provided, shows a remove button per attachment using InlineConfirm */
  onDeleteAttachment?: (attachmentId: string) => Promise<void>
  /** When provided, shows a file input in edit mode to upload a new attachment */
  onUploadAttachment?: (evidenceId: string, file: File) => Promise<void>
  /** Legacy: called when card is clicked (top-form pattern) — kept for backward compatibility when onUpdate not provided */
  onEdit?: (item: EvidenceItem) => void
  /** Options for the edit form dropdowns */
  childOptions?: ChildOption[]
  subjects?: SubjectOption[]
  lessons?: LessonOption[]
}

export function EvidenceListItem({ item, childName, subjectName, onUpdate, onDelete, onDeleteAttachment, onUploadAttachment, onEdit, childOptions, subjects, lessons }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmDeleteAttachmentId, setConfirmDeleteAttachmentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [localAttachments, setLocalAttachments] = useState<EvidenceAttachmentMeta[]>(item.attachments ?? [])
  const [confirmDeleteAttachmentIdInEdit, setConfirmDeleteAttachmentIdInEdit] = useState<string | null>(null)
  const [attachmentError, setAttachmentError] = useState('')

  useEffect(() => {
    if (!isEditing) setLocalAttachments(item.attachments ?? [])
  }, [item.attachments, isEditing])

  // Edit form state
  const [editTitle, setEditTitle] = useState(item.title)
  const [editChildId, setEditChildId] = useState(item.childId)
  const [editSubjectId, setEditSubjectId] = useState(item.subjectId)
  const [editDate, setEditDate] = useState(item.date)
  const [editType, setEditType] = useState<EvidenceType>(item.type)
  const [editNotes, setEditNotes] = useState(item.notes ?? '')
  const [editReflection, setEditReflection] = useState(item.reflection ?? '')
  const [editUrl, setEditUrl] = useState(item.url ?? '')
  const [editLessonTaskId, setEditLessonTaskId] = useState(item.lessonTaskId ?? '')

  const notesPreview = item.notes && item.notes.length > 80
    ? item.notes.slice(0, 80) + '…'
    : item.notes

  function startEdit() {
    setConfirmDelete(false)
    setEditTitle(item.title)
    setEditChildId(item.childId)
    setEditSubjectId(item.subjectId)
    setEditDate(item.date)
    setEditType(item.type)
    setEditNotes(item.notes ?? '')
    setEditReflection(item.reflection ?? '')
    setEditUrl(item.url ?? '')
    setEditLessonTaskId(item.lessonTaskId ?? '')

    if (onUpdate) {
      setIsEditing(true)
    } else if (onEdit) {
      onEdit(item)
    }
  }

  function cancelEdit() {
    setIsEditing(false)
    setAttachmentError('')
    setConfirmDeleteAttachmentIdInEdit(null)
  }

  async function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachmentError('')
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError('File too large (max 2 MB)')
      return
    }
    if (!ALLOWED_ATTACHMENT_MIME.has(file.type)) {
      setAttachmentError('File type not allowed (images and PDF only)')
      return
    }
    if (onUploadAttachment) await onUploadAttachment(item.id, file)
  }

  async function saveEdit() {
    if (!onUpdate) return
    setSaving(true)
    try {
      await onUpdate(item.id, {
        title: editTitle.trim(),
        childId: editChildId,
        subjectId: editSubjectId,
        date: editDate,
        type: editType,
        notes: editNotes.trim() || undefined,
        reflection: editReflection.trim() || undefined,
        url: editUrl.trim() || undefined,
        lessonTaskId: editLessonTaskId || undefined,
      })
      setIsEditing(false)
    } catch {
      // keep form open on error
    } finally {
      setSaving(false)
    }
  }

  const filteredSubjects = subjects
    ? subjects.filter(s => s.childId === editChildId)
    : []
  const filteredLessons = lessons
    ? lessons.filter(l => l.childId === editChildId && (editSubjectId ? l.subjectId === editSubjectId : true))
    : []

  if (isEditing) {
    return (
      <div className="border border-blue-200 rounded-lg bg-white overflow-hidden">
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          {childOptions && childOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Child</label>
              <select
                value={editChildId}
                onChange={e => { setEditChildId(e.target.value); setEditSubjectId(''); setEditLessonTaskId('') }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Select child</option>
                {childOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {subjects && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <select
                value={editSubjectId}
                onChange={e => { setEditSubjectId(e.target.value); setEditLessonTaskId('') }}
                disabled={!editChildId}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Select subject</option>
                {filteredSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={editType}
                onChange={e => setEditType(e.target.value as EvidenceType)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {EVIDENCE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Parent reflection</label>
            <textarea
              value={editReflection}
              onChange={e => setEditReflection(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
            <input
              type="text"
              value={editUrl}
              onChange={e => setEditUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          {filteredLessons.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Linked lesson (optional)</label>
              <select
                value={editLessonTaskId}
                onChange={e => setEditLessonTaskId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {filteredLessons.map(l => (
                  <option key={l.id} value={l.id}>{l.title} ({l.dueDate})</option>
                ))}
              </select>
            </div>
          )}
          {(localAttachments.length > 0 || onUploadAttachment) && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Attachments</label>
              {localAttachments.map(att =>
                confirmDeleteAttachmentIdInEdit === att.id ? (
                  <InlineConfirm
                    key={att.id}
                    message="Remove attachment?"
                    detail={att.filename}
                    onConfirm={() => onDeleteAttachment!(att.id)}
                    onCancel={() => setConfirmDeleteAttachmentIdInEdit(null)}
                  />
                ) : (
                  <div key={att.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="break-all">{att.filename}</span>
                    {onDeleteAttachment && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAttachmentIdInEdit(att.id)}
                        aria-label={`Remove ${att.filename}`}
                        className="ml-auto p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )
              )}
              {onUploadAttachment && (
                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                    onChange={handleEditFileChange}
                    className="text-xs"
                  />
                  {attachmentError && <p className="text-xs text-red-600 mt-1">{attachmentError}</p>}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelEdit}
              aria-label="Cancel edit"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              aria-label="Save evidence"
              className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (confirmDelete) {
    return (
      <InlineConfirm
        message="Delete this evidence item?"
        detail={item.title}
        onConfirm={() => onDelete!(item.id)}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${TYPE_COLORS[item.type]}`}
          >
            {TYPE_LABELS[item.type]}
          </span>
          {(onUpdate || onEdit) && (
            <button
              onClick={startEdit}
              aria-label="Edit evidence"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete evidence"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 text-xs text-gray-500">
        <span>{childName}</span>
        <span>{subjectName}</span>
        <span>{item.date}</span>
      </div>

      {notesPreview && (
        <p className="text-sm text-gray-600">{notesPreview}</p>
      )}

      {item.reflection && (
        <div className="rounded-md bg-slate-50 border border-slate-100 px-3 py-2">
          <p className="text-xs font-semibold text-slate-500 mb-1">Parent reflection</p>
          <p className="text-sm text-slate-700">{item.reflection}</p>
        </div>
      )}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline break-all"
        >
          {item.url}
        </a>
      )}

      {item.lessonTaskId && (
        <div className="text-xs text-gray-400 italic">Linked to lesson</div>
      )}

      {item.attachments && item.attachments.length > 0 && (
        <div className="space-y-1 pt-1">
          {item.attachments.map(att => (
            <AttachmentRow
              key={att.id}
              attachment={att}
              onDeleteAttachment={onDeleteAttachment}
              confirmingId={confirmDeleteAttachmentId}
              onRequestDelete={setConfirmDeleteAttachmentId}
              onCancelDelete={() => setConfirmDeleteAttachmentId(null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AttachmentRow({
  attachment,
  onDeleteAttachment,
  confirmingId,
  onRequestDelete,
  onCancelDelete,
}: {
  attachment: EvidenceAttachmentMeta
  onDeleteAttachment?: (id: string) => Promise<void>
  confirmingId: string | null
  onRequestDelete: (id: string) => void
  onCancelDelete: () => void
}) {
  const href = `/api/portfolio/evidence/attachments/${attachment.id}`
  const isImage = attachment.mimeType.startsWith('image/')

  if (confirmingId === attachment.id) {
    return (
      <InlineConfirm
        message="Remove attachment?"
        detail={attachment.filename}
        onConfirm={() => onDeleteAttachment!(attachment.id)}
        onCancel={onCancelDelete}
      />
    )
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={attachment.filename}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
      >
        {isImage ? (
          <img
            src={href}
            alt={attachment.filename}
            className="w-10 h-10 object-cover rounded border border-gray-200 shrink-0"
          />
        ) : (
          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
        )}
        <span className="break-all">{attachment.filename}</span>
      </a>
      {onDeleteAttachment && (
        <button
          type="button"
          onClick={() => onRequestDelete(attachment.id)}
          aria-label={`Remove ${attachment.filename}`}
          className="ml-auto p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
