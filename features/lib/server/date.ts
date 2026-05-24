export function toDateString(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getHouseholdLocalDate(timezone: string): string {
  return toDateString(new Date(), timezone)
}
