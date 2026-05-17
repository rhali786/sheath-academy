import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EvidenceList } from '@/features/portfolio/front/components/EvidenceList'
import type { EvidenceItem } from '@/features/portfolio/types'

function makeItem(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: 'evidence_001',
    title: 'Test Evidence',
    childId: 'child_a',
    subjectId: 'sub_a',
    date: '2026-05-12',
    type: 'note',
    notes: 'Some notes here',
    createdBy: 'demo-parent',
    createdAt: '2026-05-12T09:00:00Z',
    updatedAt: '2026-05-12T09:00:00Z',
    ...overrides,
  }
}

const childMap = { child_a: 'Adam' }
const subjectMap = { sub_a: 'Math' }

describe('EvidenceList', () => {
  it('shows loading state', () => {
    render(
      <EvidenceList
        items={[]}
        childMap={childMap}
        subjectMap={subjectMap}
        loading={true}
        error={null}
      />
    )
    expect(screen.getByText(/loading portfolio/i)).toBeInTheDocument()
  })

  it('shows empty state when items is empty', () => {
    render(
      <EvidenceList
        items={[]}
        childMap={childMap}
        subjectMap={subjectMap}
        loading={false}
        error={null}
      />
    )
    expect(screen.getByText(/no portfolio evidence yet/i)).toBeInTheDocument()
    expect(screen.getByText(/add a note or link/i)).toBeInTheDocument()
  })

  it('shows evidence items when populated', () => {
    const items = [
      makeItem({ id: 'ev_1', title: 'First Item' }),
      makeItem({ id: 'ev_2', title: 'Second Item' }),
    ]
    render(
      <EvidenceList
        items={items}
        childMap={childMap}
        subjectMap={subjectMap}
        loading={false}
        error={null}
      />
    )
    expect(screen.getByText('First Item')).toBeInTheDocument()
    expect(screen.getByText('Second Item')).toBeInTheDocument()
  })

  it('renders URL as a link when url is present', () => {
    const items = [
      makeItem({ url: 'https://example.com', type: 'link' }),
    ]
    render(
      <EvidenceList
        items={items}
        childMap={childMap}
        subjectMap={subjectMap}
        loading={false}
        error={null}
      />
    )
    const link = screen.getByRole('link', { name: /example\.com/i })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows parent reflection when present', () => {
    const items = [
      makeItem({ reflection: 'This shows careful narration and recall.' }),
    ]
    render(
      <EvidenceList
        items={items}
        childMap={childMap}
        subjectMap={subjectMap}
        loading={false}
        error={null}
      />
    )
    expect(screen.getByText(/this shows careful narration/i)).toBeInTheDocument()
  })

  it('shows linked lesson indicator when lessonTaskId is present', () => {
    const items = [makeItem({ lessonTaskId: 'lesson_a' })]
    render(
      <EvidenceList
        items={items}
        childMap={childMap}
        subjectMap={subjectMap}
        loading={false}
        error={null}
      />
    )
    expect(screen.getByText(/linked to lesson/i)).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(
      <EvidenceList
        items={[]}
        childMap={childMap}
        subjectMap={subjectMap}
        loading={false}
        error="Failed to load portfolio"
      />
    )
    expect(screen.getByText(/failed to load portfolio/i)).toBeInTheDocument()
  })
})

describe('EvidenceList — card click opens edit (Phase 5)', () => {
  it('calls onEdit when evidence card is clicked', () => {
    const onEdit = jest.fn()
    const item = makeItem({ id: 'ev_click', title: 'Clickable Evidence' })
    render(
      <EvidenceList
        items={[item]}
        childMap={childMap}
        subjectMap={subjectMap}
        loading={false}
        error={null}
        onEdit={onEdit}
      />
    )
    fireEvent.click(screen.getByText('Clickable Evidence'))
    expect(onEdit).toHaveBeenCalledWith(item)
  })

  it('does not call onEdit when onEdit is not provided', () => {
    const item = makeItem({ title: 'No Edit Handler' })
    expect(() => {
      render(
        <EvidenceList
          items={[item]}
          childMap={childMap}
          subjectMap={subjectMap}
          loading={false}
          error={null}
        />
      )
      fireEvent.click(screen.getByText('No Edit Handler'))
    }).not.toThrow()
  })
})
