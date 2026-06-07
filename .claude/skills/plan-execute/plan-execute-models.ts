/**
 * Model IDs for each tier in the plan-execute pipeline.
 *
 * Override at runtime via environment variables:
 *   PLAN_EXECUTE_MODEL_CHEAP     — mechanical/scoped phases (copy, CSS, rename)
 *   PLAN_EXECUTE_MODEL_STANDARD  — ordinary feature/store/API work (default)
 *   PLAN_EXECUTE_MODEL_STRONG    — schema, migrations, shared contracts, gated phases
 */

export const PLAN_EXECUTE_MODEL_CHEAP =
  process.env.PLAN_EXECUTE_MODEL_CHEAP ?? 'claude-haiku-4-5-20251001'

export const PLAN_EXECUTE_MODEL_STANDARD =
  process.env.PLAN_EXECUTE_MODEL_STANDARD ?? 'claude-sonnet-4-6'

export const PLAN_EXECUTE_MODEL_STRONG =
  process.env.PLAN_EXECUTE_MODEL_STRONG ?? 'claude-opus-4-8'

export type PlanModelTier = 'cheap' | 'standard' | 'strong'

export interface PhaseModelInput {
  modelTier?: PlanModelTier
  model?: string
}

export function resolvePhaseModel(input: PhaseModelInput): string {
  if (input.model) {
    return input.model
  }

  switch (input.modelTier ?? 'standard') {
    case 'cheap':
      return PLAN_EXECUTE_MODEL_CHEAP
    case 'strong':
      return PLAN_EXECUTE_MODEL_STRONG
    case 'standard':
    default:
      return PLAN_EXECUTE_MODEL_STANDARD
  }
}
