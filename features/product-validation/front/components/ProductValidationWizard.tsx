'use client'

import { useState } from 'react'
import Link from 'next/link'
import { productValidationApi } from '@/features/product-validation/front/services/api'
import { FormProgress } from './FormProgress'
import { ScoreQuestion } from './ScoreQuestion'
import { PriceRangeQuestion } from './PriceRangeQuestion'
import { TextQuestion } from './TextQuestion'
import {
  FEATURE_AREA_OPTIONS,
  SECTION_LABELS,
  TOTAL_STEPS,
  initialWizardState,
  toCreateInput,
  validateWizardStep,
  type WizardFormState,
} from '@/features/product-validation/front/lib/wizardState'
import type { ValidationFeatureArea } from '@/features/product-validation/types'

interface ProductValidationWizardProps {
  defaultEmail?: string
}

export function ProductValidationWizard({ defaultEmail = '' }: ProductValidationWizardProps) {
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardFormState>(() => initialWizardState(defaultEmail))
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function patch(partial: Partial<WizardFormState>) {
    setState(prev => ({ ...prev, ...partial }))
  }

  function toggleFeatureArea(area: ValidationFeatureArea) {
    setState(prev => {
      const has = prev.usedFeatureAreas.includes(area)
      return {
        ...prev,
        usedFeatureAreas: has
          ? prev.usedFeatureAreas.filter(a => a !== area)
          : [...prev.usedFeatureAreas, area],
      }
    })
  }

  function handleContinue() {
    const stepErrors = validateWizardStep(step, state)
    if (stepErrors.length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors([])
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
    }
  }

  function handleBack() {
    setErrors([])
    setStep(s => Math.max(1, s - 1))
  }

  async function handleSubmit() {
    const stepErrors = validateWizardStep(step, state)
    if (stepErrors.length > 0) {
      setErrors(stepErrors)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await productValidationApi.createResponse(toCreateInput(state))
      setDone(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Submission failed'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-8" data-testid="feedback-thank-you">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Thank you</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your feedback was saved. Multiple responses are welcome as your experience grows.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/about"
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to About
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-lg bg-forest-900 text-sm font-medium text-white hover:bg-forest-800"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="product-validation-wizard">
      <Link
        href="/about"
        className="text-sm text-slate-500 hover:text-forest-900 mb-6 inline-block"
      >
        ← Back to About
      </Link>

      <FormProgress
        step={step}
        totalSteps={TOTAL_STEPS}
        sectionLabel={SECTION_LABELS[step - 1]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{SECTION_LABELS[step - 1]}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Help us understand whether Sheath Academy fits Muslim homeschool families and tutor-led
            programs. Your honest answers matter more than high scores.
          </p>
        </div>

        {errors.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            data-testid="wizard-validation-errors"
          >
            <ul className="list-disc list-inside space-y-1">
              {errors.map(err => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {submitError && (
          <div role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <TextQuestion
              id="respondentName"
              label="Your name"
              value={state.respondentName ?? ''}
              onChange={v => patch({ respondentName: v })}
              required={false}
              multiline={false}
            />
            <TextQuestion
              id="respondentEmail"
              label="Email"
              value={state.respondentEmail}
              onChange={v => patch({ respondentEmail: v })}
              multiline={false}
              helper="We use your signed-in email when available."
            />
            <div>
              <label htmlFor="respondentType" className="block text-sm font-semibold text-slate-900 mb-1.5">
                You are a… <span className="text-red-500">*</span>
              </label>
              <select
                id="respondentType"
                value={state.respondentType}
                onChange={e => patch({ respondentType: e.target.value as WizardFormState['respondentType'] })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm"
              >
                <option value="homeschool_family">Homeschool parent / family</option>
                <option value="tutor">Tutor</option>
                <option value="program_operator">Program operator / admin</option>
                <option value="other">Other</option>
              </select>
            </div>
            <TextQuestion
              id="householdOrProgramType"
              label="Household or program type"
              value={state.householdOrProgramType ?? ''}
              onChange={v => patch({ householdOrProgramType: v })}
              required={false}
              multiline={false}
              helper="e.g. homeschool family, co-op, micro-school"
            />
            <div>
              <label htmlFor="usageDuration" className="block text-sm font-semibold text-slate-900 mb-1.5">
                How long did you use Sheath Academy before answering? <span className="text-red-500">*</span>
              </label>
              <select
                id="usageDuration"
                value={state.usageDuration}
                onChange={e => patch({ usageDuration: e.target.value as WizardFormState['usageDuration'] })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm"
              >
                <option value="under_10_minutes">Under 10 minutes</option>
                <option value="one_session">One session</option>
                <option value="one_day">One day</option>
                <option value="one_week">One week</option>
                <option value="multiple_weeks">Multiple weeks</option>
              </select>
            </div>
            <fieldset>
              <legend className="text-sm font-semibold text-slate-900 mb-2">
                Which parts did you actually use? <span className="text-red-500">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FEATURE_AREA_OPTIONS.map(opt => {
                  const selected = state.usedFeatureAreas.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleFeatureArea(opt.value)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                        selected
                          ? 'border-forest-900 bg-forest-50 text-forest-900 font-medium'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <ScoreQuestion
              id="previousPain"
              label="How painful was your previous way of managing this?"
              helper="1 = not painful, 5 = very painful"
              value={state.previousPainScore}
              onChange={n => patch({ previousPainScore: n })}
            />
            <TextQuestion
              id="replacedWhat"
              label="What did Sheath Academy replace for you?"
              value={state.replacedWhat}
              onChange={v => patch({ replacedWhat: v })}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <ScoreQuestion
              id="improvement"
              label="How much did Sheath Academy improve that process?"
              helper="1 = not at all, 5 = dramatically"
              value={state.improvementScore}
              onChange={n => patch({ improvementScore: n })}
            />
            <ScoreQuestion
              id="ease"
              label="How easy was it to use?"
              helper="1 = very difficult, 5 = very easy"
              value={state.easeScore}
              onChange={n => patch({ easeScore: n })}
            />
            <TextQuestion
              id="mostUseful"
              label="What was the most useful part?"
              value={state.mostUseful}
              onChange={v => patch({ mostUseful: v })}
            />
            <TextQuestion
              id="confusingOrBurdensome"
              label="What felt confusing or burdensome?"
              value={state.confusingOrBurdensome}
              onChange={v => patch({ confusingOrBurdensome: v })}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <ScoreQuestion
              id="trust"
              label="How much do you trust the records / reports?"
              helper="1 = do not trust, 5 = fully trust"
              value={state.trustScore}
              onChange={n => patch({ trustScore: n })}
            />
            <TextQuestion
              id="mustHaveChange"
              label="What would make this a must-have?"
              value={state.mustHaveChange}
              onChange={v => patch({ mustHaveChange: v })}
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <ScoreQuestion
              id="retention"
              label="How likely are you to keep using it?"
              value={state.retentionScore}
              onChange={n => patch({ retentionScore: n })}
            />
            <ScoreQuestion
              id="pay"
              label="How likely are you to pay for it?"
              value={state.payScore}
              onChange={n => patch({ payScore: n })}
            />
            <ScoreQuestion
              id="referral"
              label="How likely are you to recommend it?"
              value={state.referralScore}
              onChange={n => patch({ referralScore: n })}
            />
            <PriceRangeQuestion
              value={state.reasonableMonthlyPriceBucket}
              onChange={v => patch({ reasonableMonthlyPriceBucket: v })}
            />
            <TextQuestion
              id="pricingNotes"
              label="Pricing notes (optional)"
              value={state.pricingNotes ?? ''}
              onChange={v => patch({ pricingNotes: v })}
              required={false}
            />
            <TextQuestion
              id="lostAccessReaction"
              label="What would you do if you lost access tomorrow?"
              value={state.lostAccessReaction}
              onChange={v => patch({ lostAccessReaction: v })}
            />
            <TextQuestion
              id="recommendTo"
              label="Who specifically would you recommend this to?"
              value={state.recommendTo}
              onChange={v => patch({ recommendTo: v })}
            />
            <TextQuestion
              id="referralMessage"
              label="What message would you send them?"
              value={state.referralMessage}
              onChange={v => patch({ referralMessage: v })}
            />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <ScoreQuestion
              id="positioning"
              label="How clearly can you explain who it is for?"
              helper="1 = not clearly, 5 = very clearly"
              value={state.positioningClarityScore}
              onChange={n => patch({ positioningClarityScore: n })}
            />
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-slate-900">Consent</legend>
              {(
                [
                  ['mayContact', 'May we contact you about this feedback?'],
                  ['mayQuoteAnonymized', 'May we quote anonymized feedback?'],
                  ['mayQuoteWithName', 'May we quote your feedback with your name?'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={state[key]}
                    onChange={e => patch({ [key]: e.target.checked })}
                    className="rounded border-slate-300 text-forest-900 focus:ring-forest-900"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <TextQuestion
              id="additionalNotes"
              label="Anything else we should know?"
              value={state.additionalNotes ?? ''}
              onChange={v => patch({ additionalNotes: v })}
              required={false}
            />
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Back
          </button>
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleContinue}
              className="px-5 py-2.5 rounded-lg bg-forest-900 text-sm font-medium text-white hover:bg-forest-800"
              data-testid="wizard-continue"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-forest-900 text-sm font-medium text-white hover:bg-forest-800 disabled:opacity-60"
              data-testid="wizard-submit"
            >
              {submitting ? 'Submitting…' : 'Submit feedback'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
