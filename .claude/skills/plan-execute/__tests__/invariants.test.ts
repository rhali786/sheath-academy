/** @jest-environment node */

import '../invariants.drizzle'
import { checkMigrationJournalContiguity } from '../invariants.drizzle'
import { phaseNeedsInvariantCheck } from '../invariants'

describe('phaseNeedsInvariantCheck', () => {
  it('returns true when invariants are declared', () => {
    expect(phaseNeedsInvariantCheck({
      invariants: ['db:generate produces no new migration'],
      fileScope: ['features/x/**'],
    })).toBe(true)
  })

  it('returns true when file scope touches schema or migrations', () => {
    expect(phaseNeedsInvariantCheck({
      fileScope: ['db/schema.ts'],
    })).toBe(true)
  })

  it('returns false for ordinary feature-only phases', () => {
    expect(phaseNeedsInvariantCheck({
      fileScope: ['features/dashboard/**'],
    })).toBe(false)
  })
})

describe('checkMigrationJournalContiguity', () => {
  it('passes on the current repository journal', () => {
    const result = checkMigrationJournalContiguity(process.cwd())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.migrationRange).toMatch(/0000/)
    }
  })
})
