/**
 * Backward-compatible entry point for npm scripts and imports.
 * Implementation lives in the portable skill bundle.
 */

export {
  buildWorkerPrompt,
  createInitialProgress,
  findResumePhaseIndex,
  parsePlanExecuteCliArgs,
  parsePlanFile,
  parseWorkerResponse,
  resolvePhaseModel,
  resolveSkillDir,
  resolveSkillFile,
  runPlanExecute,
  type PlanExecuteCliArgs,
  type PlanExecutePlan,
  type PlanPhaseDefinition,
  type PlanProgressFile,
  type PlanProgressPhase,
  type RunPlanExecuteOptions,
  type RunPlanExecuteResult,
  type RunPlanExecuteStatus,
} from '../../.claude/skills/plan-execute/run-execute'
