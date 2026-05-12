export type HeaderDateDisplay = {
  hijriDayMonthAr: string
  hijriYearAndGregorian: string
}

export type FormatHeaderDatesOptions = {
  /** Omit for the runtime default (usually the user's local zone). */
  timeZone?: string
}

export function formatHeaderDates(
  d: Date,
  options?: FormatHeaderDatesOptions
): HeaderDateDisplay {
  const timeZone = options?.timeZone
  const tzOpts = timeZone ? { timeZone } : {}

  const hijriDayMonthAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    ...tzOpts,
    day: 'numeric',
    month: 'long',
  }).format(d)

  const hijriYearParts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    ...tzOpts,
    year: 'numeric',
  }).formatToParts(d)
  const hijriYear =
    hijriYearParts.find((p) => p.type === 'year')?.value ??
    new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { ...tzOpts, year: 'numeric' }).format(d)

  const gregorian = new Intl.DateTimeFormat('en-GB', {
    ...tzOpts,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)

  return {
    hijriDayMonthAr,
    hijriYearAndGregorian: `${hijriYear} AH · ${gregorian}`,
  }
}
