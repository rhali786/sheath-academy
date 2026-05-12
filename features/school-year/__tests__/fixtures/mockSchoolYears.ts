import type { SchoolYear } from '@/features/school-year/types'

export const mockSchoolYears: SchoolYear[] = [
  {
    id: 'schoolyear_seed_001',
    workspaceId: 'workspace_seed_001',
    name: '2025–2026',
    startDate: '2025-08-01',
    endDate: '2026-05-31',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'schoolyear_seed_002',
    workspaceId: 'workspace_seed_001',
    name: '2024–2025',
    startDate: '2024-08-01',
    endDate: '2025-05-31',
    isActive: false,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
]

export const activeYear = mockSchoolYears[0]
export const inactiveYear = mockSchoolYears[1]
