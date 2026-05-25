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

import { spawnSync } from 'child_process'
import { readFileSync } from 'fs'
import * as path from 'path'
import { getUnclassifiedFeedback, type FeedbackRequeueItem } from './feedback-requeue'
import { detectDuplicate } from './feedback-dedupe'
import { updateFeedbackTriage } from '@/features/feedback/server/repository'
import type { FeedbackTriageUpdate, FeedbackType, FeedbackRiskLevel, FeedbackConfidence } from '@/features/feedback/types'

const FEEDBACK_TYPES: readonly FeedbackType[] = ['bug', 'enhancement', 'ux', 'copy', 'performance', 'question']
const RISK_LEVELS: readonly FeedbackRiskLevel[] = ['low', 'medium', 'high']
const CONFIDENCE_LEVELS: readonly FeedbackConfidence[] = ['high', 'medium', 'low']

const CLASSIFY_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['classified'] },
    featureArea: { type: 'string', minLength: 1 },
    feedbackType: { type: 'string', enum: FEEDBACK_TYPES },
    riskLevel: { type: 'string', enum: RISK_LEVELS },
    confidence: { type: 'string', enum: CONFIDENCE_LEVELS },
    recommendation: { type: 'string', minLength: 1 },
  },
  required: ['status', 'featureArea', 'feedbackType', 'riskLevel', 'confidence', 'recommendation'],
} as const

export interface ClassifyOutput {
  status: 'classified'
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

  if (status !== 'classified') return null
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

function getClaudeCommand(): string {
  return process.platform === 'win32' ? 'claude.cmd' : 'claude'
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
  const skillPath = path.join(process.cwd(), '.claude', 'feedback-classify.md')
  const skillPrompt = readFileSync(skillPath, 'utf8')

  try {
    const result = spawnSync(
      getClaudeCommand(),
      [
        '-p',
        '--output-format',
        'json',
        '--json-schema',
        JSON.stringify(CLASSIFY_OUTPUT_SCHEMA),
        '--append-system-prompt',
        skillPrompt,
        '--tools',
        '',
        buildClassifyPrompt(item),
      ],
      { encoding: 'utf8', input: '', timeout: 60_000 }
    )

    if (result.error) {
      throw result.error
    }

    if (typeof result.status === 'number' && result.status !== 0) {
      throw new Error(result.stderr.trim() || `claude exited with status ${result.status}`)
    }

    const parsed = parseClassifyOutput(result.stdout)
    if (!parsed) {
      process.stderr.write(`classify skill produced invalid output for ${item.id}\n`)
      return null
    }

    return parsed
  } catch (err) {
    const e = err as Error
    process.stderr.write(`classify skill failed for ${item.id}: ${e.message}\n`)
    return null
  }
}

export async function classifyFeedback(): Promise<ClassificationSummary> {
  const items = await getUnclassifiedFeedback()
  process.stderr.write(`Found ${items.length} unclassified feedback items\n`)

  let classified = 0
  let duplicates = 0
  let failed = 0

  for (const item of items) {
    process.stderr.write(`Processing ${item.id}...\n`)

    const dedupe = await detectDuplicate(item.id)

    if (dedupe.isDuplicate && dedupe.duplicateOfId) {
      await updateFeedbackTriage(item.id, {
        status: 'cancelled',
        duplicateOfFeedbackId: dedupe.duplicateOfId,
      })
      process.stderr.write(`  → duplicate of ${dedupe.duplicateOfId} (${dedupe.reason}), cancelled\n`)
      duplicates++
      continue
    }

    const result = runClassifySkill(item)

    if (!result) {
      failed++
      continue
    }

    const triage: FeedbackTriageUpdate = {
      status: 'classified',
      featureArea: result.featureArea ?? null,
      feedbackType: (result.feedbackType ?? null) as FeedbackType | null,
      riskLevel: (result.riskLevel ?? null) as FeedbackRiskLevel | null,
      confidence: (result.confidence ?? null) as FeedbackConfidence | null,
    }

    await updateFeedbackTriage(item.id, triage)
    process.stderr.write(`  → classified: ${result.feedbackType}/${result.featureArea} confidence=${result.confidence}\n`)
    classified++
  }

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
