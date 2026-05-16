import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EvidenceFilters } from '@/features/portfolio/front/components/EvidenceFilters'

const children = [
  { id: 'child_a', name: 'Adam' },
  { id: 'child_b', name: 'Khadijah' },
]

const subjects = [
  { id: 'sub_a', name: 'Math', childId: 'child_a' },
  { id: 'sub_b', name: 'Science', childId: 'child_b' },
]

describe('EvidenceFilters', () => {
  it('exposes child, subject, type, and date range filters', () => {
    render(
      <EvidenceFilters
        children={children}
        subjects={subjects}
        selectedChildId={null}
        selectedSubjectId={null}
        selectedType={null}
        startDate={null}
        endDate={null}
        onChildChange={jest.fn()}
        onSubjectChange={jest.fn()}
        onTypeChange={jest.fn()}
        onStartDateChange={jest.fn()}
        onEndDateChange={jest.fn()}
      />
    )

    expect(screen.getByLabelText('Child')).toBeInTheDocument()
    expect(screen.getByLabelText('Subject')).toBeInTheDocument()
    expect(screen.getByLabelText('Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Start date')).toBeInTheDocument()
    expect(screen.getByLabelText('End date')).toBeInTheDocument()
  })

  it('notifies callers when type and date range change', () => {
    const onTypeChange = jest.fn()
    const onStartDateChange = jest.fn()
    const onEndDateChange = jest.fn()

    render(
      <EvidenceFilters
        children={children}
        subjects={subjects}
        selectedChildId={null}
        selectedSubjectId={null}
        selectedType={null}
        startDate={null}
        endDate={null}
        onChildChange={jest.fn()}
        onSubjectChange={jest.fn()}
        onTypeChange={onTypeChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'link' } })
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-05-01' } })
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-05-31' } })

    expect(onTypeChange).toHaveBeenCalledWith('link')
    expect(onStartDateChange).toHaveBeenCalledWith('2026-05-01')
    expect(onEndDateChange).toHaveBeenCalledWith('2026-05-31')
  })
})
