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
  createdBy: string
  createdAt: string
  updatedAt: string
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
