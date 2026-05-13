'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { StudentProfile } from '@/features/lib/types'
import type { SchoolYear } from '@/features/school-year/types'
import { useHousehold } from '@/features/household/front/context'
import { householdApi } from '@/features/household/front/services/api'
import { HouseholdSettings } from '@/features/household/front/components/HouseholdSettings'
import { ChildrenProvider } from '@/features/children/front/context'
import { ChildList } from '@/features/children/front/components/ChildList'
import { SubjectForm } from '@/features/subjects/front/components/SubjectForm'
import { SubjectsAllTable } from '@/features/subjects/front/components/SubjectsAllTable'
import { SchoolYearForm } from '@/features/school-year/front/components/SchoolYearForm'
import { schoolYearApi } from '@/features/school-year/front/services/api'
import { childrenApi } from '@/features/children/front/services/api'

const TAB_IDS = ['household', 'school-year', 'children', 'subjects'] as const
export type SettingsTabId = (typeof TAB_IDS)[number]

const TABS: { id: SettingsTabId; label: string }[] = [
  { id: 'household', label: 'Household' },
  { id: 'school-year', label: 'School year' },
  { id: 'children', label: 'Children' },
  { id: 'subjects', label: 'Subjects' },
]

export function parseSettingsTab(raw: string | null): SettingsTabId {
  if (raw && (TAB_IDS as readonly string[]).includes(raw)) {
    return raw as SettingsTabId
  }
  return 'household'
}

export function SettingsPage() {
  const { workspace, householdProfile, familyName, refetch } = useHousehold()
  const householdId = householdProfile?.id ?? workspace?.id ?? ''
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab = useMemo(
    () => parseSettingsTab(searchParams.get('tab')),
    [searchParams],
  )

  const setTab = useCallback(
    (id: SettingsTabId) => {
      const q = id === 'household' ? '' : `?tab=${id}`
      router.replace(`/settings${q}`, { scroll: false })
    },
    [router],
  )

  const [renameName, setRenameName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renameSuccess, setRenameSuccess] = useState(false)

  const [activeYear, setActiveYear] = useState<SchoolYear | null>(null)
  const [activeYearLoading, setActiveYearLoading] = useState(false)

  const [subjectChildren, setSubjectChildren] = useState<StudentProfile[]>([])
  const [subjectChildrenLoading, setSubjectChildrenLoading] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState('')
  const [subjectRefreshKey, setSubjectRefreshKey] = useState(0)

  useEffect(() => {
    if (familyName) setRenameName(familyName)
  }, [familyName])

  const loadActiveYear = useCallback(() => {
    setActiveYearLoading(true)
    schoolYearApi
      .getActiveSchoolYear()
      .then((r) => setActiveYear(r.data ?? null))
      .catch(() => setActiveYear(null))
      .finally(() => setActiveYearLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab !== 'school-year' || !workspace) return
    loadActiveYear()
  }, [activeTab, workspace, loadActiveYear])

  useEffect(() => {
    if (activeTab !== 'subjects' || !householdId) return
    let cancelled = false
    setSubjectChildrenLoading(true)
    childrenApi
      .getChildren(householdId, false)
      .then((res) => {
        if (cancelled) return
        const list = (res.data ?? []).filter((c) => c.isActive !== false)
        setSubjectChildren(list)
        setSelectedChildId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev
          return list[0]?.id ?? ''
        })
      })
      .catch(() => {
        if (!cancelled) {
          setSubjectChildren([])
          setSelectedChildId('')
        }
      })
      .finally(() => {
        if (!cancelled) setSubjectChildrenLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, householdId])

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!renameName.trim() || renameName.trim() === familyName) return
    setRenaming(true)
    setRenameError(null)
    setRenameSuccess(false)
    try {
      await householdApi.updateProfile(renameName.trim())
      refetch()
      setRenameSuccess(true)
    } catch {
      setRenameError('Could not save. Please try again.')
    } finally {
      setRenaming(false)
    }
  }

  if (!workspace) {
    return <div className="p-6 text-center text-slate-500">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" data-testid="settings-page">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Settings</h1>

      <div
        className="flex flex-wrap gap-1 mb-8 border-b border-slate-200"
        role="tablist"
        aria-label="Settings sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            data-testid={`settings-tab-${t.id}`}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-forest-900 text-forest-900 bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'household' && (
        <section data-testid="settings-panel-household">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Household</h2>
          <p className="text-sm text-slate-500 mb-6">
            Configure household settings including name and week start day.
          </p>

          <div className="space-y-6">
            {/* Household name */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Household name</h3>
              <p className="text-xs text-slate-500 mb-3">
                This name appears in the header throughout the app.
              </p>
              <form onSubmit={handleRename} className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
                <label htmlFor="rename-household" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Name
                </label>
                <input
                  id="rename-household"
                  type="text"
                  value={renameName}
                  onChange={(e) => {
                    setRenameName(e.target.value)
                    setRenameSuccess(false)
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900 mb-4"
                  maxLength={80}
                />
                {renameError && <p className="text-red-500 text-xs mb-3">{renameError}</p>}
                {renameSuccess && <p className="text-green-600 text-xs mb-3">Household name updated.</p>}
                <button
                  type="submit"
                  disabled={!renameName.trim() || renameName.trim() === familyName || renaming}
                  className="px-5 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
                >
                  {renaming ? 'Saving…' : 'Save'}
                </button>
              </form>
            </div>

            {/* Week start day */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Week start day</h3>
              <p className="text-xs text-slate-500 mb-3">
                Choose which day your week starts on in the planner.
              </p>
              <HouseholdSettings />
            </div>
          </div>
        </section>
      )}

      {activeTab === 'school-year' && (
        <section data-testid="settings-panel-school-year">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">School year</h2>
          <p className="text-sm text-slate-500 mb-4">
            Define your academic year so lessons and progress line up with your calendar.
          </p>

          {activeYearLoading ? (
            <p className="text-sm text-slate-500 mb-4">Loading school year…</p>
          ) : activeYear ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Active school year</p>
              <p className="mt-1">
                {activeYear.name}{' '}
                <span className="text-slate-500">
                  ({activeYear.startDate} → {activeYear.endDate})
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-4">
              No active school year yet. Create one below.
            </p>
          )}

          <SchoolYearForm
            embedded
            onSuccess={() => {
              loadActiveYear()
            }}
          />
        </section>
      )}

      {activeTab === 'children' && (
        <section data-testid="settings-panel-children">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Children</h2>
          <p className="text-sm text-slate-500 mb-4">
            Add and manage profiles for each child in your household.
          </p>

          <ChildrenProvider householdId={householdId}>
            <ChildList />
          </ChildrenProvider>
        </section>
      )}

      {activeTab === 'subjects' && (
        <section data-testid="settings-panel-subjects">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Subjects</h2>
          <p className="text-sm text-slate-500 mb-4">
            Use the child tabs to choose who receives new subjects, then add a course. The table lists
            every subject in your household — edit to change name, child, or category.
          </p>

          {subjectChildrenLoading ? (
            <p className="text-sm text-slate-500">Loading children…</p>
          ) : subjectChildren.length === 0 ? (
            <p className="text-sm text-amber-700">Add a child in the Children tab first, then return here.</p>
          ) : (
            <>
              {subjectChildren.length >= 1 && (
                <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Child">
                  {subjectChildren.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={selectedChildId === c.id}
                      data-testid={`settings-subject-child-${c.id}`}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedChildId === c.id
                          ? 'bg-forest-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      onClick={() => setSelectedChildId(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md mb-2">
                <SubjectForm
                  householdId={householdId}
                  defaultChildId={selectedChildId || undefined}
                  hideChildSelect
                  onSuccess={() => setSubjectRefreshKey((k) => k + 1)}
                />
              </div>

              <h3 className="text-sm font-semibold text-slate-800 mb-2">All subjects</h3>
              <SubjectsAllTable
                childrenList={subjectChildren.map((c) => ({ id: c.id, name: c.name }))}
                refreshKey={subjectRefreshKey}
                onMutate={() => setSubjectRefreshKey((k) => k + 1)}
              />
            </>
          )}
        </section>
      )}
    </div>
  )
}
