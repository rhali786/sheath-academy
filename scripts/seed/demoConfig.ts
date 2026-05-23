import { DEV_PG_SEED, DEMO_B_PG_SEED } from '../../features/lib/seedIds'

export interface SubjectConfig {
  id: string
  name: string
  category: string
}

export interface LearnerConfig {
  id: string
  key: string
  name: string
  gradeLevel: string
  sortOrder: number
  subjects: SubjectConfig[]
}

export interface HouseholdSeedConfig {
  hhKey: string
  userId: string
  householdId: string
  email: string
  userName: string
  householdName: string
  isAdmin: boolean
  schoolYearId: string
  productValId: string
  learners: LearnerConfig[]
}

export function getDemoHouseholdConfigs(devEmail: string, aminaEmail: string): HouseholdSeedConfig[] {
  return [
    {
      hhKey: 'a',
      userId: DEV_PG_SEED.userId,
      householdId: DEV_PG_SEED.householdId,
      email: devEmail,
      userName: 'Dev User',
      householdName: 'Barakah Academy',
      isAdmin: true,
      schoolYearId: DEV_PG_SEED.schoolYear,
      productValId: DEV_PG_SEED.productVal,
      learners: [
        {
          id: DEV_PG_SEED.layth,
          key: 'layth',
          name: 'Layth',
          gradeLevel: 'Grade 4',
          sortOrder: 0,
          subjects: [
            { id: DEV_PG_SEED.subLaythMath, name: 'Mathematics', category: 'core' },
            { id: DEV_PG_SEED.subLaythQuran, name: 'Quran', category: 'quran' },
            { id: DEV_PG_SEED.subLaythArabic, name: 'Arabic', category: 'language' },
            { id: DEV_PG_SEED.subLaythScience, name: 'Science', category: 'core' },
          ],
        },
        {
          id: DEV_PG_SEED.hawa,
          key: 'hawa',
          name: 'Hawa',
          gradeLevel: 'Grade 1',
          sortOrder: 1,
          subjects: [
            { id: DEV_PG_SEED.subHawaMath, name: 'Mathematics', category: 'core' },
            { id: DEV_PG_SEED.subHawaReading, name: 'Reading', category: 'core' },
            { id: DEV_PG_SEED.subHawaQuran, name: 'Quran', category: 'quran' },
          ],
        },
        {
          id: DEV_PG_SEED.idris,
          key: 'idris',
          name: 'Idris',
          gradeLevel: 'Grade 2',
          sortOrder: 2,
          subjects: [
            { id: DEV_PG_SEED.subIdrisMath, name: 'Mathematics', category: 'core' },
            { id: DEV_PG_SEED.subIdrisQuran, name: 'Quran', category: 'quran' },
            { id: DEV_PG_SEED.subIdrisHistory, name: 'History', category: 'enrichment' },
          ],
        },
        {
          id: DEV_PG_SEED.safiya,
          key: 'safiya',
          name: 'Safiya',
          gradeLevel: 'Grade 3',
          sortOrder: 3,
          subjects: [
            { id: DEV_PG_SEED.subSafiyaMath, name: 'Mathematics', category: 'core' },
            { id: DEV_PG_SEED.subSafiyaQuran, name: 'Quran', category: 'quran' },
            { id: DEV_PG_SEED.subSafiyaWriting, name: 'Writing', category: 'core' },
          ],
        },
        {
          id: DEV_PG_SEED.hamza,
          key: 'hamza',
          name: 'Hamza',
          gradeLevel: 'Kindergarten',
          sortOrder: 4,
          subjects: [
            { id: DEV_PG_SEED.subHamzaMath, name: 'Mathematics', category: 'core' },
            { id: DEV_PG_SEED.subHamzaReading, name: 'Reading', category: 'core' },
            { id: DEV_PG_SEED.subHamzaArt, name: 'Art', category: 'enrichment' },
          ],
        },
      ],
    },
    {
      hhKey: 'b',
      userId: DEMO_B_PG_SEED.userId,
      householdId: DEMO_B_PG_SEED.householdId,
      email: aminaEmail,
      userName: 'Amina',
      householdName: 'Crescent Cove Learning',
      isAdmin: false,
      schoolYearId: DEMO_B_PG_SEED.schoolYear,
      productValId: DEMO_B_PG_SEED.productVal,
      learners: [
        {
          id: DEMO_B_PG_SEED.khalid,
          key: 'khalid',
          name: 'Khalid',
          gradeLevel: 'Grade 5',
          sortOrder: 0,
          subjects: [
            { id: DEMO_B_PG_SEED.subKhalidMath, name: 'Mathematics', category: 'core' },
            { id: DEMO_B_PG_SEED.subKhalidQuran, name: 'Quran', category: 'quran' },
            { id: DEMO_B_PG_SEED.subKhalidScience, name: 'Science', category: 'core' },
            { id: DEMO_B_PG_SEED.subKhalidHistory, name: 'History', category: 'enrichment' },
          ],
        },
        {
          id: DEMO_B_PG_SEED.zaynab,
          key: 'zaynab',
          name: 'Zaynab',
          gradeLevel: 'Grade 3',
          sortOrder: 1,
          subjects: [
            { id: DEMO_B_PG_SEED.subZaynabMath, name: 'Mathematics', category: 'core' },
            { id: DEMO_B_PG_SEED.subZaynabQuran, name: 'Quran', category: 'quran' },
            { id: DEMO_B_PG_SEED.subZaynabWriting, name: 'Writing', category: 'core' },
            { id: DEMO_B_PG_SEED.subZaynabArabic, name: 'Arabic', category: 'language' },
          ],
        },
        {
          id: DEMO_B_PG_SEED.maryam,
          key: 'maryam',
          name: 'Maryam',
          gradeLevel: 'Kindergarten',
          sortOrder: 2,
          subjects: [
            { id: DEMO_B_PG_SEED.subMaryamMath, name: 'Mathematics', category: 'core' },
            { id: DEMO_B_PG_SEED.subMaryamReading, name: 'Reading', category: 'core' },
          ],
        },
        {
          id: DEMO_B_PG_SEED.yusuf,
          key: 'yusuf',
          name: 'Yusuf',
          gradeLevel: 'Grade 2',
          sortOrder: 3,
          subjects: [
            { id: DEMO_B_PG_SEED.subYusufMath, name: 'Mathematics', category: 'core' },
            { id: DEMO_B_PG_SEED.subYusufQuran, name: 'Quran', category: 'quran' },
          ],
        },
        {
          id: DEMO_B_PG_SEED.bilal,
          key: 'bilal',
          name: 'Bilal',
          gradeLevel: 'Grade 1',
          sortOrder: 4,
          subjects: [
            { id: DEMO_B_PG_SEED.subBilalMath, name: 'Mathematics', category: 'core' },
            { id: DEMO_B_PG_SEED.subBilalReading, name: 'Reading', category: 'core' },
            { id: DEMO_B_PG_SEED.subBilalQuran, name: 'Quran', category: 'quran' },
          ],
        },
      ],
    },
  ]
}
