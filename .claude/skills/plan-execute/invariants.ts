import { existsSync, readFileSync } from 'fs'
import * as path from 'path'
import { resolveSkillDir } from './paths'

export interface InvariantPhaseInput {
  invariants?: string[]
  fileScope: string[]
}

export type InvariantCheckResult =
  | { ok: true; migrationRange?: string }
  | { ok: false; reason: string }

export type InvariantChecker = (
  phase: InvariantPhaseInput,
  repoRoot: string,
) => InvariantCheckResult

const registeredCheckers = new Map<string, InvariantChecker>()

export function registerInvariantChecker(id: string, checker: InvariantChecker): void {
  registeredCheckers.set(id, checker)
}

export function resetInvariantCheckersForTests(): void {
  registeredCheckers.clear()
}

export function getRegisteredInvariantCheckerIds(): string[] {
  return [...registeredCheckers.keys()]
}

export function getProgressPath(planPath: string): string {
  if (planPath.toLowerCase().endsWith('.json')) {
    return planPath.slice(0, -5) + '.progress.json'
  }

  return `${planPath}.progress.json`
}

export function phaseNeedsInvariantCheck(phase: InvariantPhaseInput): boolean {
  if (phase.invariants && phase.invariants.length > 0) {
    return true
  }

  return phase.fileScope.some((scope) =>
    scope.includes('db/schema.ts') || scope.includes('db/migrations'),
  )
}

export function loadInvariantConfig(skillDir: string = resolveSkillDir()): string[] {
  const configPath = path.join(skillDir, 'invariants.config.json')
  if (!existsSync(configPath)) {
    return []
  }

  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as { checkers?: unknown }
    if (!Array.isArray(parsed.checkers)) {
      return []
    }

    return parsed.checkers.filter((checker): checker is string => typeof checker === 'string')
  } catch {
    return []
  }
}

export function checkPhaseInvariants(
  phase: InvariantPhaseInput,
  repoRoot: string = process.cwd(),
  checkerIds?: string[],
): InvariantCheckResult {
  if (!phaseNeedsInvariantCheck(phase)) {
    return { ok: true }
  }

  const ids = checkerIds ?? loadInvariantConfig()
  if (ids.length === 0) {
    return {
      ok: false,
      reason:
        'Phase requires invariant checks but no checkers are configured in invariants.config.json',
    }
  }

  for (const id of ids) {
    const checker = registeredCheckers.get(id)
    if (!checker) {
      return { ok: false, reason: `Unknown invariant checker: ${id}` }
    }

    const result = checker(phase, repoRoot)
    if (!result.ok) {
      return result
    }

    if (result.migrationRange) {
      return result
    }
  }

  return { ok: true }
}
