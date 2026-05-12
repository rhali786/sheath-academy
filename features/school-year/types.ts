export interface SchoolYear {
  id: string // 'schoolyear_<timestamp>_<n>'
  workspaceId: string
  name: string
  startDate: string // ISO yyyy-mm-dd
  endDate: string // ISO yyyy-mm-dd
  isActive: boolean
  createdAt: string
}
