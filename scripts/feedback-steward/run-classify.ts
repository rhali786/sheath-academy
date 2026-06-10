/**
 * Orchestrates full classification pipeline:
 *   1. Fetch unclassified feedback (requeue)
 *   2. Deduplicate each item
 *   3. Invoke Claude classify skill for non-duplicates
 *   4. Write triage results back to DB
 *
 *   npm run steward:classify
 *
 * Requires DATABASE_URL in .env.local and `claude` CLI available in PATH.
 */

import { readFileSync } from 'fs'
import * as path from 'path'
import { getUnclassifiedFeedback, type FeedbackRequeueItem } from './feedback-requeue'
import { detectDuplicatesBatch } from './feedback-dedupe'
import { runClaudePrompt } from './claude-integration'
import { runClaudePreflight } from './claude-preflight'
import { STEWARD_MODEL_CLASSIFY } from './steward-models'
import { applyClassification, markFeedbackDuplicate } from '@/features/feedback/server/service'
import type { FeedbackType, FeedbackRiskLevel, FeedbackConfidence } from '@/features/feedback/types'

const FEEDBACK_TYPES: readonly FeedbackType[] = ['bug', 'enhancement', 'ux', 'copy', 'performance', 'question']
const RISK_LEVELS: readonly FeedbackRiskLevel[] = ['low', 'medium', 'high']
const CONFIDENCE_LEVELS: readonly FeedbackConfidence[] = ['high', 'medium', 'low']
function getClassifyTimeoutMs(): number {
  const raw = process.env.STEWARD_CLAUDE_CLASSIFY_TIMEOUT_MS
  if (!raw) return 45_000
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 45_000
}

const CLASSIFY_TIMEOUT_MS = getClassifyTimeoutMs()

const CLASSIFY_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['reviewed'] },
    featureArea: { type: 'string', minLength: 1 },
    feedbackType: { type: 'string', enum: FEEDBACK_TYPES },
    riskLevel: { type: 'string', enum: RISK_LEVELS },
    confidence: { type: 'string', enum: CONFIDENCE_LEVELS },
    recommendation: { type: 'string', minLength: 1 },
  },
  required: ['status', 'featureArea', 'feedbackType', 'riskLevel', 'confidence', 'recommendation'],
} as const

export interface ClassifyOutput {
  status: 'reviewed'
  featureArea: string
  feedbackType: FeedbackType
  riskLevel: FeedbackRiskLevel
  confidence: FeedbackConfidence
  recommendation: string
}

export interface ClassificationSummary {
  classified: number
  duplicates: number
  failed: number
}

const BATCH_CLASSIFY_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'status', 'featureArea', 'feedbackType', 'riskLevel', 'confidence', 'recommendation'],
        properties: {
          id: { type: 'string', minLength: 1 },
          status: { type: 'string', enum: ['reviewed'] },
          featureArea: { type: 'string', minLength: 1 },
          feedbackType: { type: 'string', enum: FEEDBACK_TYPES },
          riskLevel: { type: 'string', enum: RISK_LEVELS },
          confidence: { type: 'string', enum: CONFIDENCE_LEVELS },
          recommendation: { type: 'string', minLength: 1 },
        },
      },
    },
  },
} as const

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatIndentedBlock(label: string, value: string): string {
  const normalized = value.replace(/\r/g, '').trim()
  if (!normalized) return `  ${label}: <empty>`
  return [`  ${label}:`, ...normalized.split('\n').map((line) => `    ${line}`)].join('\n')
}

function formatClaudeClassifyOutput(output: ClassifyOutput): string {
  return [
    '  Claude said:',
    `    status: ${output.status}`,
    `    featureArea: ${output.featureArea}`,
    `    feedbackType: ${output.feedbackType}`,
    `    riskLevel: ${output.riskLevel}`,
    `    confidence: ${output.confidence}`,
    `    recommendation: ${output.recommendation}`,
  ].join('\n')
}

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

function validateEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : null
}

function validateClassifyOutput(value: unknown): ClassifyOutput | null {
  if (!isRecord(value)) return null

  const status = value.status
  const featureArea = value.featureArea
  const feedbackType = validateEnum(value.feedbackType, FEEDBACK_TYPES)
  const riskLevel = validateEnum(value.riskLevel, RISK_LEVELS)
  const confidence = validateEnum(value.confidence, CONFIDENCE_LEVELS)
  const recommendation = value.recommendation

  if (status !== 'reviewed') return null
  if (typeof featureArea !== 'string' || featureArea.trim().length === 0) return null
  if (!feedbackType || !riskLevel || !confidence) return null
  if (typeof recommendation !== 'string' || recommendation.trim().length === 0) return null

  return {
    status,
    featureArea: featureArea.trim(),
    feedbackType,
    riskLevel,
    confidence,
    recommendation: recommendation.trim(),
  }
}

export function parseClassifyOutput(raw: string): ClassifyOutput | null {
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
    const output = validateClassifyOutput(candidate)
    if (output) {
      return output
    }
  }

  return null
}


function validateBatchClassifyOutput(value: unknown): Map<string, ClassifyOutput> | null {
  if (!isRecord(value)) return null
  const items = value.items
  if (!Array.isArray(items) || items.length === 0) return null

  const result = new Map<string, ClassifyOutput>()
  for (const item of items) {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id) return null
    const classified = validateClassifyOutput(item)
    if (!classified) return null
    result.set(item.id as string, classified)
  }
  return result
}

export function parseBatchClassifyOutput(raw: string): Map<string, ClassifyOutput> | null {
  const parsed = tryParseJson(raw)
  if (parsed === null) return null

  const candidates: unknown[] = [parsed]
  if (isRecord(parsed)) {
    if (isRecord(parsed.structured_output)) candidates.push(parsed.structured_output)
    if (typeof parsed.text === 'string') candidates.push(tryParseJson(parsed.text))
    if (typeof parsed.result === 'string') candidates.push(tryParseJson(parsed.result))
    else if (isRecord(parsed.result)) candidates.push(parsed.result)
  }

  for (const candidate of candidates) {
    const output = validateBatchClassifyOutput(candidate)
    if (output) return output
  }
  return null
}

function buildBatchClassifyPrompt(
  items: Pick<FeedbackRequeueItem, 'id' | 'message' | 'pagePath' | 'sentiment'>[]
): string {
  return [
    `Classify these ${items.length} feedback items for Sheath Academy.`,
    'Return only the structured JSON object with an "items" array matching the provided schema.',
    JSON.stringify(items.map((item) => ({
      id: item.id,
      message: item.message,
      pagePath: item.pagePath,
      sentiment: item.sentiment,
    })), null, 2),
  ].join('\n\n')
}

export function runClassifySkillBatch(
  items: Pick<FeedbackRequeueItem, 'id' | 'message' | 'pagePath' | 'sentiment'>[]
): Map<string, ClassifyOutput> | null {
  const skillPath = path.join(process.cwd(), '.claude', 'skills', 'feedback-classify', 'SKILL.md')
  const skillPrompt = readFileSync(skillPath, 'utf8')
  const result = runClaudePrompt({
    stageLabel: `batch classify ${items.length} feedback items`,
    args: [
      '-p',
      '--model',
      STEWARD_MODEL_CLASSIFY,
      '--output-format',
      'json',
      '--json-schema',
      JSON.stringify(BATCH_CLASSIFY_OUTPUT_SCHEMA),
      '--append-system-prompt',
      skillPrompt,
      buildBatchClassifyPrompt(items),
    ],
    timeoutMs: CLASSIFY_TIMEOUT_MS,
  })

  const parsed = parseBatchClassifyOutput(result.stdout)
  if (!parsed) {
    process.stderr.write(`⚠️  Batch classify returned invalid output\n`)
    process.stderr.write(`${formatIndentedBlock('Claude stdout', result.stdout)}\n`)
    process.stderr.write(`${formatIndentedBlock('Claude stderr', result.stderr)}\n`)
  }
  return parsed
}

function buildClassifyPrompt(item: Pick<FeedbackRequeueItem, 'id' | 'message' | 'pagePath' | 'sentiment'>): string {
  return [
    'Classify this feedback item for Sheath Academy.',
    'Return only the structured JSON object that matches the provided schema.',
    JSON.stringify(
      {
        id: item.id,
        message: item.message,
        pagePath: item.pagePath,
        sentiment: item.sentiment,
      },
      null,
      2
    ),
  ].join('\n\n')
}

export function runClassifySkill(
  item: Pick<FeedbackRequeueItem, 'id' | 'message' | 'pagePath' | 'sentiment'>
): ClassifyOutput | null {
  const skillPath = path.join(process.cwd(), '.claude', 'skills', 'feedback-classify', 'SKILL.md')
  const skillPrompt = readFileSync(skillPath, 'utf8')
  const classifyPrompt = buildClassifyPrompt(item)
  const result = runClaudePrompt({
    stageLabel: `classify feedback ${item.id}`,
    args: [
      '-p',
      '--model',
      STEWARD_MODEL_CLASSIFY,
      '--output-format',
      'json',
      '--json-schema',
      JSON.stringify(CLASSIFY_OUTPUT_SCHEMA),
      '--append-system-prompt',
      skillPrompt,
      classifyPrompt,
    ],
    timeoutMs: CLASSIFY_TIMEOUT_MS,
  })

  const parsed = parseClassifyOutput(result.stdout)
  if (!parsed) {
    process.stderr.write(`classify skill produced invalid output for ${item.id}\n`)
    process.stderr.write(`${formatIndentedBlock('Claude stdout', result.stdout)}\n`)
    process.stderr.write(`${formatIndentedBlock('Claude stderr', result.stderr)}\n`)
    return null
  }

  process.stderr.write(`${formatClaudeClassifyOutput(parsed)}\n`)

  return parsed
}

export async function classifyFeedback(options: { ids?: string[] } = {}): Promise<ClassificationSummary> {
  const items = await getUnclassifiedFeedback(options)
  process.stderr.write(`🔍 Found ${items.length} unclassified feedback item${items.length === 1 ? '' : 's'}\n`)

  const preflight = runClaudePreflight()
  process.stderr.write(
    `✅ Claude preflight ok (${formatDuration(preflight.elapsedMs)}, timeout ${formatDuration(preflight.timeoutMs)})\n`
  )

  if (items.length === 0) {
    return { classified: 0, duplicates: 0, failed: 0 }
  }

  // Single DB query for all duplicate checks
  const dedupeResults = await detectDuplicatesBatch(items)

  const toClassify: typeof items = []
  let duplicates = 0

  await Promise.all(
    items.map(async (item) => {
      const dedupe = dedupeResults.get(item.id)
      if (dedupe?.isDuplicate && dedupe.duplicateOfId) {
        await markFeedbackDuplicate(item.id, dedupe.duplicateOfId)
        process.stderr.write(`  ⚠️  ${item.id} — duplicate of ${dedupe.duplicateOfId} (${dedupe.reason}), cancelled\n`)
        duplicates++
      } else {
        toClassify.push(item)
      }
    })
  )

  if (toClassify.length === 0) {
    process.stderr.write(`\n📊 Classification complete: 0 classified, ${duplicates} duplicate, 0 failed\n`)
    return { classified: 0, duplicates, failed: 0 }
  }

  // Single Claude call for all non-duplicate items
  process.stderr.write(`🤖 Classifying ${toClassify.length} item${toClassify.length === 1 ? '' : 's'} in one batch call...\n`)
  const batchResult = runClassifySkillBatch(toClassify)

  if (!batchResult) {
    const failed = toClassify.length
    process.stderr.write(`\n📊 Classification complete: 0 classified, ${duplicates} duplicate, ${failed} failed\n`)
    return { classified: 0, duplicates, failed }
  }

  // Parallel DB writes
  let classified = 0
  let failed = 0

  await Promise.all(
    toClassify.map(async (item) => {
      const result = batchResult.get(item.id)
      if (!result) {
        process.stderr.write(`  ❌ ${item.id} — not returned in batch output\n`)
        failed++
        return
      }
      await applyClassification(item.id, result)
      process.stderr.write(`  ✅ ${item.id} — ${result.feedbackType}/${result.featureArea} (${result.confidence} confidence)\n`)
      classified++
    })
  )

  process.stderr.write(`\n📊 Classification complete: ${classified} classified, ${duplicates} duplicate, ${failed} failed\n`)
  return { classified, duplicates, failed }
}

async function main(): Promise<void> {
  const summary = await classifyFeedback()
  process.stderr.write(`\nDone. classified=${summary.classified} duplicates=${summary.duplicates} failed=${summary.failed}\n`)

  if (summary.failed > 0) process.exit(1)
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`)
    process.exit(1)
  })
}
