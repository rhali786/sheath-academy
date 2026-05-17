'use client'

import { useState, useEffect } from 'react'
import type { EvidenceItem, CreateEvidenceItemInput, EvidenceType } from '@/features/portfolio/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { LessonTask } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import { useHousehold } from '@/features/household/front/context'
import { childrenApi } from '@/features/children/front/services/api'
import { portfolioApi } from '../services/api'
import { EvidenceForm } from '../components/EvidenceForm'
import { EvidenceFilters } from '../components/EvidenceFilters'
import { EvidenceList } from '../components/EvidenceList'

export function PortfolioPage() {
  const { workspace, householdProfile, loading: householdLoading } = useHousehold()
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

  const [items, setItems] = useState<EvidenceItem[]>([])
  const [subjects, setSubjects] = useState<SubjectCourse[]>([])
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [filterChildId, setFilterChildId] = useState<string | null>(null)
  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<EvidenceType | null>(null)
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null)
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<EvidenceItem | null>(null)

  // Fetch children when household is ready
  useEffect(() => {
    if (householdLoading) return
    const householdId = householdProfile?.id ?? workspace?.id
    if (!householdId) return
    childrenApi.getChildren(householdId, false)
      .then(res => {
        const profiles = (res.data ?? []).filter(p => p.isActive)
        setStudentProfiles(profiles)
        if (profiles.length > 0) {
          setSelectedChildId(profiles[0].id)
          setFilterChildId(profiles[0].id)
        }
      })
      .catch(() => {})
  }, [householdLoading, workspace?.id, householdProfile?.id])

  // Sync filter when selected child changes
  useEffect(() => {
    setFilterChildId(selectedChildId)
    setFilterSubjectId(null)
  }, [selectedChildId])

  // Fetch subjects for filter
  useEffect(() => {
    const targetChildId = filterChildId ?? undefined
    const url = targetChildId ? `/api/subjects?childId=${targetChildId}` : '/api/subjects'
    fetch(url)
      .then(r => r.json())
      .then(res => setSubjects(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSubjects([]))
  }, [filterChildId])

  // Fetch lessons for linking evidence
  useEffect(() => {
    const targetChildId = filterChildId ?? undefined
    const subjectId = filterSubjectId ?? undefined
    if (!targetChildId) { setLessons([]); return }
    const params = new URLSearchParams({ childId: targetChildId })
    if (subjectId) params.set('subjectId', subjectId)
    fetch(`/api/planner/lessons?${params.toString()}`)
      .then(r => r.json())
      .then(res => setLessons(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLessons([]))
  }, [filterChildId, filterSubjectId])

  // Fetch evidence items
  useEffect(() => {
    setLoading(true)
    setError(null)
    portfolioApi
      .listEvidence({
        childId: filterChildId ?? undefined,
        subjectId: filterSubjectId ?? undefined,
        type: filterType ?? undefined,
        startDate: filterStartDate ?? undefined,
        endDate: filterEndDate ?? undefined,
      })
      .then(res => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(err => setError(err.message ?? 'Failed to load portfolio'))
      .finally(() => setLoading(false))
  }, [filterChildId, filterSubjectId, filterType, filterStartDate, filterEndDate])

  async function refreshItems() {
    const res = await portfolioApi.listEvidence({
      childId: filterChildId ?? undefined,
      subjectId: filterSubjectId ?? undefined,
      type: filterType ?? undefined,
      startDate: filterStartDate ?? undefined,
      endDate: filterEndDate ?? undefined,
    })
    setItems(Array.isArray(res.data) ? res.data : [])
  }

  async function handleSave(input: CreateEvidenceItemInput) {
    if (editingItem) {
      await portfolioApi.updateEvidence(editingItem.id, input)
      setEditingItem(null)
    } else {
      await portfolioApi.createEvidence(input)
    }
    await refreshItems()
  }

  function handleEdit(item: EvidenceItem) {
    setEditingItem(item)
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setEditingItem(null)
  }

  const children = studentProfiles.map(p => ({ id: p.id, name: p.name }))
  const childMap: Record<string, string> = {}
  children.forEach(c => { childMap[c.id] = c.name })
  const subjectMap: Record<string, string> = {}
  subjects.forEach(s => { subjectMap[s.id] = s.name })
  const subjectOptions = subjects.map(s => ({ id: s.id, name: s.name, childId: s.childId }))
  const lessonOptions = lessons.map(l => ({ id: l.id, title: l.title, dueDate: l.dueDate, childId: l.childId, subjectId: l.subjectId }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-4">
      <h2 className="text-xl font-bold text-gray-900">Portfolio</h2>

      <EvidenceForm
        key={editingItem?.id ?? 'new'}
        children={children}
        subjects={subjectOptions}
        lessons={lessonOptions}
        onSave={handleSave}
        initialChildId={filterChildId}
        editingItem={editingItem}
        onCancelEdit={handleCancelEdit}
      />

      <EvidenceFilters
        children={children}
        subjects={subjectOptions}
        selectedChildId={filterChildId}
        selectedSubjectId={filterSubjectId}
        selectedType={filterType}
        startDate={filterStartDate}
        endDate={filterEndDate}
        onChildChange={setFilterChildId}
        onSubjectChange={setFilterSubjectId}
        onTypeChange={setFilterType}
        onStartDateChange={setFilterStartDate}
        onEndDateChange={setFilterEndDate}
      />

      <EvidenceList
        items={items}
        childMap={childMap}
        subjectMap={subjectMap}
        loading={loading}
        error={error}
        hasActiveFilters={!!(filterSubjectId || filterType || filterStartDate || filterEndDate)}
        onEdit={handleEdit}
      />
    </div>
  )
}
