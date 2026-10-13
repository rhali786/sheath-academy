'use client'

interface GroupEditOptionsProps {
  /** The learner whose copy is being edited, for "Date and time change for Adam only." */
  childName: string
  applyToGroup: boolean
  applyScheduleToGroup: boolean
  onApplyToGroupChange: (value: boolean) => void
  onApplyScheduleToGroupChange: (value: boolean) => void
}

/**
 * Shared-lesson save options, used by both lesson editors (inline card and Edit lesson
 * window). Title and details go to every learner by default; date and time stay with
 * this learner unless the parent asks to move everyone. Either way only the fields the
 * parent changed are copied, so another learner's own day or title is kept.
 */
export function GroupEditOptions({
  childName,
  applyToGroup,
  applyScheduleToGroup,
  onApplyToGroupChange,
  onApplyScheduleToGroupChange,
}: GroupEditOptionsProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={applyToGroup}
          onChange={e => onApplyToGroupChange(e.target.checked)}
          aria-label="Apply to all learners in group"
          className="rounded border-slate-300 text-forest-900 focus:ring-forest-500"
        />
        Apply title and details to all learners in this group
      </label>
      {applyToGroup && (
        <div className="pl-6 space-y-1">
          <p className="text-xs text-slate-500">Only what you change here is copied to the other learners.</p>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={applyScheduleToGroup}
              onChange={e => onApplyScheduleToGroupChange(e.target.checked)}
              aria-label="Also move the date and time for every learner"
              className="rounded border-slate-300 text-forest-900 focus:ring-forest-500"
            />
            Also move the date and time for every learner
          </label>
          {!applyScheduleToGroup && (
            <p className="text-xs text-slate-500">Date and time change for {childName} only.</p>
          )}
        </div>
      )}
    </div>
  )
}
