'use client'

import type { StudentProfile } from '@/features/lib/types'

interface ChildCardProps {
  child: StudentProfile
  onEdit: (child: StudentProfile) => void
  onArchive: (child: StudentProfile) => void
  onRestore: (child: StudentProfile) => void
}

export function ChildCard({ child, onEdit, onArchive, onRestore }: ChildCardProps) {
  const formattedDob = child.dob ? new Date(child.dob).toLocaleDateString() : 'Not specified'

  return (
    <div className={`border rounded-lg p-4 ${child.isActive ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-forest-900 text-white flex items-center justify-center font-bold text-sm">
            {child.avatarInitials || child.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className={`font-semibold ${child.isActive ? 'text-slate-900' : 'text-slate-600'}`}>
              {child.name}
            </h3>
            <p className="text-xs text-slate-500">{child.gradeLabel}</p>
          </div>
        </div>
        {child.isActive ? (
          <button
            onClick={() => onEdit(child)}
            className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Edit
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <p className="text-slate-500">Teacher</p>
          <p className="text-slate-900">{child.teacherName || '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">DOB</p>
          <p className="text-slate-900">{formattedDob}</p>
        </div>
        <div className="col-span-2">
          <p className="text-slate-500">Username</p>
          <p className="text-slate-900 font-mono">{child.username}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {child.isActive ? (
          <button
            onClick={() => onArchive(child)}
            className="flex-1 text-xs px-3 py-2 rounded border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
          >
            Archive
          </button>
        ) : (
          <button
            onClick={() => onRestore(child)}
            className="flex-1 text-xs px-3 py-2 rounded border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
          >
            Restore
          </button>
        )}
      </div>
    </div>
  )
}
