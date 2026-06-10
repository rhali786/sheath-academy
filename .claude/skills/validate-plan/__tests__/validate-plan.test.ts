/** @jest-environment node */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import * as os from 'os'
import * as path from 'path'
import { validatePlanBundle } from '../validate-plan'

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

describe('validatePlanBundle', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'validate-plan-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('passes a structurally valid plan bundle with full coverage', () => {
    const groupedPlanPath = path.join(tempDir, 'docs', 'bug_enhancement', 'grouped-plan.json')
    const track1PlanPath = path.join(tempDir, 'docs', 'bug_enhancement', 'track1-plan.json')
    const planPath = path.join(tempDir, 'docs', 'bug_enhancement', '20260606-quran-progress-chart-plan.json')

    writeJson(groupedPlanPath, {
      feedbackIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
      workstreams: [{ uatByFeedbackId: { 'manual-bug-demo': ['step'] } }],
    })
    writeJson(track1PlanPath, { notes: 'manual-bug-demo is covered by track1' })
    writeJson(planPath, {
      version: 1,
      branch: 'feat/test',
      phases: [
        {
          id: 'phase-1',
          title: 'Cover aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          gated: false,
          preconditions: [],
          fileScope: ['features/quran/front/pages/QuranPage.tsx'],
          testsFirst: ['NEW TEST: quran chart renders'],
          doneWhen: ['RUN: npm test -- features/quran', 'RUN: npm run build'],
          writeBack: 'covered manual-bug-demo and the UUID',
        },
      ],
    })

    const report = validatePlanBundle({
      planInputs: [path.dirname(planPath)],
      groupedPlanPath,
      track1PlanPath,
    })

    expect(report.ok).toBe(true)
    expect(report.failCount).toBe(0)
    expect(report.planResults).toHaveLength(1)
    expect(report.planResults[0].verdict).toBe('PASS')
  })

  it('fails when required checks are missing', () => {
    const groupedPlanPath = path.join(tempDir, 'docs', 'bug_enhancement', 'grouped-plan.json')
    const track1PlanPath = path.join(tempDir, 'docs', 'bug_enhancement', 'track1-plan.json')
    const planPath = path.join(tempDir, 'docs', 'bug_enhancement', '20260606-dashboard-todo-widget-plan.json')

    writeJson(groupedPlanPath, {
      feedbackIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
      workstreams: [],
    })
    writeJson(track1PlanPath, { notes: 'no relevant ids here' })
    writeJson(planPath, {
      version: 1,
      branch: 'feat/test',
      phases: [
        {
          id: 'phase-1',
          title: 'Missing build command',
          gated: false,
          preconditions: [],
          fileScope: ['features/dashboard/front/pages/Dashboard.tsx'],
          testsFirst: ['NEW TEST: todo widget state'],
          doneWhen: ['RUN: npm test -- features/dashboard'],
          writeBack: 'no uuid listed here',
        },
      ],
    })

    const report = validatePlanBundle({
      planInputs: [path.dirname(planPath)],
      groupedPlanPath,
      track1PlanPath,
    })

    expect(report.ok).toBe(false)
    expect(report.failCount).toBeGreaterThan(0)
    expect(report.issues.some((issue) => issue.check === 'doneWhen')).toBe(true)
    expect(report.issues.some((issue) => issue.check === 'coverage')).toBe(true)
  })
})
