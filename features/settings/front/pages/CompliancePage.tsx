'use client'

import { RecordsComplianceTab } from '@/features/settings/front/components/RecordsComplianceTab'

export function CompliancePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-testid="compliance-page">
      <RecordsComplianceTab />
    </div>
  )
}
