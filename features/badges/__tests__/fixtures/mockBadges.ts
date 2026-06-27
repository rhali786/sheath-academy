import type { BadgeDefinition, BadgeAward, BadgeCollectionItem } from '@/features/badges/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const mockBadgeDefinitions: BadgeDefinition[] = [
  {
    id: 'badge_fix_001',
    householdId: null, // starter badge
    title: 'Quran Champion',
    description: 'Memorized 10 surahs with correct recitation',
    criteria: 'Complete recitation of 10 surahs verified by parent',
    emblemKey: 'quran-champion',
    gradeBands: ['g1_4', 'g5_8'],
    verificationRequirement: 'parent',
    isStarter: true,
    enabled: true,
    visibility: 'platform',
  },
  {
    id: 'badge_fix_002',
    householdId: null,
    title: 'Math Master',
    description: 'Achieved 90%+ on 5 consecutive math assessments',
    criteria: 'Score 90 or above on 5 consecutive graded math attempts',
    emblemKey: 'math-master',
    gradeBands: ['g5_8', 'g9_12'],
    verificationRequirement: 'parent',
    isStarter: true,
    enabled: true,
    visibility: 'platform',
  },
  {
    id: 'badge_fix_003',
    householdId: SEED_IDS.household, // custom household badge
    title: 'Arabic Achiever',
    description: 'Completed Arabic curriculum with distinction',
    criteria: 'Finish all Arabic modules with 85%+ average',
    emblemKey: 'arabic-achiever',
    gradeBands: ['g1_4', 'g5_8', 'g9_12'],
    verificationRequirement: 'none',
    isStarter: false,
    enabled: true,
    visibility: 'household',
  },
  // Disabled badge — still shows as locked target
  {
    id: 'badge_fix_004',
    householdId: null,
    title: 'Science Explorer',
    description: 'Completed a science investigation project',
    criteria: 'Document a full scientific investigation with hypothesis, data, and conclusion',
    emblemKey: 'science-explorer',
    gradeBands: ['g5_8', 'g9_12'],
    verificationRequirement: 'parent',
    isStarter: true,
    enabled: false,
    visibility: 'platform',
  },
]

export const mockBadgeAwards: BadgeAward[] = [
  // Fully approved — earned
  {
    id: 'award_fix_001',
    householdId: SEED_IDS.household,
    learnerId: SEED_IDS.layth,
    badgeId: 'badge_fix_001',
    status: 'verified',
    submittedAt: '2026-04-10T10:00:00Z',
    verifiedAt: '2026-04-11T12:00:00Z',
    approvedAt: '2026-04-12T09:00:00Z',
    evidenceIds: ['ev_fix_001', 'ev_fix_002'],
  },
  // In-progress — submitted but not verified
  {
    id: 'award_fix_002',
    householdId: SEED_IDS.household,
    learnerId: SEED_IDS.layth,
    badgeId: 'badge_fix_002',
    status: 'submitted',
    submittedAt: '2026-05-20T08:00:00Z',
    verifiedAt: null,
    approvedAt: null,
    evidenceIds: ['ev_fix_003'],
  },
]

export const mockBadgeCollection: BadgeCollectionItem[] = [
  {
    definition: mockBadgeDefinitions[0],
    award: mockBadgeAwards[0],
    isEarned: true,
  },
  {
    definition: mockBadgeDefinitions[1],
    award: mockBadgeAwards[1],
    isEarned: false,
  },
  {
    definition: mockBadgeDefinitions[2],
    award: null,
    isEarned: false,
  },
]
