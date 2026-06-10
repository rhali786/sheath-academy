/**
 * Executes a previously generated feedback steward plan artifact.
 *
 *   npm run steward:execute -- --artifact docs/bug_enhancement/20260525-1558-steward-grouped-plan.json
 *
 * Requires DATABASE_URL in .env.local plus `gh`/`claude` access for the execute phase.
 */

import { existsSync, readFileSync } from 'fs'
import * as path from 'path'
import {
  executeSavedDailyPlan,
  parseDailyPlanOutput,
  type DailyPlanArtifact,
  type ExecutePlanOutput,
} from './run-daily'

export interface RunExecuteDailyOptions {
  artifactPath: string
}

export interface RunExecuteDailyResult {
  plan: DailyPlanArtifact
  jsonArtifactPath: string
  markdownArtifactPath: string
  execution: ExecutePlanOutput
}

function getSiblingMarkdownPath(jsonArtifactPath: string): string {
  if (jsonArtifactPath.toLowerCase().endsWith('.json')) {
    return jsonArtifactPath.slice(0, -5) + '.md'
  }

  return `${jsonArtifactPath}.md`
}

export async function runExecuteDaily(options: RunExecuteDailyOptions): Promise<RunExecuteDailyResult> {
  const jsonArtifactPath = path.resolve(options.artifactPath)

  if (!existsSync(jsonArtifactPath)) {
    throw new Error(`Plan artifact not found: ${jsonArtifactPath}`)
  }

  const rawArtifact = readFileSync(jsonArtifactPath, 'utf8')
  const plan = parseDailyPlanOutput(rawArtifact)
  if (!plan) {
    throw new Error(`Invalid daily plan artifact: ${jsonArtifactPath}`)
  }

  const markdownArtifactPath = getSiblingMarkdownPath(jsonArtifactPath)
  const execution = await executeSavedDailyPlan({
    plan,
    jsonArtifactPath,
    markdownArtifactPath,
  })

  return {
    plan,
    jsonArtifactPath,
    markdownArtifactPath,
    execution,
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const artifactIndex = args.indexOf('--artifact')

  if (artifactIndex === -1 || !args[artifactIndex + 1]) {
    process.stderr.write('Usage: steward:execute -- --artifact <path-to-plan.json>\n')
    process.exit(1)
  }

  const result = await runExecuteDaily({
    artifactPath: args[artifactIndex + 1],
  })

  process.stderr.write(
    `Executed saved plan:\n- JSON: ${result.jsonArtifactPath}\n- Markdown: ${result.markdownArtifactPath}\n- PR: #${result.execution.prNumber}\n`,
  )
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`)
    process.exit(1)
  })
}
