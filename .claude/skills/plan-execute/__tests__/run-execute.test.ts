/** @jest-environment node */

const actualFs = jest.requireActual<typeof import('fs')>('fs')

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs')
  return {
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    readdirSync: actual.readdirSync,
  }
})

jest.mock('../claude-integration', () => ({
  runClaudePrompt: jest.fn(),
}))

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { runClaudePrompt } from '../claude-integration'
import {
  buildWorkerPrompt,
  createInitialProgress,
  findResumePhaseIndex,
  parsePlanExecuteCliArgs,
  parseWorkerResponse,
  resolvePhaseModel,
  runPlanExecute,
  type PlanExecutePlan,
  type PlanProgressFile,
} from '../run-execute'

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>
const mockRunClaudePrompt = runClaudePrompt as jest.MockedFunction<typeof runClaudePrompt>

function makePlan(): PlanExecutePlan {
  return {
    version: 1,
    planMarkdownPath: 'docs/test-plan.md',
    branch: 'feature/test-plan',
    phases: [
      {
        id: 'phase-1',
        title: 'Add store',
        gated: false,
        modelTier: 'standard',
        preconditions: ['progress.json shows no prior phases'],
        fileScope: ['features/test/server/**/*.ts'],
        testsFirst: ['NEW TEST: features/test/__tests__/store.test.ts — exports useTestStore'],
        doneWhen: ['RUN: npm test -- features/test/__tests__/store.test.ts'],
        writeBack: 'Store exports useTestStore',
      },
      {
        id: 'phase-2',
        title: 'Add migration',
        gated: true,
        modelTier: 'strong',
        preconditions: ['phase-1 complete', 'useTestStore exists'],
        fileScope: ['db/schema.ts', 'db/migrations/**/*.sql'],
        testsFirst: [],
        doneWhen: ['RUN: npm run db:generate', 'RUN: npm run db:migrate'],
        invariants: ['db:generate produces no new migration', 'db:migrate applies cleanly'],
        writeBack: 'Migration number recorded in notes',
      },
    ],
  }
}

function makeProgress(overrides: Partial<PlanProgressFile> = {}): PlanProgressFile {
  return {
    plan: 'docs/test-plan.json',
    createdAt: '2026-06-05T10:00:00.000Z',
    updatedAt: '2026-06-05T10:00:00.000Z',
    branch: 'feature/test-plan',
    phases: [
      {
        id: 'phase-1',
        title: 'Add store',
        gated: false,
        status: 'pending',
        model: null,
        startedAt: null,
        completedAt: null,
        outputs: { filesChanged: [], testsRun: [], notes: '' },
        failureReason: null,
      },
      {
        id: 'phase-2',
        title: 'Add migration',
        gated: true,
        status: 'pending',
        model: null,
        startedAt: null,
        completedAt: null,
        outputs: { filesChanged: [], testsRun: [], notes: '' },
        failureReason: null,
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockExistsSync.mockImplementation((filePath) => {
    const normalized = String(filePath).replace(/\\/g, '/')
    if (normalized.endsWith('docs/test-plan.progress.json')) {
      return false
    }
    return true
  })
})

describe('parsePlanExecuteCliArgs', () => {
  it('parses --plan and --resume', () => {
    expect(parsePlanExecuteCliArgs(['--plan', 'docs/foo.json', '--resume'])).toEqual({
      planPath: 'docs/foo.json',
      resume: true,
      skipGates: false,
    })
  })

  it('parses --skip-gates', () => {
    expect(parsePlanExecuteCliArgs(['--plan', 'docs/foo.json', '--skip-gates'])).toEqual({
      planPath: 'docs/foo.json',
      resume: false,
      skipGates: true,
    })
  })
})

describe('createInitialProgress', () => {
  it('creates pending phases from the plan', () => {
    const progress = createInitialProgress(makePlan(), 'docs/test-plan.json')
    expect(progress.phases).toHaveLength(2)
    expect(progress.phases[0].status).toBe('pending')
    expect(progress.phases[1].gated).toBe(true)
  })
})

describe('findResumePhaseIndex', () => {
  it('returns first non-complete phase', () => {
    const progress = makeProgress({
      phases: [
        { ...makeProgress().phases[0], status: 'complete' },
        makeProgress().phases[1],
      ],
    })
    expect(findResumePhaseIndex(progress)).toBe(1)
  })

  it('returns -1 when all complete', () => {
    const progress = makeProgress({
      phases: makeProgress().phases.map((p) => ({ ...p, status: 'complete' as const })),
    })
    expect(findResumePhaseIndex(progress)).toBe(-1)
  })
})

describe('resolvePhaseModel', () => {
  it('maps modelTier to env-backed defaults', () => {
    expect(resolvePhaseModel({ modelTier: 'cheap' })).toMatch(/haiku/i)
    expect(resolvePhaseModel({ modelTier: 'standard' })).toMatch(/sonnet/i)
    expect(resolvePhaseModel({ modelTier: 'strong' })).toMatch(/opus/i)
  })

  it('prefers explicit model over tier', () => {
    expect(resolvePhaseModel({ modelTier: 'cheap', model: 'custom-model-id' })).toBe('custom-model-id')
  })
})

describe('parseWorkerResponse', () => {
  it('accepts DONE', () => {
    expect(parseWorkerResponse('DONE')).toEqual({ ok: true })
  })

  it('parses FAILED reason', () => {
    expect(parseWorkerResponse('FAILED: precondition missing')).toEqual({
      ok: false,
      reason: 'precondition missing',
    })
  })
})

describe('buildWorkerPrompt', () => {
  it('points worker at plan and progress files without restating plan contents', () => {
    const prompt = buildWorkerPrompt('phase-1', 'docs/test-plan.json', 'docs/test-plan.progress.json')
    expect(prompt).toContain('phase-1')
    expect(prompt).toContain('docs/test-plan.json')
    expect(prompt).toContain('docs/test-plan.progress.json')
    expect(prompt).toContain('DONE')
  })
})

describe('runPlanExecute', () => {
  it('runs phases sequentially and stops at a gated phase', async () => {
    const plan = makePlan()
    let progress = createInitialProgress(plan, 'docs/test-plan.json')

    mockReadFileSync.mockImplementation((filePath, encoding) => {
      const normalized = String(filePath).replace(/\\/g, '/')
      if (normalized.endsWith('docs/test-plan.json')) {
        return JSON.stringify(plan) as never
      }
      if (normalized.endsWith('docs/test-plan.progress.json')) {
        return JSON.stringify(progress) as never
      }
      if (normalized.endsWith('.claude/skills/plan-execute/SKILL.md') || normalized.endsWith('SKILL.md')) {
        return '# plan-execute skill' as never
      }
      return actualFs.readFileSync(filePath, encoding ?? 'utf8') as never
    })

    mockWriteFileSync.mockImplementation((_path, data) => {
      progress = JSON.parse(String(data)) as PlanProgressFile
    })

    mockRunClaudePrompt.mockImplementation(() => {
      const phase = progress.phases.find((p) => p.status === 'in_progress')
      if (phase) {
        phase.status = 'complete'
        phase.completedAt = '2026-06-05T10:05:00.000Z'
        phase.outputs.notes = 'phase done'
        progress.updatedAt = '2026-06-05T10:05:00.000Z'
        mockWriteFileSync('docs/test-plan.progress.json', JSON.stringify(progress))
      }
      return { stdout: 'DONE', stderr: '', elapsedMs: 100, timeoutMs: undefined }
    })

    const result = await runPlanExecute({
      planPath: 'docs/test-plan.json',
      resume: false,
      skipGates: false,
    })

    expect(mockRunClaudePrompt).toHaveBeenCalledTimes(1)
    expect(result.status).toBe('gated')
    expect(result.stoppedAtPhaseId).toBe('phase-2')
    expect(result.phasesCompleted).toEqual(['phase-1'])
  })

  it('runs all phases when --skip-gates is set', async () => {
    const plan = makePlan()
    let progress = createInitialProgress(plan, 'docs/test-plan.json')

    mockReadFileSync.mockImplementation((filePath, encoding) => {
      const normalized = String(filePath).replace(/\\/g, '/')
      if (normalized.endsWith('docs/test-plan.json')) {
        return JSON.stringify(plan) as never
      }
      if (normalized.endsWith('docs/test-plan.progress.json')) {
        return JSON.stringify(progress) as never
      }
      if (normalized.endsWith('.claude/skills/plan-execute/SKILL.md') || normalized.endsWith('SKILL.md')) {
        return '# plan-execute skill' as never
      }
      return actualFs.readFileSync(filePath, encoding ?? 'utf8') as never
    })

    mockWriteFileSync.mockImplementation((_path, data) => {
      progress = JSON.parse(String(data)) as PlanProgressFile
    })

    mockRunClaudePrompt.mockImplementation(() => {
      const phase = progress.phases.find((p) => p.status === 'in_progress')
      if (phase) {
        phase.status = 'complete'
        phase.completedAt = '2026-06-05T10:05:00.000Z'
        phase.outputs.notes = 'phase done'
        progress.updatedAt = '2026-06-05T10:05:00.000Z'
        mockWriteFileSync('docs/test-plan.progress.json', JSON.stringify(progress))
      }
      return { stdout: 'DONE', stderr: '', elapsedMs: 100, timeoutMs: undefined }
    })

    const result = await runPlanExecute({
      planPath: 'docs/test-plan.json',
      resume: false,
      skipGates: true,
    })

    expect(mockRunClaudePrompt).toHaveBeenCalledTimes(2)
    expect(result.status).toBe('complete')
    expect(result.phasesCompleted).toEqual(['phase-1', 'phase-2'])
  })

  it('stops on worker failure without running later phases', async () => {
    const plan = makePlan()
    let progress = createInitialProgress(plan, 'docs/test-plan.json')

    mockReadFileSync.mockImplementation((filePath, encoding) => {
      const normalized = String(filePath).replace(/\\/g, '/')
      if (normalized.endsWith('docs/test-plan.json')) {
        return JSON.stringify(plan) as never
      }
      if (normalized.endsWith('docs/test-plan.progress.json')) {
        return JSON.stringify(progress) as never
      }
      if (normalized.endsWith('.claude/skills/plan-execute/SKILL.md') || normalized.endsWith('SKILL.md')) {
        return '# plan-execute skill' as never
      }
      return actualFs.readFileSync(filePath, encoding ?? 'utf8') as never
    })

    mockWriteFileSync.mockImplementation((_path, data) => {
      progress = JSON.parse(String(data)) as PlanProgressFile
    })

    mockRunClaudePrompt.mockImplementation(() => {
      const phase = progress.phases.find((p) => p.status === 'in_progress')
      if (phase) {
        phase.status = 'failed'
        phase.failureReason = 'precondition missing'
        progress.updatedAt = '2026-06-05T10:05:00.000Z'
        mockWriteFileSync('docs/test-plan.progress.json', JSON.stringify(progress))
      }
      return { stdout: 'FAILED: precondition missing', stderr: '', elapsedMs: 100, timeoutMs: undefined }
    })

    const result = await runPlanExecute({
      planPath: 'docs/test-plan.json',
      resume: false,
      skipGates: true,
    })

    expect(mockRunClaudePrompt).toHaveBeenCalledTimes(1)
    expect(result.status).toBe('failed')
    expect(result.failureReason).toMatch(/precondition missing/i)
  })
})
