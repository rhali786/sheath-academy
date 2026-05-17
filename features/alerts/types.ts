export type AlertStatus = 'open' | 'dismissed' | 'resolved'
export type AlertSeverity = 'low' | 'medium' | 'high'
export type AlertSourceFeature =
  | 'planner'
  | 'attendance'
  | 'portfolio'
  | 'quran'
  | 'records'
  | 'dashboard'

export interface Alert {
  id: string
  childId: string | null
  childName?: string
  href?: string
  date?: string
  type: string
  status: AlertStatus
  severity: AlertSeverity
  title: string
  message: string
  sourceFeature: AlertSourceFeature
  sourceId?: string
  createdAt: string
  updatedAt?: string
}
