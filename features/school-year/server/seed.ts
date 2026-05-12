import type { SchoolYear } from '@/features/school-year/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const SEED_SCHOOL_YEARS: SchoolYear[] = [
  {
    id: SEED_IDS.schoolYear,
    workspaceId: SEED_IDS.workspace,
    name: '2025\u20132026',
    startDate: '2025-08-01',
    endDate: '2026-05-31',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]
