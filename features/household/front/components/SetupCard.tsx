'use client'

import React, { ReactNode } from 'react'

export interface SetupCardProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  disabled?: boolean
  disabledTooltip?: string
  /** Additional content rendered below the description (e.g. an embedded form). */
  children?: ReactNode
  /** data-testid forwarded to the card root element. */
  testId?: string
}

export function SetupCard({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  disabled = false,
  disabledTooltip,
  children,
  testId,
}: SetupCardProps) {
  const showButton = Boolean(actionLabel)

  return (
    <div
      data-testid={testId}
      className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      {children}

      {showButton && (
        <div>
          {actionHref && !disabled ? (
            <a
              href={actionHref}
              className="inline-block px-4 py-2 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 transition-colors"
            >
              {actionLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={onAction}
              disabled={disabled}
              title={disabled && disabledTooltip ? disabledTooltip : undefined}
              className="px-4 py-2 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
