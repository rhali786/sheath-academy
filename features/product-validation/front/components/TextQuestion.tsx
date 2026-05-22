interface TextQuestionProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  multiline?: boolean
  helper?: string
}

export function TextQuestion({
  id,
  label,
  value,
  onChange,
  required = true,
  multiline = true,
  helper,
}: TextQuestionProps) {
  const className =
    'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-900/20 focus:border-forest-900'

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-900">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {helper && <p className="text-sm text-slate-500">{helper}</p>}
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={className}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={className}
        />
      )}
    </div>
  )
}
