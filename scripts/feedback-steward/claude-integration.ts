import { spawnClaude } from './claude-runner'

const NO_STDIN_WARNING_PATTERN = /^Warning: no stdin data received.*$/gim

export interface ClaudePromptInput {
  stageLabel: string
  args: string[]
  timeoutMs?: number
}

export interface ClaudePromptResult {
  stdout: string
  stderr: string
  elapsedMs: number
  timeoutMs: number
}

function sanitizeClaudeMessage(text: string): string {
  return text
    .replace(NO_STDIN_WARNING_PATTERN, '')
    .replace(/\r/g, '')
    .trim()
}

function extractMeaningfulClaudeMessage(stdout: string, stderr: string): string | null {
  const stderrMessage = sanitizeClaudeMessage(stderr)
  if (stderrMessage) return stderrMessage

  const stdoutMessage = sanitizeClaudeMessage(stdout)
  if (stdoutMessage) return stdoutMessage

  return null
}

export function runClaudePrompt(input: ClaudePromptInput): ClaudePromptResult {
  const startedAt = Date.now()
  const spawnOptions: Parameters<typeof spawnClaude>[1] = {
    encoding: 'utf8',
    input: '',
  }
  if (input.timeoutMs !== undefined) {
    spawnOptions.timeout = input.timeoutMs
    spawnOptions.killSignal = 'SIGKILL'
  }

  const result = spawnClaude(input.args, spawnOptions)

  const stdout = typeof result.stdout === 'string' ? result.stdout : ''
  const stderr = typeof result.stderr === 'string' ? result.stderr : ''
  const meaningfulMessage = extractMeaningfulClaudeMessage(stdout, stderr)

  if (result.error) {
    const error = result.error as NodeJS.ErrnoException
    if (meaningfulMessage) {
      throw new Error(`Claude unavailable for ${input.stageLabel}: ${meaningfulMessage}`)
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error(
        `Claude ${input.stageLabel} timed out after ${Math.round(input.timeoutMs / 1000)}s. ` +
        `Set STEWARD_CLAUDE_PLAN_TIMEOUT_MS or STEWARD_CLAUDE_EXECUTE_TIMEOUT_MS to override.`
      )
    }

    throw new Error(`Claude ${input.stageLabel} failed: ${error.message}`)
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    if (meaningfulMessage) {
      throw new Error(`Claude unavailable for ${input.stageLabel}: ${meaningfulMessage}`)
    }

    throw new Error(`Claude ${input.stageLabel} exited with status ${result.status}`)
  }

  return {
    stdout,
    stderr,
    elapsedMs: Date.now() - startedAt,
    timeoutMs: input.timeoutMs,
  }
}
