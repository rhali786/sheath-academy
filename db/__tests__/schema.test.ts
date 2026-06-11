import { subjectResources } from '@/db/schema'

describe('subjectResources schema', () => {
  it('defines subjectId and resourceId columns', () => {
    expect(subjectResources.subjectId).toBeDefined()
    expect(subjectResources.resourceId).toBeDefined()
  })
})
