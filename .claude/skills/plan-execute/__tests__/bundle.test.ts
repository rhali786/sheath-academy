/** @jest-environment node */

import { existsSync } from 'fs'
import * as path from 'path'
import {
  loadInvariantConfig,
  registerInvariantChecker,
  resetInvariantCheckersForTests,
  checkPhaseInvariants,
} from '../invariants'
import { resolveSkillDir, resolveSkillFile } from '../run-execute'

describe('portable plan-execute bundle', () => {
  it('resolveSkillDir points at the folder containing SKILL.md and run-execute.ts', () => {
    const skillDir = resolveSkillDir()
    expect(existsSync(path.join(skillDir, 'SKILL.md'))).toBe(true)
    expect(existsSync(path.join(skillDir, 'run-execute.ts'))).toBe(true)
  })

  it('resolveSkillFile joins paths under the skill directory', () => {
    expect(resolveSkillFile('invariants.config.json')).toBe(
      path.join(resolveSkillDir(), 'invariants.config.json'),
    )
  })

  it('loadInvariantConfig reads checkers from invariants.config.json in the skill folder', () => {
    const checkers = loadInvariantConfig(resolveSkillDir())
    expect(checkers).toContain('drizzle-migrations')
  })

  it('runs registered invariant checkers from config', () => {
    resetInvariantCheckersForTests()
    registerInvariantChecker('test-checker', () => ({ ok: false, reason: 'boom' }))

    const result = checkPhaseInvariants(
      { invariants: ['must pass'], fileScope: ['features/x/**'] },
      process.cwd(),
      ['test-checker'],
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('boom')
    }
  })

  it('skips invariant checks when phase does not need them', () => {
    resetInvariantCheckersForTests()
    registerInvariantChecker('test-checker', () => ({ ok: false, reason: 'should not run' }))

    const result = checkPhaseInvariants(
      { fileScope: ['features/dashboard/**'] },
      process.cwd(),
      ['test-checker'],
    )

    expect(result.ok).toBe(true)
  })
})
