const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhul Qi'dah", 'Dhul Hijjah',
]

function gregorianToHijri(year: number, month: number, day: number): { year: number; month: number; day: number } {
  const jd = Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4)
    + Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4)
    + day - 32075

  const l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 = l2
    - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43)
    + 29
  const hMonth = Math.floor((24 * l3) / 709)
  const hDay = l3 - Math.floor((709 * hMonth) / 24)
  const hYear = 30 * n + j - 30

  return { year: hYear, month: hMonth, day: hDay }
}

function formatGregorian(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export function IslamicDateDisplay() {
  const today = new Date()
  const { year, month, day } = gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const hijriStr = `${day} ${HIJRI_MONTHS[month - 1]} ${year} AH`

  return (
    <div className="text-center sm:text-left">
      <p className="text-sm font-medium text-slate-700">{formatGregorian(today)}</p>
      <p className="text-xs text-slate-400 mt-0.5">{hijriStr}</p>
    </div>
  )
}
