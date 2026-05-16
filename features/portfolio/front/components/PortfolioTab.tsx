'use client'

import { useState, useEffect } from 'react'
import type { EvidenceItem, CreateEvidenceItemInput, EvidenceType } from '@/features/portfolio/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { LessonTask } from '@/features/planner/types'
import type { StudentProfile } from '@/features/lib/types'
import { useContext_Dashboard } from '@/features/dashboard/front/context'
import { portfolioApi } from '../services/api'
import { EvidenceForm } from './EvidenceForm'
import { EvidenceFilters } from './EvidenceFilters'
import { EvidenceList } from './EvidenceList'

export function PortfolioTab() {
  const { children: studentProfiles, selectedChildId } = useContext_Dashboard()

  const [items, setItems] = useState<EvidenceItem[]>([])
  const [subjects, setSubjects] = useState<SubjectCourse[]>([])
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [filterChildId, setFilterChildId] = useState<string | null>(selectedChildId)
  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<EvidenceType | null>(null)
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null)
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const children = studentProfiles.map((p: StudentProfile) => ({ id: p.id, name: p.name }))

  useEffect(() => {
    setFilterChildId(selectedChildId)
    setFilterSubjectId(null)
  }, [selectedChildId])

  useEffect(() => {
    const targetChildId = filterChildId ?? undefined
    if (targetChildId) {
      fetch(`/api/subjects?childId=${targetChildId}`)
        .then(r => r.json())
        .then(res => setSubjects(Array.isArray(res.data) ? res.data : []))
        .catch(() => setSubjects([]))
    } else {
      fetch('/api/subjects')
        .then(r => r.json())
        .then(res => setSubjects(Array.isArray(res.data) ? res.data : []))
        .catch(() => setSubjects([]))
    }
  }, [filterChildId])

  useEffect(() => {
    const targetChildId = filterChildId ?? undefined
    const subjectId = filterSubjectId ?? undefined
    if (targetChildId) {
      const params = new URLSearchParams({ childId: targetChildId })
      if (subjectId) params.set('subjectId', subjectId)
      fetch(`/api/planner/lessons?${params.toString()}`)
        .then(r => r.json())
        .then(res => setLessons(Array.isArray(res.data) ? res.data : []))
        .catch(() => setLessons([]))
    } else {
      setLessons([])
    }
  }, [filterChildId, filterSubjectId])

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

  async function handleSave(input: CreateEvidenceItemInput) {
    await portfolioApi.createEvidence(input)
    const res = await portfolioApi.listEvidence({
      childId: filterChildId ?? undefined,
      subjectId: filterSubjectId ?? undefined,
      type: filterType ?? undefined,
      startDate: filterStartDate ?? undefined,
      endDate: filterEndDate ?? undefined,
    })
    setItems(Array.isArray(res.data) ? res.data : [])
  }

  const childMap: Record<string, string> = {}
  children.forEach(c => { childMap[c.id] = c.name })

  const subjectMap: Record<string, string> = {}
  subjects.forEach(s => { subjectMap[s.id] = s.name })

  const subjectOptions = subjects.map(s => ({
    id: s.id,
    name: s.name,
    childId: s.childId,
  }))

  const lessonOptions = lessons.map(l => ({
    id: l.id,
    title: l.title,
    dueDate: l.dueDate,
    childId: l.childId,
    subjectId: l.subjectId,
  }))

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-bold text-gray-900">Portfolio</h2>

      <EvidenceForm
        children={children}
        subjects={subjectOptions}
        lessons={lessonOptions}
        onSave={handleSave}
        initialChildId={filterChildId}
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
      />
    </div>
  )
}
