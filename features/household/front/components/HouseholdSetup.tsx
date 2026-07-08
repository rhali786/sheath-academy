'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { householdApi } from '../services/api'
import { useHousehold } from '../context'
import { SetupCard_SchoolYear } from './SetupCard_SchoolYear'
import { SetupCard_Children } from './SetupCard_Children'
import { SetupCard_Subjects } from './SetupCard_Subjects'
import { SetupCard_Lessons } from './SetupCard_Lessons'
import { SheathLogo } from '@/features/layout/front/components/SheathLogo'
import { SetupCard_Portfolio } from './SetupCard_Portfolio'
import { HouseholdLogoPicker } from './HouseholdLogoPicker'

interface SetupStatus {
  hasSchoolYear: boolean
  hasChildren: boolean
  hasSubjects: boolean
}

interface HouseholdSetupProps {
  /** Called when all required setup steps are satisfied. */
  onComplete?: () => void
}

export function HouseholdSetup({ onComplete }: HouseholdSetupProps = {}) {
  const { householdProfile, refetch } = useHousehold()

  // Household name form state
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Whether we are in the setup-cards phase (household exists either from
  // context on mount, or because it was just created in this session).
  const [inCardsPhase, setInCardsPhase] = useState(() => Boolean(householdProfile))

  // Status of the three required setup steps — null while still fetching.
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Fetch the current setup status from the three relevant endpoints.
  // Using a single useEffect with all three calls in parallel (documented choice).
  const fetchSetupStatus = useCallback(async () => {
    setCheckingStatus(true)
    try {
      const hid = householdProfile?.id
      const childrenUrl =
        hid != null && hid !== ''
          ? `/api/children/children?householdId=${encodeURIComponent(hid)}&includeArchived=false`
          : '/api/children/children?includeArchived=false'
      const [childrenRes, schoolYearRes, subjectsRes] = await Promise.all([
        fetch(childrenUrl).then((r) => r.json()),
        fetch('/api/school-years/active').then((r) => r.json()).catch(() => ({ data: null })),
        fetch('/api/subjects').then((r) => r.json()).catch(() => ({ data: [] })),
      ])

      const activeChildren = Array.isArray(childrenRes.data)
        ? (childrenRes.data as { isActive?: boolean }[]).filter((c) => c.isActive !== false)
        : []
      const hasSchoolYear = Boolean(schoolYearRes.data)
      const activeSubjects = Array.isArray(subjectsRes.data)
        ? (subjectsRes.data as { isActive?: boolean }[]).filter((s) => s.isActive !== false)
        : []

      setSetupStatus({
        hasChildren: activeChildren.length > 0,
        hasSchoolYear,
        hasSubjects: activeSubjects.length > 0,
      })
    } catch {
      setSetupStatus({ hasChildren: false, hasSchoolYear: false, hasSubjects: false })
    } finally {
      setCheckingStatus(false)
    }
  }, [householdProfile?.id])

  // Enter cards phase and start fetching status when appropriate.
  useEffect(() => {
    if (inCardsPhase) {
      fetchSetupStatus()
    }
  }, [inCardsPhase, fetchSetupStatus])

  // When all required (non-stub) steps are satisfied, signal completion.
  useEffect(() => {
    if (!setupStatus) return
    if (setupStatus.hasSchoolYear && setupStatus.hasChildren && setupStatus.hasSubjects) {
      refetch()
      onComplete?.()
    }
  }, [setupStatus, refetch, onComplete])

  // ── Household name form ────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setFormError(null)
    try {
      await householdApi.setup(name.trim())
      await refetch()
      setInCardsPhase(true)
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Cards phase ────────────────────────────────────────────────────────────

  if (inCardsPhase) {
    const showSchoolYear = !setupStatus?.hasSchoolYear
    const showChildren = !setupStatus?.hasChildren
    // Subjects card only shown when children exist but no subjects yet.
    const showSubjects = Boolean(setupStatus?.hasChildren && !setupStatus?.hasSubjects)
    // Stub cards shown once children exist (even if subjects still missing).
    const showStubs = Boolean(setupStatus?.hasChildren)

    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="w-full max-w-lg my-8">
          <div className="mb-8">
            <SheathLogo size={48} data-testid="sheath-logo" className="mb-4" />
            <h1 className="text-xl font-bold text-slate-900">Complete your setup</h1>
            <p className="text-sm text-slate-500 mt-1">
              A few more steps to get your dashboard ready.
            </p>
            <div className="mt-4">
              <HouseholdLogoPicker
                value={householdProfile?.logoPreset}
                onSaved={() => refetch()}
              />
            </div>
          </div>

          {checkingStatus && !setupStatus ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-forest-100 border-t-forest-900 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {showSchoolYear && (
                <SetupCard_SchoolYear onSchoolYearCreated={fetchSetupStatus} />
              )}
              {showChildren && householdProfile && (
                <SetupCard_Children
                  householdId={householdProfile.id}
                  onChildAdded={fetchSetupStatus}
                />
              )}
              {showSubjects && <SetupCard_Subjects onSubjectAdded={fetchSetupStatus} />}
              {showStubs && <SetupCard_Lessons />}
              {showStubs && <SetupCard_Portfolio />}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Household name form (existing behaviour — no household yet) ────────────

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="mb-6">
          <SheathLogo size={48} data-testid="sheath-logo" className="mb-4" />
          <h1 className="text-xl font-bold text-slate-900">Welcome to Sheath</h1>
          <p className="text-sm text-slate-500 mt-1">
            What would you like to call your household? This appears throughout your dashboard.
            You can rename it any time in Settings.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="household-name" className="block text-xs font-medium text-slate-600 mb-1.5">
            Household name
          </label>
          <input
            id="household-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ahmed Academy"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900 mb-4"
            autoFocus
            maxLength={80}
          />
          {formError && <p className="text-red-500 text-xs mb-3">{formError}</p>}
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full py-3 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Setting up…' : 'Set up my household'}
          </button>
        </form>
      </div>
    </div>
  )
}
