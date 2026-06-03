import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import * as path from 'path'
import {
  listEligibleFeedbackForDailyRun,
  markFeedbackAttachedToPr,
  type DailyRunEligibilityResult,
} from '@/features/feedback/server/service'
import { insertChangelogEntry } from '@/features/about/server/repository'
import type { FeedbackType, FeedbackRow } from '@/features/feedback/types'
import { runClaudePrompt } from './claude-integration'
import { classifyFeedback } from './run-classify'

export interface DailyPlanWorkstream {
  featureArea: string
  summary: string
  allowedFiles: string[]
  testPlan: string[]
  uatByFeedbackId: Record<string, string[]>
}

export interface DailyPlanArtifact {
  version: 1
  generatedAt: string
  feedbackIds: string[]
  eligibilitySnapshot: {
    autoEligibleIds: string[]
    approvedIds: string[]
  }
  workstreams: DailyPlanWorkstream[]
}

export interface DoNotAutomateConfig {
  featureAreas?: string[]
  feedbackTypes?: FeedbackType[]
}

export interface RunDailyOptions {
  dryRun: boolean
  now?: Date
}

export interface RunDailyResult {
  dryRun: boolean
  eligibility: DailyRunEligibilityResult
  plan: DailyPlanArtifact
  jsonArtifactPath: string
  markdownArtifactPath: string
  execution?: ExecutePlanOutput
}

export interface ExecuteSavedDailyPlanInput {
  plan: DailyPlanArtifact
  jsonArtifactPath: string
  markdownArtifactPath: string
}

export interface ChangelogCandidate {
  label: string
  detail: string
  userCredit: string | null
}

export interface ExecutePlanOutput {
  status: 'success'
  branchName: string
  prNumber: number
  prTitle: string
  prBody: string
  previewUrl: string | null
  testsRun: string[]
  // One changelog candidate per PR/version — NOT per feedback row.
  changelogCandidate: ChangelogCandidate | null
  feedbackUpdates: Record<
    string,
    {
      uatInstructions: string
    }
  >
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function getPlanTimeoutMs(): number {
  const raw = process.env.STEWARD_CLAUDE_PLAN_TIMEOUT_MS ?? process.env.STEWARD_PLAN_TIMEOUT_MS
  if (!raw) return 30_000
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30_000
}

function getExecuteTimeoutMs(): number {
  const raw = process.env.STEWARD_CLAUDE_EXECUTE_TIMEOUT_MS ?? process.env.STEWARD_EXECUTE_TIMEOUT_MS
  if (!raw) return 120_000
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120_000
}

const DAILY_PLAN_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    version: { type: 'number', enum: [1] },
    generatedAt: { type: 'string', minLength: 1 },
    feedbackIds: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', minLength: 1 },
    },
    eligibilitySnapshot: {
      type: 'object',
      additionalProperties: false,
      properties: {
        autoEligibleIds: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
        },
        approvedIds: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
        },
      },
      required: ['autoEligibleIds', 'approvedIds'],
    },
    workstreams: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          featureArea: { type: 'string', minLength: 1 },
          summary: { type: 'string', minLength: 1 },
          allowedFiles: {
            type: 'array',
            minItems: 1,
            items: { type: 'string', minLength: 1 },
          },
          testPlan: {
            type: 'array',
            minItems: 1,
            items: { type: 'string', minLength: 1 },
          },
          uatByFeedbackId: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              minItems: 1,
              items: { type: 'string', minLength: 1 },
            },
          },
        },
        required: ['featureArea', 'summary', 'allowedFiles', 'testPlan', 'uatByFeedbackId'],
      },
    },
  },
  required: ['version', 'generatedAt', 'feedbackIds', 'eligibilitySnapshot', 'workstreams'],
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function tryParseJson(raw: string): unknown | null {
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function isStringArray(value: unknown, { minItems = 0 }: { minItems?: number } = {}): value is string[] {
  return Array.isArray(value) && value.length >= minItems && value.every((entry) => typeof entry === 'string' && entry.trim().length > 0)
}

function validateWorkstream(value: unknown): DailyPlanWorkstream | null {
  if (!isRecord(value)) return null
  if (typeof value.featureArea !== 'string' || value.featureArea.trim().length === 0) return null
  if (typeof value.summary !== 'string' || value.summary.trim().length === 0) return null
  if (!isStringArray(value.allowedFiles, { minItems: 1 })) return null
  if (!isStringArray(value.testPlan, { minItems: 1 })) return null
  if (!isRecord(value.uatByFeedbackId)) return null

  const uatByFeedbackId: Record<string, string[]> = {}
  for (const [feedbackId, steps] of Object.entries(value.uatByFeedbackId)) {
    if (!feedbackId || !isStringArray(steps, { minItems: 1 })) return null
    uatByFeedbackId[feedbackId] = steps.map((step) => step.trim())
  }

  return {
    featureArea: value.featureArea.trim(),
    summary: value.summary.trim(),
    allowedFiles: value.allowedFiles.map((entry) => entry.trim()),
    testPlan: value.testPlan.map((entry) => entry.trim()),
    uatByFeedbackId,
  }
}

function validateChangelogCandidate(value: unknown): ChangelogCandidate | null {
  if (value === null || value === undefined) return null
  if (!isRecord(value)) return null
  if (typeof value.label !== 'string' || value.label.trim().length === 0) return null
  if (typeof value.detail !== 'string') return null
  if (!(value.userCredit === null || value.userCredit === undefined ||
    (typeof value.userCredit === 'string' && value.userCredit.trim().length > 0))) return null

  return {
    label: value.label.trim(),
    detail: value.detail.trim(),
    userCredit: typeof value.userCredit === 'string' ? value.userCredit.trim() : null,
  }
}

function validateExecutePlanOutput(value: unknown, feedbackIds: string[]): ExecutePlanOutput | null {
  if (!isRecord(value)) return null
  if (value.status !== 'success') return null
  if (typeof value.branchName !== 'string' || value.branchName.trim().length === 0) return null
  if (typeof value.prNumber !== 'number' || !Number.isInteger(value.prNumber) || value.prNumber <= 0) return null
  if (typeof value.prTitle !== 'string' || value.prTitle.trim().length === 0) return null
  if (typeof value.prBody !== 'string' || value.prBody.trim().length === 0) return null
  if (!(value.previewUrl === null || (typeof value.previewUrl === 'string' && value.previewUrl.trim().length > 0))) return null
  if (!isStringArray(value.testsRun, { minItems: 1 })) return null
  if (!isRecord(value.feedbackUpdates)) return null

  // changelogCandidate is optional and PR-scoped (null is valid)
  const changelogCandidate = value.changelogCandidate !== undefined
    ? validateChangelogCandidate(value.changelogCandidate)
    : null
  // If explicitly set to a non-null object but validation fails, reject
  if (value.changelogCandidate !== null && value.changelogCandidate !== undefined && changelogCandidate === null) {
    return null
  }

  const feedbackUpdates: ExecutePlanOutput['feedbackUpdates'] = {}
  for (const feedbackId of feedbackIds) {
    const update = value.feedbackUpdates[feedbackId]
    if (!isRecord(update)) return null
    if (typeof update.uatInstructions !== 'string' || update.uatInstructions.trim().length === 0) return null

    feedbackUpdates[feedbackId] = {
      uatInstructions: update.uatInstructions.trim(),
    }
  }

  return {
    status: 'success',
    branchName: value.branchName.trim(),
    prNumber: value.prNumber,
    prTitle: value.prTitle.trim(),
    prBody: value.prBody.trim(),
    previewUrl: typeof value.previewUrl === 'string' ? value.previewUrl.trim() : null,
    testsRun: value.testsRun.map((entry) => entry.trim()),
    changelogCandidate,
    feedbackUpdates,
  }
}

function validateDailyPlanArtifact(value: unknown): DailyPlanArtifact | null {
  if (!isRecord(value)) return null
  if (value.version !== 1) return null
  if (typeof value.generatedAt !== 'string' || value.generatedAt.trim().length === 0) return null
  if (!isStringArray(value.feedbackIds, { minItems: 1 })) return null
  if (!isRecord(value.eligibilitySnapshot)) return null
  if (!isStringArray(value.eligibilitySnapshot.autoEligibleIds)) return null
  if (!isStringArray(value.eligibilitySnapshot.approvedIds)) return null
  if (!Array.isArray(value.workstreams) || value.workstreams.length === 0) return null

  const workstreams = value.workstreams.map(validateWorkstream)
  if (workstreams.some((entry) => entry === null)) return null

  const coverage = new Set(
    workstreams.flatMap((workstream) => Object.keys((workstream as DailyPlanWorkstream).uatByFeedbackId))
  )
  if (!value.feedbackIds.every((feedbackId) => coverage.has(feedbackId))) return null

  return {
    version: 1,
    generatedAt: value.generatedAt.trim(),
    feedbackIds: value.feedbackIds.map((entry) => entry.trim()),
    eligibilitySnapshot: {
      autoEligibleIds: value.eligibilitySnapshot.autoEligibleIds.map((entry) => entry.trim()),
      approvedIds: value.eligibilitySnapshot.approvedIds.map((entry) => entry.trim()),
    },
    workstreams: workstreams as DailyPlanWorkstream[],
  }
}

export function parseDailyPlanOutput(raw: string): DailyPlanArtifact | null {
  const parsed = tryParseJson(raw)
  if (parsed === null) return null

  const candidates: unknown[] = [parsed]

  if (isRecord(parsed)) {
    if (isRecord(parsed.structured_output)) {
      candidates.push(parsed.structured_output)
    }

    if (typeof parsed.text === 'string') {
      candidates.push(tryParseJson(parsed.text))
    }

    if (typeof parsed.result === 'string') {
      candidates.push(tryParseJson(parsed.result))
    } else if (isRecord(parsed.result)) {
      candidates.push(parsed.result)
    }
  }

  for (const candidate of candidates) {
    const artifact = validateDailyPlanArtifact(candidate)
    if (artifact) return artifact
  }

  return null
}

function parseExecutePlanOutput(raw: string, feedbackIds: string[]): ExecutePlanOutput | null {
  const parsed = tryParseJson(raw)
  if (parsed === null) return null

  const candidates: unknown[] = [parsed]

  if (isRecord(parsed)) {
    if (isRecord(parsed.structured_output)) {
      candidates.push(parsed.structured_output)
    }

    if (typeof parsed.text === 'string') {
      candidates.push(tryParseJson(parsed.text))
    }

    if (typeof parsed.result === 'string') {
      candidates.push(tryParseJson(parsed.result))
    } else if (isRecord(parsed.result)) {
      candidates.push(parsed.result)
    }
  }

  for (const candidate of candidates) {
    const execution = validateExecutePlanOutput(candidate, feedbackIds)
    if (execution) return execution
  }

  return null
}

function loadDoNotAutomateConfig(): DoNotAutomateConfig {
  const configPath = path.join(process.cwd(), 'config', 'feedback-steward', 'do-not-automate.json')
  if (!existsSync(configPath)) return {}

  const parsed = tryParseJson(readFileSync(configPath, 'utf8'))
  if (!isRecord(parsed)) return {}

  return {
    featureAreas: isStringArray(parsed.featureAreas) ? parsed.featureAreas : [],
    feedbackTypes: isStringArray(parsed.feedbackTypes) ? (parsed.feedbackTypes as FeedbackType[]) : [],
  }
}

function getCurrentAppVersion(): string {
  const packagePath = path.join(process.cwd(), 'package.json')
  const parsed = tryParseJson(readFileSync(packagePath, 'utf8'))
  if (!isRecord(parsed) || typeof parsed.version !== 'string' || parsed.version.trim().length === 0) {
    throw new Error('Could not determine current app version from package.json')
  }

  return parsed.version.trim()
}

function buildDailyPlanPrompt(eligibility: DailyRunEligibilityResult, generatedAt: string): string {
  return [
    'Create a grouped daily feedback implementation plan for Sheath Academy.',
    'Return only the JSON object that matches the provided schema.',
    JSON.stringify(
      {
        generatedAt,
        eligibilitySnapshot: {
          feedbackIds: eligibility.feedbackIds,
          autoEligibleIds: eligibility.autoEligibleIds,
          approvedIds: eligibility.approvedIds,
        },
        rows: eligibility.rows,
      },
      null,
      2,
    ),
  ].join('\n\n')
}

function buildExecutePrompt(
  plan: DailyPlanArtifact,
  jsonArtifactPath: string,
  markdownArtifactPath: string,
): string {
  return [
    'Execute this grouped feedback plan for Sheath Academy.',
    'Write failing tests first where needed, then implement, run tests, and create or update a PR against dev.',
    JSON.stringify(
      {
        jsonArtifactPath,
        markdownArtifactPath,
        plan,
      },
      null,
      2,
    ),
  ].join('\n\n')
}

function generateDailyPlan(eligibility: DailyRunEligibilityResult, generatedAt: string): DailyPlanArtifact {
  const skillPath = path.join(process.cwd(), '.claude', 'feedback-daily-plan.md')
  const skillPrompt = readFileSync(skillPath, 'utf8')
  const planTimeoutMs = getPlanTimeoutMs()
  process.stderr.write(
    `Generating daily plan with Claude for ${eligibility.feedbackIds.length} feedback items at ${new Date().toISOString()} (timeout ${formatDuration(planTimeoutMs)})...\n`,
  )

  const result = runClaudePrompt({
    stageLabel: 'daily planning',
    args: [
      '-p',
      '--output-format',
      'json',
      '--json-schema',
      JSON.stringify(DAILY_PLAN_OUTPUT_SCHEMA),
      '--append-system-prompt',
      skillPrompt,
      buildDailyPlanPrompt(eligibility, generatedAt),
    ],
    timeoutMs: planTimeoutMs,
  })

  const parsed = parseDailyPlanOutput(result.stdout)
  if (!parsed) {
    throw new Error('Invalid daily plan output')
  }

  process.stderr.write(`Daily plan generated in ${formatDuration(result.elapsedMs)}\n`)

  return parsed
}

function executeDailyPlan(
  plan: DailyPlanArtifact,
  jsonArtifactPath: string,
  markdownArtifactPath: string,
): ExecutePlanOutput {
  const skillPath = path.join(process.cwd(), '.claude', 'feedback-execute.md')
  const skillPrompt = readFileSync(skillPath, 'utf8')
  const executeTimeoutMs = getExecuteTimeoutMs()
  process.stderr.write(`Executing reviewed plan with Claude at ${new Date().toISOString()} (timeout ${formatDuration(executeTimeoutMs)})...\n`)

  const result = runClaudePrompt({
    stageLabel: 'daily execution',
    args: [
      '-p',
      '--output-format',
      'json',
      '--append-system-prompt',
      skillPrompt,
      buildExecutePrompt(plan, jsonArtifactPath, markdownArtifactPath),
    ],
    timeoutMs: executeTimeoutMs,
  })

  const parsed = parseExecutePlanOutput(result.stdout, plan.feedbackIds)
  if (!parsed) {
    throw new Error('Invalid execute output')
  }

  process.stderr.write(`Daily execution completed in ${formatDuration(result.elapsedMs)}\n`)

  return parsed
}

export async function executeSavedDailyPlan(input: ExecuteSavedDailyPlanInput): Promise<ExecutePlanOutput> {
  const execution = executeDailyPlan(input.plan, input.jsonArtifactPath, input.markdownArtifactPath)

  if (execution.changelogCandidate) {
    await insertChangelogEntry({
      id: randomUUID(),
      version: getCurrentAppVersion(),
      label: execution.changelogCandidate.label,
      detail: execution.changelogCandidate.detail,
      source: 'steward',
      prNumber: execution.prNumber,
      userCredit: execution.changelogCandidate.userCredit,
      status: 'pending',
    })
  }

  for (const feedbackId of input.plan.feedbackIds) {
    const update = execution.feedbackUpdates[feedbackId]
    await markFeedbackAttachedToPr(feedbackId, {
      prNumber: execution.prNumber,
      previewUrl: execution.previewUrl,
      uatInstructions: update.uatInstructions,
    })
  }

  return execution
}

function toDateStamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function toTimeStamp(date: Date): string {
  return date.toISOString().slice(11, 16).replace(':', '')
}

function ensureParentDir(filePath: string): void {
  const dir = path.dirname(filePath)
  mkdirSync(dir, { recursive: true })
}

function renderDailyPlanMarkdown(plan: DailyPlanArtifact, eligibility: DailyRunEligibilityResult): string {
  const rowsById = new Map(eligibility.rows.map((row) => [row.id, row]))

  const sections = plan.workstreams.map((workstream, index) => {
    const uatLines = Object.entries(workstream.uatByFeedbackId)
      .map(([feedbackId, steps]) => {
        const row = rowsById.get(feedbackId)
        const label = row?.message?.trim() || row?.pagePath || feedbackId
        return [
          `### ${feedbackId}`,
          ``,
          `- Context: ${label}`,
          ...steps.map((step) => `- ${step}`),
        ].join('\n')
      })
      .join('\n\n')

    return [
      `## Workstream ${index + 1}: ${workstream.summary}`,
      ``,
      `- Feature area: ${workstream.featureArea}`,
      `- Allowed files: ${workstream.allowedFiles.join(', ')}`,
      `- Test plan:`,
      ...workstream.testPlan.map((command) => `  - \`${command}\``),
      ``,
      `### UAT`,
      ``,
      uatLines,
    ].join('\n')
  })

  return [
    '# Feedback Steward Grouped Plan',
    '',
    `Generated at: ${plan.generatedAt}`,
    '',
    '## Feedback IDs',
    '',
    ...plan.feedbackIds.map((feedbackId) => `- ${feedbackId}`),
    '',
    `Auto-eligible: ${plan.eligibilitySnapshot.autoEligibleIds.join(', ') || 'none'}`,
    `Approved: ${plan.eligibilitySnapshot.approvedIds.join(', ') || 'none'}`,
    '',
    ...sections,
    '',
  ].join('\n')
}

export async function runDaily(options: RunDailyOptions): Promise<RunDailyResult> {
  const now = options.now ?? new Date()
  const generatedAt = now.toISOString()
  const config = loadDoNotAutomateConfig()

  await classifyFeedback()

  const eligibility = await listEligibleFeedbackForDailyRun(config)

  if (eligibility.feedbackIds.length === 0) {
    throw new Error('No eligible feedback found for daily run')
  }

  const plan = generateDailyPlan(eligibility, generatedAt)

  const dateStamp = toDateStamp(now)
  const timeStamp = toTimeStamp(now)
  const artifactBaseName = `${dateStamp}-${timeStamp}-steward-grouped-plan`
  const jsonArtifactPath = path.join(
    process.cwd(),
    'docs',
    'bug_enhancement',
    `${artifactBaseName}.json`,
  )
  const markdownArtifactPath = path.join(
    process.cwd(),
    'docs',
    'bug_enhancement',
    `${artifactBaseName}.md`,
  )

  ensureParentDir(jsonArtifactPath)
  ensureParentDir(markdownArtifactPath)

  writeFileSync(jsonArtifactPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8')
  writeFileSync(markdownArtifactPath, renderDailyPlanMarkdown(plan, eligibility), 'utf8')

  if (!options.dryRun) {
    const execution = await executeSavedDailyPlan({
      plan,
      jsonArtifactPath,
      markdownArtifactPath,
    })

    return {
      dryRun: false,
      eligibility,
      plan,
      jsonArtifactPath,
      markdownArtifactPath,
      execution,
    }
  }

  return {
    dryRun: true,
    eligibility,
    plan,
    jsonArtifactPath,
    markdownArtifactPath,
  }
}

export function parseDailyCliArgs(args: string[]): RunDailyOptions {
  return {
    dryRun: args.includes('--dry-run') || args.includes('--plan-only'),
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const result = await runDaily(parseDailyCliArgs(args))

  process.stderr.write(
    `Generated plan artifacts:\n- JSON: ${result.jsonArtifactPath}\n- Markdown: ${result.markdownArtifactPath}\n`
  )
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`)
    process.exit(1)
  })
}
