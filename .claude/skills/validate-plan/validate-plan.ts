/**
 * Deterministic validator for PlanExecute JSON plans.
 *
 * Usage:
 *   npm run plan:validate
 *   npm run plan:validate -- --plans docs/bug_enhancement
 *   npm run plan:validate -- --plans docs/bug_enhancement/a.json,docs/bug_enhancement/b.json --json
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import * as path from 'path'
import { parsePlanFile, type PlanExecutePlan } from '../plan-execute/run-execute'

type Severity = 'fail' | 'warn'
type Verdict = 'PASS' | 'WARN' | 'FAIL'

interface ValidationIssue {
  severity: Severity
  planPath: string
  phaseId?: string
  check: string
  message: string
}

interface CoverageRow {
  id: string
  coveredBy: string[]
  status: 'OK' | 'UNCOVERED'
}

interface Collision {
  fileScopeEntry: string
  plans: string[]
}

interface PlanResult {
  planPath: string
  phaseCount: number
  failCount: number
  warnCount: number
  verdict: Verdict
}

export interface ValidatePlanOptions {
  planInputs?: string[]
  groupedPlanPath?: string
  track1PlanPath?: string
}

export interface ValidationReport {
  ok: boolean
  plansChecked: number
  failCount: number
  warnCount: number
  planResults: PlanResult[]
  issues: ValidationIssue[]
  collisions: Collision[]
  coverageRows: CoverageRow[]
}

const DEFAULT_PLANS_ROOT = 'docs/bug_enhancement'
const DEFAULT_GROUPED_PLAN = 'docs/bug_enhancement/20260606-2016-steward-grouped-plan.json'
const DEFAULT_TRACK1_PLAN = 'docs/bug_enhancement/20260607-track1-ready-steward-plan.json'
const MODEL_TIERS = new Set(['cheap', 'standard', 'strong'])
const PLAN_REF_REGEX = /docs\/bug_enhancement\/[a-z0-9._-]+-plan\.(?:md|json)/gi

function toAbs(targetPath: string): string {
  return path.resolve(targetPath)
}

function isLikelyPlanFile(fileName: string): boolean {
  return (
    fileName.endsWith('-plan.json') &&
    !fileName.includes('grouped-plan') &&
    !fileName.includes('track1-ready-steward-plan') &&
    !fileName.includes('track1')
  )
}

function collectPlanPaths(planInputs: string[]): string[] {
  const resolved: string[] = []

  for (const input of planInputs) {
    const absInput = toAbs(input)
    if (!existsSync(absInput)) {
      continue
    }

    const entryStats = statSync(absInput)
    if (entryStats.isFile()) {
      resolved.push(absInput)
      continue
    }

    if (entryStats.isDirectory()) {
      for (const entry of readdirSync(absInput)) {
        const full = path.join(absInput, entry)
        if (!existsSync(full) || !statSync(full).isFile()) {
          continue
        }
        if (isLikelyPlanFile(entry)) {
          resolved.push(full)
        }
      }
    }
  }

  return Array.from(new Set(resolved)).sort()
}

function containsNpmTest(doneWhen: string[]): boolean {
  return doneWhen.some((item) => item.includes('npm test'))
}

function containsBuild(doneWhen: string[]): boolean {
  return doneWhen.some((item) => item.includes('npm run build'))
}

function phaseIsDocsOnly(fileScope: string[]): boolean {
  if (!Array.isArray(fileScope) || fileScope.length === 0) {
    return false
  }
  return fileScope.every((entry) => entry.startsWith('.claude/'))
}

function phaseIsVerificationOnly(testsFirst: string[], implementationSteps?: string[]): boolean {
  const hasVerifyMarker = testsFirst.some((item) => /^VERIFY:/i.test(item.trim()) || /^DOC CHECK:/i.test(item.trim()))
  const hasImplementationSteps = Array.isArray(implementationSteps) && implementationSteps.length > 0
  return hasVerifyMarker && !hasImplementationSteps
}

function isConcreteFileScopeEntry(entry: string): boolean {
  const trimmed = entry.trim()
  if (!trimmed) {
    return false
  }

  // Reject pure wildcard scopes like "*" or "**/**".
  const withoutWildcards = trimmed.replace(/[\*\/]/g, '')
  return withoutWildcards.length > 0
}

function pushIssue(
  issues: ValidationIssue[],
  severity: Severity,
  planPath: string,
  check: string,
  message: string,
  phaseId?: string,
): void {
  issues.push({ severity, planPath, phaseId, check, message })
}

function validatePlanShape(planPath: string, plan: PlanExecutePlan): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!plan.branch || !String(plan.branch).trim()) {
    pushIssue(issues, 'fail', planPath, 'branch', 'Plan is missing a non-empty branch.')
  }

  for (const phase of plan.phases) {
    if (!Array.isArray(phase.fileScope) || phase.fileScope.length === 0) {
      if (!phaseIsVerificationOnly(phase.testsFirst ?? [], phase.implementationSteps)) {
        pushIssue(
          issues,
          'fail',
          planPath,
          'fileScope',
          'Phase must have a non-empty fileScope array.',
          phase.id,
        )
      } else {
        pushIssue(
          issues,
          'warn',
          planPath,
          'fileScope',
          'Verification-only phase has empty fileScope; allowed but should be explicit.',
          phase.id,
        )
      }
    } else if (!phase.fileScope.every((entry) => typeof entry === 'string' && isConcreteFileScopeEntry(entry))) {
      pushIssue(
        issues,
        'fail',
        planPath,
        'fileScope',
        'fileScope contains empty or wildcard-only entries.',
        phase.id,
      )
    }

    if (!Array.isArray(phase.testsFirst) || phase.testsFirst.length === 0) {
      pushIssue(
        issues,
        'fail',
        planPath,
        'testsFirst',
        'Phase must have a non-empty testsFirst array.',
        phase.id,
      )
    }

    if (!Array.isArray(phase.doneWhen) || phase.doneWhen.length === 0) {
      pushIssue(
        issues,
        'fail',
        planPath,
        'doneWhen',
        'Phase must have a non-empty doneWhen array.',
        phase.id,
      )
    } else {
      const shouldRequireTests = !phaseIsDocsOnly(phase.fileScope) && !phaseIsVerificationOnly(phase.testsFirst ?? [], phase.implementationSteps)
      if (shouldRequireTests && !containsNpmTest(phase.doneWhen)) {
        pushIssue(
          issues,
          'fail',
          planPath,
          'doneWhen',
          'doneWhen must include at least one npm test command.',
          phase.id,
        )
      }
      if (!containsBuild(phase.doneWhen)) {
        pushIssue(
          issues,
          'fail',
          planPath,
          'doneWhen',
          'doneWhen must include npm run build.',
          phase.id,
        )
      }
    }

    if (!phase.writeBack || !String(phase.writeBack).trim()) {
      pushIssue(
        issues,
        'fail',
        planPath,
        'writeBack',
        'Phase must have non-empty writeBack guidance.',
        phase.id,
      )
    }

    if (phase.gated) {
      if (!Array.isArray(phase.preconditions) || phase.preconditions.length === 0) {
        pushIssue(
          issues,
          'fail',
          planPath,
          'gated-preconditions',
          'Gated phase must include non-empty preconditions explaining the gate.',
          phase.id,
        )
      }
      if (!phase.modelTier) {
        pushIssue(
          issues,
          'warn',
          planPath,
          'gated-modelTier',
          'Gated phase should set modelTier explicitly.',
          phase.id,
        )
      }
    }

    if (phase.modelTier && !MODEL_TIERS.has(phase.modelTier)) {
      pushIssue(
        issues,
        'fail',
        planPath,
        'modelTier',
        `modelTier must be one of cheap|standard|strong, got "${phase.modelTier}".`,
        phase.id,
      )
    }
  }

  if (path.basename(planPath) === '20260606-course-rollover-plan.json' && plan.phases.length !== 1) {
    pushIssue(
      issues,
      'fail',
      planPath,
      'course-rollover-phase-count',
      'course-rollover plan must be phase-1 only (single phase).',
    )
  }

  return issues
}

function collectIds(raw: string): Set<string> {
  const ids = new Set<string>()
  const uuidMatches = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) ?? []
  const manualMatches = raw.match(/manual-bug-[a-z0-9-]+/gi) ?? []
  for (const id of [...uuidMatches, ...manualMatches]) {
    ids.add(id.toLowerCase())
  }
  return ids
}

function extractPlanRefs(raw: string): Set<string> {
  const refs = new Set<string>()
  const matches = raw.match(PLAN_REF_REGEX) ?? []
  for (const match of matches) {
    refs.add(match.replace(/\\/g, '/'))
  }
  return refs
}

function buildCoverageRows(
  groupedPlanPath: string,
  track1PlanPath: string,
  validatedPlanPaths: string[],
): { rows: CoverageRow[]; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = []
  const requiredIds = new Set<string>()
  const coverageSource = new Map<string, Set<string>>()

  if (!existsSync(groupedPlanPath)) {
    pushIssue(
      issues,
      'fail',
      groupedPlanPath,
      'coverage-source',
      'Grouped plan file missing; cannot compute coverage.',
    )
    return { rows: [], issues }
  }

  const groupedRaw = readFileSync(groupedPlanPath, 'utf8')
  let groupedParsed: unknown
  try {
    groupedParsed = JSON.parse(groupedRaw)
  } catch {
    pushIssue(issues, 'fail', groupedPlanPath, 'coverage-source', 'Grouped plan JSON is invalid.')
    return { rows: [], issues }
  }

  if (!groupedParsed || typeof groupedParsed !== 'object') {
    pushIssue(issues, 'fail', groupedPlanPath, 'coverage-source', 'Grouped plan must be an object.')
    return { rows: [], issues }
  }

  const parsed = groupedParsed as {
    feedbackIds?: string[]
    workstreams?: Array<{
      summary?: string
      testPlan?: string[]
      blastRadiusNotes?: string
      writeBack?: string
      uatByFeedbackId?: Record<string, unknown>
    }>
  }

  for (const id of parsed.feedbackIds ?? []) {
    requiredIds.add(id.toLowerCase())
  }
  for (const workstream of parsed.workstreams ?? []) {
    for (const key of Object.keys(workstream.uatByFeedbackId ?? {})) {
      requiredIds.add(key.toLowerCase())
    }
  }

  // Deterministic mapping from grouped workstream IDs -> referenced plan files.
  for (const workstream of parsed.workstreams ?? []) {
    const ids = Object.keys(workstream.uatByFeedbackId ?? {}).map((value) => value.toLowerCase())
    const refBlob = [workstream.summary ?? '', workstream.blastRadiusNotes ?? '', workstream.writeBack ?? '', ...(workstream.testPlan ?? [])].join('\n')
    const refs = Array.from(extractPlanRefs(refBlob))
      .map((ref) => ref.replace(/\.md$/i, '.json'))
      .filter((ref) => existsSync(toAbs(ref)))

    for (const id of ids) {
      if (!coverageSource.has(id)) {
        coverageSource.set(id, new Set<string>())
      }
      for (const ref of refs) {
        coverageSource.get(id)?.add(ref)
      }
    }
  }

  const sourceFiles = [groupedPlanPath, track1PlanPath, ...validatedPlanPaths].filter((p) => existsSync(p))
  const groupedLabel = path.relative(process.cwd(), groupedPlanPath).replace(/\\/g, '/')

  for (const sourceFile of sourceFiles) {
    const sourceIds = collectIds(readFileSync(sourceFile, 'utf8'))
    const sourceLabel = path.relative(process.cwd(), sourceFile).replace(/\\/g, '/')
    for (const id of sourceIds) {
      if (!coverageSource.has(id)) {
        coverageSource.set(id, new Set<string>())
      }
      coverageSource.get(id)?.add(sourceLabel)
    }
  }

  const rows: CoverageRow[] = []
  for (const id of Array.from(requiredIds).sort()) {
    const coveredBy = Array.from(coverageSource.get(id) ?? []).sort()
    const coveredByExecutablePlans = coveredBy.filter((source) => source !== groupedLabel)
    rows.push({
      id,
      coveredBy,
      status: coveredByExecutablePlans.length > 0 ? 'OK' : 'UNCOVERED',
    })
  }

  return { rows, issues }
}

function detectCollisions(plans: Array<{ planPath: string; plan: PlanExecutePlan }>): Collision[] {
  const byFileScope = new Map<string, Set<string>>()
  for (const { planPath, plan } of plans) {
    const planLabel = path.relative(process.cwd(), planPath).replace(/\\/g, '/')
    const uniqueEntries = new Set(plan.phases.flatMap((phase) => phase.fileScope))
    for (const entry of uniqueEntries) {
      if (!byFileScope.has(entry)) {
        byFileScope.set(entry, new Set<string>())
      }
      byFileScope.get(entry)?.add(planLabel)
    }
  }

  return Array.from(byFileScope.entries())
    .filter(([, planSet]) => planSet.size > 1)
    .map(([fileScopeEntry, planSet]) => ({
      fileScopeEntry,
      plans: Array.from(planSet).sort(),
    }))
    .sort((a, b) => a.fileScopeEntry.localeCompare(b.fileScopeEntry))
}

export function validatePlanBundle(options: ValidatePlanOptions = {}): ValidationReport {
  const planInputs = options.planInputs?.length ? options.planInputs : [DEFAULT_PLANS_ROOT]
  const groupedPlanPath = toAbs(options.groupedPlanPath ?? DEFAULT_GROUPED_PLAN)
  const track1PlanPath = toAbs(options.track1PlanPath ?? DEFAULT_TRACK1_PLAN)
  const planPaths = collectPlanPaths(planInputs)

  const issues: ValidationIssue[] = []
  const loadedPlans: Array<{ planPath: string; plan: PlanExecutePlan }> = []

  if (planPaths.length === 0) {
    issues.push({
      severity: 'fail',
      planPath: planInputs.join(','),
      check: 'plan-discovery',
      message: 'No plan files found to validate.',
    })
  }

  for (const planPath of planPaths) {
    const raw = readFileSync(planPath, 'utf8')
    let parsedPlan: PlanExecutePlan
    try {
      parsedPlan = parsePlanFile(raw, planPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown parse error.'
      pushIssue(issues, 'fail', planPath, 'parse', message)
      continue
    }

    loadedPlans.push({ planPath, plan: parsedPlan })
    issues.push(...validatePlanShape(planPath, parsedPlan))
  }

  const collisions = detectCollisions(loadedPlans)
  for (const collision of collisions) {
    for (const planLabel of collision.plans) {
      pushIssue(
        issues,
        'warn',
        planLabel,
        'fileScope-collision',
        `fileScope "${collision.fileScopeEntry}" appears in multiple plans (${collision.plans.join(', ')}).`,
      )
    }
  }

  const { rows: coverageRows, issues: coverageIssues } = buildCoverageRows(groupedPlanPath, track1PlanPath, planPaths)
  issues.push(...coverageIssues)
  for (const row of coverageRows) {
    if (row.status === 'UNCOVERED') {
      pushIssue(issues, 'fail', groupedPlanPath, 'coverage', `Coverage missing for ${row.id}.`)
    }
  }

  const planResults: PlanResult[] = loadedPlans.map(({ planPath, plan }) => {
    const planIssueSet = issues.filter((issue) => issue.planPath === planPath)
    const failCount = planIssueSet.filter((issue) => issue.severity === 'fail').length
    const warnCount = planIssueSet.filter((issue) => issue.severity === 'warn').length
    const verdict: Verdict = failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS'
    return {
      planPath: path.relative(process.cwd(), planPath).replace(/\\/g, '/'),
      phaseCount: plan.phases.length,
      failCount,
      warnCount,
      verdict,
    }
  })

  const failCount = issues.filter((issue) => issue.severity === 'fail').length
  const warnCount = issues.filter((issue) => issue.severity === 'warn').length

  return {
    ok: failCount === 0,
    plansChecked: loadedPlans.length,
    failCount,
    warnCount,
    planResults,
    issues,
    collisions,
    coverageRows,
  }
}

function parseCliArgs(args: string[]): { planInputs: string[]; groupedPlanPath: string; track1PlanPath: string; json: boolean } {
  const planInputs: string[] = []
  let groupedPlanPath = DEFAULT_GROUPED_PLAN
  let track1PlanPath = DEFAULT_TRACK1_PLAN
  let json = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--plans') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('Missing value for --plans')
      }
      planInputs.push(...value.split(',').map((item) => item.trim()).filter(Boolean))
      index += 1
      continue
    }
    if (arg === '--grouped') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('Missing value for --grouped')
      }
      groupedPlanPath = value
      index += 1
      continue
    }
    if (arg === '--track1') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('Missing value for --track1')
      }
      track1PlanPath = value
      index += 1
      continue
    }
    if (arg === '--json') {
      json = true
      continue
    }

    planInputs.push(arg)
  }

  return {
    planInputs: planInputs.length > 0 ? planInputs : [DEFAULT_PLANS_ROOT],
    groupedPlanPath,
    track1PlanPath,
    json,
  }
}

function printHumanSummary(report: ValidationReport): void {
  process.stdout.write(
    `Checked ${report.plansChecked} plans — FAIL: ${report.failCount}, WARN: ${report.warnCount}\n`,
  )

  for (const result of report.planResults) {
    process.stdout.write(
      `- ${result.verdict.padEnd(4)} ${result.planPath} (phases=${result.phaseCount}, fail=${result.failCount}, warn=${result.warnCount})\n`,
    )
  }

  if (report.issues.length > 0) {
    process.stdout.write('\nIssues:\n')
    for (const issue of report.issues) {
      const phase = issue.phaseId ? ` [${issue.phaseId}]` : ''
      const normalizedPath = issue.planPath.replace(/\\/g, '/')
      process.stdout.write(`- ${issue.severity.toUpperCase()} ${normalizedPath}${phase} (${issue.check}) ${issue.message}\n`)
    }
  }

  if (report.coverageRows.length > 0) {
    process.stdout.write('\nCoverage:\n')
    for (const row of report.coverageRows) {
      process.stdout.write(
        `- ${row.status} ${row.id} :: ${row.coveredBy.length > 0 ? row.coveredBy.join(', ') : '(none)'}\n`,
      )
    }
  }
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2))
  const report = validatePlanBundle({
    planInputs: args.planInputs,
    groupedPlanPath: args.groupedPlanPath,
    track1PlanPath: args.track1PlanPath,
  })

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  } else {
    printHumanSummary(report)
  }

  if (!report.ok) {
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown error'
    process.stderr.write(`Fatal: ${message}\n`)
    process.exit(1)
  })
}
