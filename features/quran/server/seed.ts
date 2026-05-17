import type { QuranSession } from '@/features/lib/types'
import { SEED_IDS } from '@/features/lib/seedIds'

function pad(n: number) { return String(n).padStart(2, '0') }
function dateMinusDays(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Streak lengths per child
// Talut (Grade 7, most advanced): 21-day streak
// Layth (Grade 4): 14-day streak
// Samurai (Grade 4): 13-day streak
// Hawa (Grade 1, youngest): 10-day streak

const TALUT_SURAHS = [
  { surah: 'Al-Mulk', from: 1, to: 10, type: 'Revision' },
  { surah: 'Al-Mulk', from: 11, to: 20, type: 'New memorisation' },
  { surah: 'Al-Mulk', from: 21, to: 30, type: 'New memorisation' },
  { surah: 'Ar-Rahman', from: 1, to: 15, type: 'Revision' },
  { surah: 'Ar-Rahman', from: 16, to: 30, type: 'Recitation' },
  { surah: 'Al-Waqia', from: 1, to: 20, type: 'Revision' },
  { surah: 'Al-Waqia', from: 21, to: 40, type: 'New memorisation' },
  { surah: 'Yaseen', from: 1, to: 20, type: 'Revision' },
  { surah: 'Yaseen', from: 21, to: 40, type: 'Recitation' },
  { surah: 'Yaseen', from: 41, to: 60, type: 'New memorisation' },
  { surah: 'Al-Kahf', from: 1, to: 15, type: 'Revision' },
  { surah: 'Al-Kahf', from: 16, to: 30, type: 'Recitation' },
  { surah: 'Al-Baqarah', from: 1, to: 10, type: 'Revision' },
  { surah: 'Al-Baqarah', from: 11, to: 20, type: 'New memorisation' },
  { surah: 'Al-Baqarah', from: 21, to: 30, type: 'Revision' },
  { surah: 'Al-Imran', from: 1, to: 10, type: 'Recitation' },
  { surah: 'Al-Mulk', from: 1, to: 30, type: 'Full revision' },
  { surah: 'Ar-Rahman', from: 1, to: 40, type: 'Revision' },
  { surah: 'Yaseen', from: 1, to: 30, type: 'Recitation' },
  { surah: 'Al-Waqia', from: 1, to: 30, type: 'Revision' },
  { surah: 'Al-Kahf', from: 1, to: 20, type: 'Recitation' },
]

const LAYTH_SURAHS = [
  { surah: 'Al-Fatiha', from: 1, to: 7, type: 'Revision' },
  { surah: 'Al-Baqarah', from: 1, to: 5, type: 'New memorisation' },
  { surah: 'Al-Ikhlas', from: 1, to: 4, type: 'Revision' },
  { surah: 'Al-Falaq', from: 1, to: 5, type: 'Recitation' },
  { surah: 'An-Nas', from: 1, to: 6, type: 'Revision' },
  { surah: 'Al-Asr', from: 1, to: 3, type: 'New memorisation' },
  { surah: 'Al-Kafirun', from: 1, to: 6, type: 'Revision' },
  { surah: 'Al-Nasr', from: 1, to: 3, type: 'Recitation' },
  { surah: 'Al-Masad', from: 1, to: 5, type: 'New memorisation' },
  { surah: 'Al-Ikhlas', from: 1, to: 4, type: 'Full revision' },
  { surah: 'Al-Fatiha', from: 1, to: 7, type: 'Recitation' },
  { surah: 'Al-Alaq', from: 1, to: 5, type: 'New memorisation' },
  { surah: 'Al-Baqarah', from: 6, to: 10, type: 'New memorisation' },
  { surah: 'Al-Falaq', from: 1, to: 5, type: 'Revision' },
]

const SAMURAI_SURAHS = [
  { surah: 'Al-Fatiha', from: 1, to: 7, type: 'Revision' },
  { surah: 'Al-Ikhlas', from: 1, to: 4, type: 'Revision' },
  { surah: 'Al-Mulk', from: 1, to: 8, type: 'New memorisation' },
  { surah: 'Al-Mulk', from: 9, to: 15, type: 'New memorisation' },
  { surah: 'Al-Falaq', from: 1, to: 5, type: 'Recitation' },
  { surah: 'An-Nas', from: 1, to: 6, type: 'Revision' },
  { surah: 'Al-Asr', from: 1, to: 3, type: 'Recitation' },
  { surah: 'Al-Mulk', from: 1, to: 15, type: 'Revision' },
  { surah: 'Al-Kafirun', from: 1, to: 6, type: 'New memorisation' },
  { surah: 'Al-Baqarah', from: 1, to: 5, type: 'Recitation' },
  { surah: 'Al-Mulk', from: 16, to: 22, type: 'New memorisation' },
  { surah: 'Al-Ikhlas', from: 1, to: 4, type: 'Full revision' },
  { surah: 'Al-Fatiha', from: 1, to: 7, type: 'Recitation' },
]

const HAWA_SURAHS = [
  { surah: 'Al-Fatiha', from: 1, to: 7, type: 'Revision' },
  { surah: 'Al-Ikhlas', from: 1, to: 4, type: 'Revision' },
  { surah: 'Al-Falaq', from: 1, to: 5, type: 'New memorisation' },
  { surah: 'An-Nas', from: 1, to: 6, type: 'Recitation' },
  { surah: 'Al-Fatiha', from: 1, to: 7, type: 'Recitation' },
  { surah: 'Al-Ikhlas', from: 1, to: 4, type: 'Full revision' },
  { surah: 'Al-Asr', from: 1, to: 3, type: 'New memorisation' },
  { surah: 'Al-Falaq', from: 1, to: 5, type: 'Revision' },
  { surah: 'An-Nas', from: 1, to: 6, type: 'Revision' },
  { surah: 'Al-Fatiha', from: 1, to: 7, type: 'Full revision' },
]

function makeSessions(
  childId: string,
  surahs: typeof TALUT_SURAHS,
  streakDays: number,
  idPrefix: string,
): QuranSession[] {
  return surahs.slice(0, streakDays).map((s, i) => ({
    id: `${idPrefix}_${String(i + 1).padStart(3, '0')}`,
    childId,
    type: s.type,
    surah: s.surah,
    fromAyah: s.from,
    toAyah: s.to,
    notes: i === 0 ? 'Excellent focus today' : i % 4 === 0 ? 'Good tajweed' : '',
    date: dateMinusDays(streakDays - 1 - i),
    lastLogged: i === streakDays - 1 ? 'Today' : `${streakDays - 1 - i} days ago`,
  }))
}

export const SEED_QURAN_SESSIONS: QuranSession[] = [
  ...makeSessions(SEED_IDS.talut,   TALUT_SURAHS,   21, 'quran_talut'),
  ...makeSessions(SEED_IDS.layth,   LAYTH_SURAHS,   14, 'quran_layth'),
  ...makeSessions(SEED_IDS.samurai, SAMURAI_SURAHS, 13, 'quran_samurai'),
  ...makeSessions(SEED_IDS.hawa,    HAWA_SURAHS,    10, 'quran_hawa'),
]
