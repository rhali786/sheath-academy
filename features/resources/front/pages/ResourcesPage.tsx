'use client'

import { useState, useEffect } from 'react'
import { useHousehold } from '@/features/household/front/context'
import { resourcesApi } from '../services/api'
import { ResourceForm } from '../components/ResourceForm'
import { PacingCard } from '../components/PacingCard'
import { LessonGenerationPanel } from '../components/LessonGenerationPanel'
import { VerificationBadge } from '../components/VerificationBadge'
import type { Resource } from '@/features/resources/types'

export function ResourcesPage() {
  const { householdProfile, loading: householdLoading } = useHousehold()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Resource | null>(null)

  useEffect(() => {
    if (householdLoading) return
    const householdId = householdProfile?.id
    if (!householdId) {
      setLoading(false)
      return
    }
    resourcesApi.listResources(householdId)
      .then(res => setResources(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [householdProfile?.id, householdLoading])

  async function handleCreate(data: Parameters<typeof resourcesApi.createResource>[0]) {
    const res = await resourcesApi.createResource(data)
    setResources(prev => [...prev, res.data])
    setShowForm(false)
  }

  return (
    <main
      className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8"
      data-testid="resources-page"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Resources</h1>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800"
          data-testid="add-resource-button"
        >
          {showForm ? 'Cancel' : 'Add resource'}
        </button>
      </div>

      {showForm && householdProfile && (
        <div className="mb-8">
          <h2 className="form-section-heading">Add resource</h2>
          <div className="add-form-card">
            <ResourceForm
              workspaceId={householdProfile.id}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Loading resources…</p>}

      {!loading && resources.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm mb-3">No resources yet.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-sm text-forest-900 font-medium hover:underline"
          >
            Add your first resource
          </button>
        </div>
      )}

      <div className="space-y-4">
        {resources.map(resource => (
          <div
            key={resource.id}
            className="bg-white rounded-xl border border-slate-200 p-5"
            data-testid="resource-card"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{resource.title}</h3>
                <p className="text-xs text-slate-400">
                  {[resource.publisher, resource.edition].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <VerificationBadge status={resource.verificationStatus} />
                <button
                  type="button"
                  onClick={() => setSelected(selected?.id === resource.id ? null : resource)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                  data-testid={`resource-expand-${resource.id}`}
                >
                  {selected?.id === resource.id ? 'Collapse' : 'Details'}
                </button>
              </div>
            </div>

            {selected?.id === resource.id && (
              <div className="mt-4 space-y-4">
                {resource.totalPages && (
                  <PacingCard
                    paceResult={{
                      pagesPerDay: resource.totalPages / 150,
                    }}
                    totalPages={resource.totalPages}
                  />
                )}
                <LessonGenerationPanel resource={resource} />
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
