import type { EvidenceItem } from '../types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const SEED_EVIDENCE: EvidenceItem[] = [
  {
    id: 'evidence_seed_001',
    title: 'Quran Recitation - Surah Al-Fatiha',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_001',
    date: '2026-05-12',
    type: 'recitation',
    notes: 'Adam recited Al-Fatiha with proper tajweed. Excellent pronunciation.',
    reflection: 'This shows steady memorisation progress and confidence reciting aloud.',
    createdBy: 'demo-parent',
    createdAt: '2026-05-12T09:00:00.000Z',
    updatedAt: '2026-05-12T09:00:00.000Z',
  },
  {
    id: 'evidence_seed_002',
    title: 'Math Worksheet - Fractions',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_001',
    date: '2026-05-13',
    type: 'project',
    notes: 'Completed fractions worksheet. Got 9/10 correct.',
    createdBy: 'demo-parent',
    createdAt: '2026-05-13T10:30:00.000Z',
    updatedAt: '2026-05-13T10:30:00.000Z',
  },
  {
    id: 'evidence_seed_003',
    title: 'Khan Academy - Long Division',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_001',
    date: '2026-05-14',
    type: 'link',
    url: 'https://www.khanacademy.org/math/arithmetic/arith-review-multiply-divide/modal/v/long-division',
    notes: 'Watched video lesson on long division.',
    createdBy: 'demo-parent',
    createdAt: '2026-05-14T11:00:00.000Z',
    updatedAt: '2026-05-14T11:00:00.000Z',
  },
]
