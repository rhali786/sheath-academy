export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type TrackingMethod = 'days' | 'hours' | 'days-hours' | 'flexible'

export type TermStructure = 'full-year' | 'semesters' | 'quarters' | 'trimesters' | 'custom'

export interface SchoolBreak {
  id: string
  name: string
  startDate: string // ISO yyyy-mm-dd
  endDate: string   // ISO yyyy-mm-dd
}

export interface SchoolYear {
  id: string // 'schoolyear_<timestamp>_<n>'
  workspaceId: string
  name: string
  startDate: string // ISO yyyy-mm-dd
  endDate: string // ISO yyyy-mm-dd
  isActive: boolean
  createdAt: string
  // Wave 10 additions
  requiredDays?: number
  requiredHours?: number
  trackingMethod?: TrackingMethod
  schoolDays?: DayOfWeek[]
  breaks?: SchoolBreak[]
  termStructure?: TermStructure
}

export interface SchoolYearProgress {
  dayNumber: number
  totalDays: number
  weekNumber: number
  totalWeeks: number
}
