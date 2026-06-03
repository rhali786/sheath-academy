export interface ChangelogEntry {
  id: string
  version: string
  label: string
  detail: string
  source: 'steward' | 'manual'
  prNumber: number | null
  userCredit: string | null
  status: 'pending' | 'shipped'
  createdAt: string
}
