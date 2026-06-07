/** @jest-environment node */

import { runPlanExecute, parsePlanExecuteCliArgs } from '../../../../scripts/plan-execute/run-execute'

describe('scripts/plan-execute shim', () => {
  it('re-exports runPlanExecute from the skill bundle', () => {
    expect(typeof runPlanExecute).toBe('function')
  })

  it('re-exports parsePlanExecuteCliArgs from the skill bundle', () => {
    expect(parsePlanExecuteCliArgs(['--plan', 'docs/foo.json'])).toEqual({
      planPath: 'docs/foo.json',
      resume: false,
      skipGates: false,
    })
  })
})
