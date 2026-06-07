/** @jest-environment node */

import * as path from 'path'
import { summarizeShellCommand, summarizeStreamJsonLine } from '../claude-progress-log'

describe('summarizeShellCommand', () => {
  it('collapses long npm and gh commands', () => {
    expect(summarizeShellCommand('npm test -- features/plan/__tests__')).toBe('npm test')
    expect(summarizeShellCommand('npm run build')).toBe('npm run build')
    expect(summarizeShellCommand('gh pr create --base dev --title foo')).toBe('gh pr create')
    expect(summarizeShellCommand('git commit -m "feedback: x"')).toBe('git commit')
  })
})

describe('summarizeStreamJsonLine', () => {
  it('summarizes init, tool use, and result without file contents', () => {
    const init = summarizeStreamJsonLine(
      JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-sonnet-4-6', permissionMode: 'acceptEdits' }),
      'daily execution',
    )
    expect(init).toMatch(/START  daily execution/)

    const read = summarizeStreamJsonLine(
      JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'Read',
              input: { file_path: path.join(process.cwd(), 'features', 'plan', 'a.tsx') },
            },
          ],
        },
      }),
    )
    expect(read).toMatch(/READ   features\/plan\/a\.tsx/)

    const bash = summarizeStreamJsonLine(
      JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'Bash',
              input: { command: 'npm test -- features/layout/__tests__/Sidebar.test.tsx' },
            },
          ],
        },
      }),
    )
    expect(bash).toMatch(/SHELL  npm test/)

    const done = summarizeStreamJsonLine(
      JSON.stringify({
        type: 'result',
        subtype: 'success',
        is_error: false,
        total_cost_usd: 1.32,
        duration_ms: 474000,
        num_turns: 46,
        permission_denials: [],
      }),
    )
    expect(done).toMatch(/DONE   success/)
    expect(done).toContain('cost=$1.32')
  })

  it('skips user tool_result payloads', () => {
    expect(
      summarizeStreamJsonLine(
        JSON.stringify({
          type: 'user',
          message: { content: [{ type: 'tool_result', content: 'x'.repeat(10_000) }] },
        }),
      ),
    ).toBeNull()
  })
})
