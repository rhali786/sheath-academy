/**
 * Slim one-line summaries for claude stream-json events — written to
 * logs/steward/*.progress.log while the full stream stays in memory only.
 */

function formatTime(date = new Date()): string {
  return date.toISOString().slice(11, 19)
}

function relPath(filePath: unknown): string {
  if (typeof filePath !== 'string' || !filePath.trim()) return '?'
  const normalized = filePath.replace(/\\/g, '/')
  const cwd = process.cwd().replace(/\\/g, '/')
  return normalized.startsWith(cwd) ? normalized.slice(cwd.length + 1) : normalized
}

export function summarizeShellCommand(command: unknown): string {
  if (typeof command !== 'string' || !command.trim()) return 'shell'
  const cmd = command.trim().replace(/\s+/g, ' ')

  if (cmd.startsWith('npm test')) return 'npm test'
  if (cmd.startsWith('npm run build')) return 'npm run build'
  if (cmd.startsWith('npm run')) {
    const parts = cmd.split(' ')
    return parts.slice(0, 3).join(' ')
  }
  if (cmd.startsWith('gh pr create')) return 'gh pr create'
  if (cmd.startsWith('gh pr edit')) return 'gh pr edit'
  if (cmd.startsWith('gh pr view')) return 'gh pr view'
  if (cmd.startsWith('git commit')) return 'git commit'
  if (cmd.startsWith('git add')) return 'git add'
  if (cmd.startsWith('git checkout')) return 'git checkout'
  if (cmd.startsWith('git status')) return 'git status'
  if (cmd.startsWith('npx jest')) return 'npx jest'

  const short = cmd.split(' ').slice(0, 3).join(' ')
  return short.length > 48 ? `${short.slice(0, 45)}…` : short
}

function summarizeToolUse(name: string, input: Record<string, unknown> | undefined): string {
  const ts = formatTime()
  const toolInput = input ?? {}

  switch (name) {
    case 'Read':
      return `[${ts}] READ   ${relPath(toolInput.file_path)}`
    case 'Edit':
      return `[${ts}] EDIT   ${relPath(toolInput.file_path)}`
    case 'Write':
      return `[${ts}] WRITE  ${relPath(toolInput.file_path)}`
    case 'Bash':
    case 'PowerShell':
      return `[${ts}] SHELL  ${summarizeShellCommand(toolInput.command ?? toolInput.description)}`
    case 'Glob':
      return `[${ts}] GLOB   ${String(toolInput.pattern ?? '?')}`
    case 'Grep':
      return `[${ts}] GREP   ${String(toolInput.pattern ?? '?')}`
    case 'Skill':
      return `[${ts}] SKILL  ${String(toolInput.skill ?? '?')}`
    case 'Task':
      return `[${ts}] TASK   ${String(toolInput.description ?? toolInput.subagent_type ?? '?')}`
    default:
      return `[${ts}] TOOL   ${name}`
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Returns one or more progress lines, or null when the event should be skipped.
 */
export function summarizeStreamJsonLine(rawLine: string, stageLabel?: string): string | null {
  const line = rawLine.trim()
  if (!line) return null

  let event: unknown
  try {
    event = JSON.parse(line)
  } catch {
    return null
  }

  if (!isRecord(event)) return null
  const ts = formatTime()

  if (event.type === 'system' && event.subtype === 'init') {
    const model = typeof event.model === 'string' ? event.model : 'claude'
    const mode = typeof event.permissionMode === 'string' ? event.permissionMode : ''
    const label = stageLabel ? `${stageLabel} | ` : ''
    return `[${ts}] START  ${label}${model}${mode ? ` | ${mode}` : ''}`
  }

  if (event.type === 'rate_limit_event' && isRecord(event.rate_limit_info)) {
    const status = String(event.rate_limit_info.status ?? '?')
    const kind = String(event.rate_limit_info.rateLimitType ?? '')
    return `[${ts}] LIMIT  ${status}${kind ? ` (${kind})` : ''}`
  }

  if (event.type === 'assistant' && isRecord(event.message) && Array.isArray(event.message.content)) {
    const lines: string[] = []
    for (const block of event.message.content) {
      if (!isRecord(block)) continue
      if (block.type === 'tool_use' && typeof block.name === 'string') {
        lines.push(summarizeToolUse(block.name, isRecord(block.input) ? block.input : undefined))
      }
    }
    return lines.length > 0 ? lines.join('\n') : null
  }

  if (event.type === 'result') {
    const cost =
      typeof event.total_cost_usd === 'number' ? `$${event.total_cost_usd.toFixed(2)}` : '?'
    const secs =
      typeof event.duration_ms === 'number' ? `${Math.round(event.duration_ms / 1000)}s` : '?'
    const turns = typeof event.num_turns === 'number' ? `${event.num_turns} turns` : ''

    if (event.is_error) {
      const msg =
        typeof event.result === 'string'
          ? event.result.replace(/\s+/g, ' ').slice(0, 100)
          : 'error'
      return `[${ts}] FAIL   ${msg} | cost=${cost}`
    }

    const denies = Array.isArray(event.permission_denials) ? event.permission_denials.length : 0
    const denyNote = denies > 0 ? ` | ${denies} denial(s)` : ''
    return `[${ts}] DONE   success | cost=${cost} | ${secs}${turns ? ` | ${turns}` : ''}${denyNote}`
  }

  return null
}
