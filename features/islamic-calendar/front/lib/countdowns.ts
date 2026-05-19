import type { IslamicCountdown, HijriDate } from '../../types'
import { SACRED_MONTHS, HIJRI_MONTHS } from '../../types'

/**
 * Converts a Gregorian date to a Hijri date using the JDN algorithm.
 * Based on the formula from IslamicDateDisplay.tsx.
 */
export function gregorianToHijri(year: number, month: number, day: number): HijriDate {
  const jd =
    Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4) +
    Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4) +
    day -
    32075

  const l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29
  const hMonth = Math.floor((24 * l3) / 709)
  const hDay = l3 - Math.floor((709 * hMonth) / 24)
  const hYear = 30 * n + j - 30

  return { year: hYear, month: hMonth, day: hDay }
}

/**
 * Converts a Hijri date to an ISO Gregorian date string (yyyy-mm-dd).
 * Uses the tabular Islamic calendar (JDN formula) + Meeus JDN→Gregorian.
 */
export function hijriToGregorian(hYear: number, hMonth: number, hDay: number): string {
  // Tabular Islamic calendar: Hijri → JDN
  const jd =
    Math.floor((11 * hYear + 3) / 30) +
    354 * hYear +
    30 * hMonth -
    Math.floor((hMonth - 1) / 2) +
    hDay +
    1948440 -
    385

  // Meeus algorithm: JDN → Gregorian
  const l = jd + 68569
  const n = Math.floor((4 * l) / 146097)
  const l2 = l - Math.floor((146097 * n + 3) / 4)
  const i = Math.floor((4000 * (l2 + 1)) / 1461001)
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31
  const j = Math.floor((80 * l3) / 2447)
  const day = l3 - Math.floor((2447 * j) / 80)
  const l4 = Math.floor(j / 11)
  const month = j + 2 - 12 * l4
  const year = 100 * (n - 49) + i + l4

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Returns true if the given ISO date string falls within one of the four sacred months. */
export function isInSacredMonth(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number)
  const hijri = gregorianToHijri(y, m, d)
  return (SACRED_MONTHS as readonly number[]).includes(hijri.month)
}

/** Returns the Gregorian ISO dates for the White Days (13th, 14th, 15th) of a given Hijri month. */
export function getWhiteDays(
  hYear: number,
  hMonth: number,
): { day13: string; day14: string; day15: string } {
  return {
    day13: hijriToGregorian(hYear, hMonth, 13),
    day14: hijriToGregorian(hYear, hMonth, 14),
    day15: hijriToGregorian(hYear, hMonth, 15),
  }
}

function daysBetween(from: string, to: string): number {
  const d1 = new Date(from + 'T00:00:00Z')
  const d2 = new Date(to + 'T00:00:00Z')
  return Math.round((d2.getTime() - d1.getTime()) / 86400000)
}

/**
 * Returns the next occurrence of the given Hijri month+day on or after fromDateStr.
 * Tries the current Hijri year first, then next year.
 */
function nextOccurrence(
  fromDateStr: string,
  currentHijriYear: number,
  hMonth: number,
  hDay: number,
): string {
  const candidate = hijriToGregorian(currentHijriYear, hMonth, hDay)
  if (candidate >= fromDateStr) return candidate
  return hijriToGregorian(currentHijriYear + 1, hMonth, hDay)
}

/**
 * Returns upcoming Islamic event countdowns relative to the given ISO date string.
 * All returned events have daysUntil >= 0 (today or future), sorted ascending.
 */
export function getIslamicCalendarCountdowns(dateStr: string): IslamicCountdown[] {
  const [y, m, d] = dateStr.split('-').map(Number)
  const hijri = gregorianToHijri(y, m, d)
  const countdowns: IslamicCountdown[] = []

  // — Fixed-date annual events —

  // Ramadan (1 Ramadan, month 9)
  const ramadanDate = nextOccurrence(dateStr, hijri.year, 9, 1)
  countdowns.push({
    id: 'ramadan',
    name: 'Ramadan',
    description: 'The blessed month of fasting',
    date: ramadanDate,
    daysUntil: daysBetween(dateStr, ramadanDate),
  })

  // Eid al-Fitr (1 Shawwal, month 10)
  const eidFitrDate = nextOccurrence(dateStr, hijri.year, 10, 1)
  countdowns.push({
    id: 'eid-al-fitr',
    name: 'Eid al-Fitr',
    description: 'Festival of Breaking the Fast',
    date: eidFitrDate,
    daysUntil: daysBetween(dateStr, eidFitrDate),
  })

  // Day of Arafah (9 Dhul Hijjah, month 12)
  const arafahDate = nextOccurrence(dateStr, hijri.year, 12, 9)
  countdowns.push({
    id: 'day-of-arafah',
    name: 'Day of Arafah',
    description: 'The greatest day of the Islamic year',
    date: arafahDate,
    daysUntil: daysBetween(dateStr, arafahDate),
  })

  // Eid al-Adha (10 Dhul Hijjah, month 12)
  const eidAdhaDate = nextOccurrence(dateStr, hijri.year, 12, 10)
  countdowns.push({
    id: 'eid-al-adha',
    name: 'Eid al-Adha',
    description: 'Festival of Sacrifice',
    date: eidAdhaDate,
    daysUntil: daysBetween(dateStr, eidAdhaDate),
  })

  // Ashura (10 Muharram, month 1)
  const ashuraDate = nextOccurrence(dateStr, hijri.year, 1, 10)
  countdowns.push({
    id: 'ashura',
    name: 'Ashura',
    description: 'The 10th of Muharram',
    date: ashuraDate,
    daysUntil: daysBetween(dateStr, ashuraDate),
  })

  // — White Days (13th–15th of each Hijri month) —
  const thisDay13 = hijriToGregorian(hijri.year, hijri.month, 13)
  const thisDay15 = hijriToGregorian(hijri.year, hijri.month, 15)

  if (dateStr >= thisDay13 && dateStr <= thisDay15) {
    // Currently in white days
    countdowns.push({
      id: 'white-days',
      name: 'White Days',
      description: 'The 13th, 14th, and 15th of the Hijri month',
      date: thisDay13,
      daysUntil: 0,
    })
  } else if (dateStr < thisDay13) {
    // White days coming this Hijri month
    countdowns.push({
      id: 'white-days',
      name: 'White Days',
      description: 'The 13th, 14th, and 15th of the Hijri month',
      date: thisDay13,
      daysUntil: daysBetween(dateStr, thisDay13),
    })
  } else {
    // Past this month — use next Hijri month
    let nm = hijri.month + 1
    let ny = hijri.year
    if (nm > 12) {
      nm = 1
      ny += 1
    }
    const nextDay13 = hijriToGregorian(ny, nm, 13)
    countdowns.push({
      id: 'white-days',
      name: 'White Days',
      description: 'The 13th, 14th, and 15th of the Hijri month',
      date: nextDay13,
      daysUntil: daysBetween(dateStr, nextDay13),
    })
  }

  // — Sacred Month —
  if (isInSacredMonth(dateStr)) {
    countdowns.push({
      id: 'sacred-month',
      name: 'Sacred Month',
      description: `We are in ${HIJRI_MONTHS[hijri.month - 1]}, one of the sacred months`,
      date: dateStr,
      daysUntil: 0,
    })
  } else {
    // Find next sacred month
    let nextSacredMonth: number | null = null
    let nextSacredYear = hijri.year
    for (let offset = 1; offset <= 12; offset++) {
      let nm = hijri.month + offset
      let ny = hijri.year
      if (nm > 12) {
        nm -= 12
        ny += 1
      }
      if ((SACRED_MONTHS as readonly number[]).includes(nm)) {
        nextSacredMonth = nm
        nextSacredYear = ny
        break
      }
    }
    if (nextSacredMonth !== null) {
      const sacredDate = hijriToGregorian(nextSacredYear, nextSacredMonth, 1)
      countdowns.push({
        id: 'sacred-month',
        name: 'Sacred Month',
        description: `${HIJRI_MONTHS[nextSacredMonth - 1]} is a sacred month`,
        date: sacredDate,
        daysUntil: daysBetween(dateStr, sacredDate),
      })
    }
  }

  // Return only future/today events, sorted by proximity
  return countdowns.filter(c => c.daysUntil >= 0).sort((a, b) => a.daysUntil - b.daysUntil)
}
