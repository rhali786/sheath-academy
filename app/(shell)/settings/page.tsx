import { Suspense } from 'react'
import { SettingsPage } from '@/features/settings/front/pages/SettingsPage'

export default function SettingsRoutePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading...</div>}>
      <SettingsPage />
    </Suspense>
  )
}
