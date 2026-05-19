import type { CommunityNote } from '@/features/resources/types'

interface CommunityNoteCardProps {
  note: CommunityNote | null
}

export function CommunityNoteCard({ note }: CommunityNoteCardProps) {
  if (!note || note.status !== 'verified') return null

  return (
    <div
      className="rounded-xl border border-forest-200 bg-forest-50 p-4"
      data-testid="community-note-card"
    >
      <p className="text-xs font-semibold text-forest-700 uppercase tracking-widest mb-2">
        Community Note
      </p>
      {note.difficulty && (
        <p className="text-xs text-slate-700 mb-1">
          <span className="font-medium">Difficulty:</span> {note.difficulty}
        </p>
      )}
      {note.islamicNote && (
        <p className="text-xs text-slate-700">
          <span className="font-medium">Islamic note:</span> {note.islamicNote}
        </p>
      )}
    </div>
  )
}
