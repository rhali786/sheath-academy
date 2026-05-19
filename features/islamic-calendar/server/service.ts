// Re-exports pure Hijri calculation utilities for server-side use.
// No store access — all logic is pure date arithmetic.
export {
  gregorianToHijri,
  hijriToGregorian,
  isInSacredMonth,
  getWhiteDays,
  getIslamicCalendarCountdowns,
} from '../front/lib/countdowns'
