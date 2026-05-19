export type IslamicEventName =
  | 'Ramadan'
  | 'Eid al-Fitr'
  | 'Eid al-Adha'
  | 'Day of Arafah'
  | 'Ashura'
  | 'White Days'
  | 'Sacred Month'

export interface IslamicCountdown {
  id: string
  name: IslamicEventName
  description: string
  /** Gregorian date of the event (ISO yyyy-mm-dd) */
  date: string
  /** Days remaining until the event. 0 = today, negative = past. */
  daysUntil: number
}

export interface HijriDate {
  year: number
  month: number
  day: number
}

export const SACRED_MONTHS = [1, 7, 11, 12] as const // Muharram, Rajab, Dhul-Qi'dah, Dhul-Hijjah

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhul Qi'dah", 'Dhul Hijjah',
] as const
