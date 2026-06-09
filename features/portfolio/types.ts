export type EvidenceType = 'note' | 'link' | 'writing_sample' | 'project' | 'recitation' | 'other'

export interface EvidenceItem {
  id: string
  title: string
  childId: string
  subjectId: string
  date: string
  type: EvidenceType
  notes?: string
  reflection?: string
  url?: string
  lessonTaskId?: string
  attachments?: EvidenceAttachmentMeta[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface EvidenceAttachmentMeta {
  id: string
  evidenceItemId: string
  filename: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export interface CreateEvidenceItemInput {
  title: string
  childId: string
  subjectId: string
  date: string
  type: EvidenceType
  notes?: string
  reflection?: string
  url?: string
  lessonTaskId?: string
}
