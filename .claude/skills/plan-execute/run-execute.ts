/**
 * Executes a phased implementation plan sequentially — one Claude worker per phase.
 *
 *   npm run plan:execute -- --plan docs/my-plan.json
 *   npm run plan:execute -- --plan docs/my-plan.json --resume
 *   npm run plan:execute -- --plan docs/my-plan.json --skip-gates
 *
 * Requires `claude` CLI access. State is tracked in `<plan>.progress.json`.
 * This runner enforces sequential execution, model routing, gate pauses, and
 * cross-phase invariant checks structurally — a loop cannot parallelize.
 *
 * Portable bundle: copy `.claude/skills/plan-execute/` to another project.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import * as path from 'path'
import { runClaudePrompt } from './claude-integration'
import { checkPhaseInvariants, getProgressPath, phaseNeedsInvariantCheck } from './invariants'
import './invariants.drizzle'
import { resolvePhaseModel, type PlanModelTier } from './plan-execute-models'
import { resolveSkillDir, resolveSkillFile } from './paths'

export { resolveSkillDir, resolveSkillFile } from './paths'

export type PhaseStatus = 'pending' | 'in_progress' | 'complete' | 'failed'

export interface PlanPhaseDefinition {
  id: string
  title: string
  gated: boolean
  modelTier?: PlanModelTier
  model?: string
  preconditions: string[]
  fileScope: string[]
  testsFirst: string[]
  implementationSteps?: string[]
  doneWhen: string[]
  invariants?: string[]
  writeBack: string
}

export interface PlanExecutePlan {
  version: number
  planMarkdownPath: string
  branch: string
  phases: PlanPhaseDefinition[]
}

export interface PlanProgressPhase {
  id: string
  title: string
  gated: boolean
  status: PhaseStatus
  model: string | null
  startedAt: string | null
  completedAt: string | null
  outputs: {
    filesChanged: string[]
    testsRun: string[]
    notes: string
  }
  failureReason: string | null
}

export interface PlanProgressFile {
  plan: string
  createdAt: string
  updatedAt: string
  branch: string
  phases: PlanProgressPhase[]
}

export interface RunPlanExecuteOptions {
  planPath: string
  resume: boolean
  skipGates: boolean
}

export type RunPlanExecuteStatus = 'complete' | 'failed' | 'gated'

export interface RunPlanExecuteResult {
  status: RunPlanExecuteStatus
  planPath: string
  progressPath: string
  phasesCompleted: string[]
  stoppedAtPhaseId?: string
  failureReason?: string
}

export interface PlanExecuteCliArgs {
  planPath: string
  resume: boolean
  skipGates: boolean
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function parsePlanExecuteCliArgs(args: string[]): PlanExecuteCliArgs {
  const planIndex = args.indexOf('--plan')
  if (planIndex === -1 || !args[planIndex + 1]) {
    throw new Error('Usage: plan:execute -- --plan <path-to-plan.json> [--resume] [--skip-gates]')
  }

  return {
    planPath: args[planIndex + 1],
    resume: args.includes('--resume'),
    skipGates: args.includes('--skip-gates'),
  }
}

export function parsePlanFile(raw: string, planPath: string): PlanExecutePlan {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`Invalid plan JSON: ${planPath}`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid plan JSON: ${planPath}`)
  }

  const plan = parsed as Partial<PlanExecutePlan>
  if (plan.version !== 1 || !Array.isArray(plan.phases) || plan.phases.length === 0) {
    throw new Error(`Plan must be version 1 with at least one phase: ${planPath}`)
  }

  for (const phase of plan.phases) {
    if (!phase?.id || !phase.title) {
      throw new Error(`Every phase must have id and title: ${planPath}`)
    }
  }

  return plan as PlanExecutePlan
}

export function createInitialProgress(plan: PlanExecutePlan, planPath: string): PlanProgressFile {
  const now = new Date().toISOString()
  return {
    plan: planPath,
    createdAt: now,
    updatedAt: now,
    branch: plan.branch,
    phases: plan.phases.map((phase) => ({
      id: phase.id,
      title: phase.title,
      gated: phase.gated,
      status: 'pending',
      model: null,
      startedAt: null,
      completedAt: null,
      outputs: {
        filesChanged: [],
        testsRun: [],
        notes: '',
      },
      failureReason: null,
    })),
  }
}

export function findResumePhaseIndex(progress: PlanProgressFile): number {
  return progress.phases.findIndex((phase) => phase.status !== 'complete')
}

function readProgressFile(progressPath: string): PlanProgressFile {
  const raw = readFileSync(progressPath, 'utf8')
  return JSON.parse(raw) as PlanProgressFile
}

function writeProgressFile(progressPath: string, progress: PlanProgressFile): void {
  progress.updatedAt = new Date().toISOString()
  writeFileSync(progressPath, `${JSON.stringify(progress, null, 2)}\n`, 'utf8')
}

export { resolvePhaseModel } from './plan-execute-models'

export function parseWorkerResponse(stdout: string): { ok: true } | { ok: false; reason: string } {
  const trimmed = stdout.trim()
  if (trimmed === 'DONE') {
    return { ok: true }
  }

  if (trimmed.startsWith('FAILED:')) {
    return { ok: false, reason: trimmed.slice('FAILED:'.length).trim() || 'worker failed' }
  }

  return { ok: false, reason: `Unexpected worker response: ${trimmed.slice(0, 120)}` }
}

export function buildWorkerPrompt(phaseId: string, planPath: string, progressPath: string): string {
  return [
    `Execute phase ${phaseId} of the plan at ${planPath}.`,
    `Progress file: ${progressPath}.`,
    'Follow the plan-execute worker contract (the plan-execute skill).',
    'Return only one line: DONE or FAILED:<reason>.',
  ].join('\n')
}

function loadOrCreateProgress(
  planPath: string,
  progressPath: string,
  plan: PlanExecutePlan,
  resume: boolean,
): PlanProgressFile {
  if (resume && existsSync(progressPath)) {
    const progress = readProgressFile(progressPath)
    if (progress.phases.length !== plan.phases.length) {
      throw new Error(`Progress file phase count does not match plan: ${progressPath}`)
    }
    return progress
  }

  if (existsSync(progressPath) && !resume) {
    throw new Error(
      `Progress file already exists: ${progressPath}. Pass --resume to continue or delete it to restart.`,
    )
  }

  const progress = createInitialProgress(plan, planPath)
  writeProgressFile(progressPath, progress)
  return progress
}

function executePhaseWorker(
  phaseId: string,
  planPath: string,
  progressPath: string,
  model: string,
): ReturnType<typeof runClaudePrompt> {
  const skillPath = resolveSkillFile('SKILL.md')
  const skillPrompt = readFileSync(skillPath, 'utf8')

  return runClaudePrompt({
    stageLabel: `plan execute ${phaseId}`,
    args: [
      '-p',
      '--model',
      model,
      // Workers run non-interactively (-p); without this they cannot edit files
      // and silently fail the phase. acceptEdits lets file writes through while
      // still honoring the worker's file-scope discipline from SKILL.md.
      '--permission-mode',
      'acceptEdits',
      '--append-system-prompt',
      skillPrompt,
      buildWorkerPrompt(phaseId, planPath, progressPath),
    ],
  })
}

function markPhaseFailed(progressPath: string, phaseIndex: number, reason: string): PlanProgressFile {
  const progress = readProgressFile(progressPath)
  progress.phases[phaseIndex].status = 'failed'
  progress.phases[phaseIndex].failureReason = reason
  writeProgressFile(progressPath, progress)
  return progress
}

export async function runPlanExecute(options: RunPlanExecuteOptions): Promise<RunPlanExecuteResult> {
  const planPath = path.resolve(options.planPath)
  const progressPath = getProgressPath(planPath)

  if (!existsSync(planPath)) {
    throw new Error(`Plan file not found: ${planPath}`)
  }

  const plan = parsePlanFile(readFileSync(planPath, 'utf8'), planPath)
  let progress = loadOrCreateProgress(planPath, progressPath, plan, options.resume)

  const phasesCompleted = progress.phases
    .filter((phase) => phase.status === 'complete')
    .map((phase) => phase.id)

  const startIndex = options.resume ? findResumePhaseIndex(progress) : 0
  if (startIndex === -1) {
    return {
      status: 'complete',
      planPath,
      progressPath,
      phasesCompleted,
    }
  }

  for (let index = startIndex; index < plan.phases.length; index += 1) {
    const planPhase = plan.phases[index]
    const progressPhase = progress.phases[index]

    if (progressPhase.status === 'complete') {
      if (!phasesCompleted.includes(planPhase.id)) {
        phasesCompleted.push(planPhase.id)
      }
      continue
    }

    if (planPhase.gated && !options.skipGates) {
      process.stderr.write(
        `\n⏸ Gate: phase ${planPhase.id} (${planPhase.title}) requires human review before execution.\n` +
          `Review ${progressPath} and the diff so far, then re-run with --resume.\n`,
      )
      return {
        status: 'gated',
        planPath,
        progressPath,
        phasesCompleted,
        stoppedAtPhaseId: planPhase.id,
      }
    }

    const model = resolvePhaseModel(planPhase)
    progressPhase.model = model
    progressPhase.status = 'in_progress'
    progressPhase.startedAt = new Date().toISOString()
    progressPhase.failureReason = null
    writeProgressFile(progressPath, progress)

    process.stderr.write(
      `\n▶ Phase ${planPhase.id} (${planPhase.title}) — model ${model}\n`,
    )

    const workerResult = executePhaseWorker(planPhase.id, planPath, progressPath, model)
    const workerResponse = parseWorkerResponse(workerResult.stdout)

    progress = readProgressFile(progressPath)
    const updatedPhase = progress.phases[index]

    if (updatedPhase.status !== 'complete' && updatedPhase.status !== 'failed') {
      if (!workerResponse.ok) {
        markPhaseFailed(progressPath, index, workerResponse.reason)
      } else {
        markPhaseFailed(
          progressPath,
          index,
          'Worker returned without marking phase complete in progress.json',
        )
      }

      return {
        status: 'failed',
        planPath,
        progressPath,
        phasesCompleted,
        stoppedAtPhaseId: planPhase.id,
        failureReason: workerResponse.ok
          ? 'Worker returned without marking phase complete in progress.json'
          : workerResponse.reason,
      }
    }

    if (updatedPhase.status === 'failed') {
      return {
        status: 'failed',
        planPath,
        progressPath,
        phasesCompleted,
        stoppedAtPhaseId: planPhase.id,
        failureReason: updatedPhase.failureReason ?? (!workerResponse.ok ? workerResponse.reason : 'worker failed'),
      }
    }

    if (phaseNeedsInvariantCheck(planPhase)) {
      const invariantResult = checkPhaseInvariants(planPhase)
      if (!invariantResult.ok) {
        markPhaseFailed(progressPath, index, invariantResult.reason)
        return {
          status: 'failed',
          planPath,
          progressPath,
          phasesCompleted,
          stoppedAtPhaseId: planPhase.id,
          failureReason: invariantResult.reason,
        }
      }

      if (invariantResult.migrationRange && !updatedPhase.outputs.notes.includes('migration')) {
        updatedPhase.outputs.notes = updatedPhase.outputs.notes
          ? `${updatedPhase.outputs.notes}; migration range ${invariantResult.migrationRange}`
          : `migration range ${invariantResult.migrationRange}`
        writeProgressFile(progressPath, progress)
      }
    }

    phasesCompleted.push(planPhase.id)
    process.stderr.write(`✓ Phase ${planPhase.id} complete in ${formatDuration(workerResult.elapsedMs)}\n`)
  }

  return {
    status: 'complete',
    planPath,
    progressPath,
    phasesCompleted,
  }
}

async function main(): Promise<void> {
  const args = parsePlanExecuteCliArgs(process.argv.slice(2))
  const result = await runPlanExecute(args)

  if (result.status === 'gated') {
    process.stderr.write(
      `\nStopped at gate before ${result.stoppedAtPhaseId}. Completed: ${result.phasesCompleted.join(', ') || 'none'}.\n`,
    )
    process.exit(2)
  }

  if (result.status === 'failed') {
    process.stderr.write(
      `\nFailed at ${result.stoppedAtPhaseId}: ${result.failureReason ?? 'unknown error'}\n`,
    )
    process.exit(1)
  }

  process.stderr.write(
    `\nAll phases complete (${result.phasesCompleted.join(', ')}).\nProgress: ${result.progressPath}\n`,
  )
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`)
    process.exit(1)
  })
}
