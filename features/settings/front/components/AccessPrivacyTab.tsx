'use client'

import { MemberManager } from '@/features/household/front/components/MemberManager'

export function AccessPrivacyTab() {
  return (
    <section data-testid="settings-panel-access-privacy">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Access & Privacy</h2>
      <p className="text-sm text-slate-500 mb-6">
        Manage learner login permissions, data export, and household access.
      </p>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Household members</h3>
          <MemberManager />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Learner login management</h3>
          <p className="text-xs text-slate-500 mb-4">
            Configure which learners can sign in with their own username and password.
            Learner login credentials are set in the Learners tab.
          </p>
          <p className="text-xs text-slate-400">
            To enable or disable login for a specific learner, go to Settings → Learners → Edit profile.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Data export</h3>
          <p className="text-xs text-slate-500 mb-4">
            Download a copy of all household data including learner profiles, attendance records, and lesson history.
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Export household data
          </button>
        </div>
      </div>
    </section>
  )
}
