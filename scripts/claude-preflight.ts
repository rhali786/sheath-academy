import { runClaudePrompt } from './claude-integration'

const DEFAULT_CLAUDE_PREFLIGHT_TIMEOUT_MS = 30_000

export interface ClaudePreflightResult {
  status: 'ok'
  checkedAt: string
  elapsedMs: number
  timeoutMs: number
}

function getClaudePreflightTimeoutMs(): number {
  const raw = process.env.STEWARD_CLAUDE_PREFLIGHT_TIMEOUT_MS
  if (!raw) return DEFAULT_CLAUDE_PREFLIGHT_TIMEOUT_MS

  const parsed = parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_CLAUDE_PREFLIGHT_TIMEOUT_MS

  return parsed
}

function buildClaudePreflightPrompt(): string {
  return 'Reply with exactly OK and nothing else.'
}

export function runClaudePreflight(): ClaudePreflightResult {
  const timeoutMs = getClaudePreflightTimeoutMs()
  const result = runClaudePrompt({
    stageLabel: 'preflight',
    args: ['-p', buildClaudePreflightPrompt()],
    timeoutMs,
  })

  if (result.stdout.trim() !== 'OK') {
    throw new Error('Claude preflight returned invalid output')
  }

  return {
    status: 'ok',
    checkedAt: new Date().toISOString(),
    timeoutMs,
    elapsedMs: result.elapsedMs,
  }
}
