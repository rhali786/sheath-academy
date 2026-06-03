'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { submitFeedback } from '@/features/feedback/front/services/api'
import type { FeedbackSentiment } from '@/features/feedback/types'

const SENTIMENTS: { value: FeedbackSentiment; emoji: string; label: string }[] = [
  { value: 'bad',  emoji: '😣', label: 'Bad'  },
  { value: 'poor', emoji: '😕', label: 'Poor' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'great',emoji: '😄', label: 'Great'},
]

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [pagePath, setPagePath] = useState('')
  const [sentiment, setSentiment] = useState<FeedbackSentiment | null>(null)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  function handleOpen() {
    setPagePath(window.location.pathname)
    setSentiment(null)
    setMessage('')
    setStatus('idle')
    setErrorMsg('')
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sentiment) return
    setStatus('submitting')
    try {
      await submitFeedback({ pagePath, sentiment, message: message.trim() || undefined })
      setStatus('success')
      setTimeout(() => setOpen(false), 1500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden="true"
          onClick={handleClose}
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Feedback form"
            aria-modal="true"
            className="w-80 rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden"
            data-testid="feedback-panel"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-800">How&apos;s it going?</span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close feedback"
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {status === 'success' ? (
              <div
                className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center"
                data-testid="feedback-success"
              >
                <span className="text-3xl">✓</span>
                <div>
                  <p className="text-sm text-slate-600 mb-3">Submitted!</p>
                  <Link href="/feedback" className="text-sm text-forest-600 underline hover:text-forest-700">
                    View your feedback →
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div
                  className="flex justify-between"
                  role="group"
                  aria-label="How are you feeling?"
                >
                  {SENTIMENTS.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      aria-label={s.label}
                      aria-pressed={sentiment === s.value}
                      onClick={() => setSentiment(s.value)}
                      className={[
                        'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-xl transition-colors',
                        sentiment === s.value
                          ? 'bg-forest-50 ring-2 ring-forest-400'
                          : 'hover:bg-slate-50',
                      ].join(' ')}
                      data-testid={`sentiment-${s.value}`}
                    >
                      {s.emoji}
                      <span className="text-[10px] text-slate-500">{s.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us more (optional)"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-400"
                  data-testid="feedback-message"
                />

                {status === 'error' && (
                  <p className="text-xs text-red-600" role="alert" data-testid="feedback-error">
                    {errorMsg}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={pagePath}>
                    {pagePath}
                  </span>
                  <button
                    type="submit"
                    disabled={!sentiment || status === 'submitting'}
                    className="px-4 py-1.5 text-sm font-medium rounded-lg bg-forest-900 text-white hover:bg-forest-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="feedback-submit"
                  >
                    {status === 'submitting' ? 'Sending…' : 'Send'}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400">
                    Want structured feedback?{' '}
                    <Link href="/product-validation" className="text-slate-500 underline hover:text-slate-600">
                      Share here →
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleOpen}
          aria-label="Give feedback"
          aria-expanded={open}
          className="h-12 w-12 rounded-full bg-forest-900 text-white shadow-lg hover:bg-forest-800 flex items-center justify-center text-lg transition-transform hover:scale-105"
          data-testid="feedback-trigger"
        >
          💬
        </button>
      </div>
    </>
  )
}
