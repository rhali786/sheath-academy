import type { Metadata } from 'next'
import { AdminValidationSummary } from '@/features/product-validation/front/components/AdminValidationSummary'
import { AdminMetricsDashboard } from '@/features/admin-metrics/front/components/AdminMetricsDashboard'
import { AdminPageGuard } from '@/features/admin-metrics/front/components/AdminPageGuard'
import { AdminFeedbackSection } from '@/features/feedback/front/components/AdminFeedbackSection'

export const metadata: Metadata = {
  title: 'Admin metrics — Sheath Academy',
  description: 'Internal Fork Test usage metrics and product validation.',
}

export default function AdminMetricsPage() {
  return (
    <AdminPageGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin metrics</h1>
        <p className="text-sm text-slate-500 mb-8">
          Fork Test usage signals and product validation. Restricted to configured admin accounts.
        </p>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Usage metrics</h2>
          <AdminMetricsDashboard />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Product validation</h2>
          <AdminValidationSummary />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">User feedback</h2>
          <AdminFeedbackSection />
        </section>
      </div>
    </AdminPageGuard>
  )
}
