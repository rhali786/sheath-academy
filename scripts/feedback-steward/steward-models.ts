/**
 * Model IDs for each Claude call site in the feedback steward pipeline.
 *
 * Override at runtime via environment variables:
 *   STEWARD_MODEL_CLASSIFY  — classification step (high-volume, schema-constrained)
 *   STEWARD_MODEL_PLAN      — daily plan generation (once/day, highest leverage)
 *   STEWARD_MODEL_EXECUTE   — plan execution (guardrailed by allowedFiles)
 *
 * Preflight uses the classify model and cannot be overridden separately.
 */
export const STEWARD_MODEL_CLASSIFY =
  process.env.STEWARD_MODEL_CLASSIFY ?? 'claude-haiku-4-5-20251001'

export const STEWARD_MODEL_PLAN =
  process.env.STEWARD_MODEL_PLAN ?? 'claude-opus-4-8'

export const STEWARD_MODEL_EXECUTE =
  process.env.STEWARD_MODEL_EXECUTE ?? 'claude-sonnet-4-6'
