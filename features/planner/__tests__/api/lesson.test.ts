describe('GET /api/planner/lessons/:id', () => {
  it('returns the lesson by id')
  it('returns 404 when id does not exist')
})

describe('POST /api/planner/lessons', () => {
  it('creates a lesson with valid childId and subjectId')
  it('returns 404 when childId does not exist in children service')
  it('returns 404 when subjectId does not exist in subjects service')
  it('returns 400 when required fields are missing')
})

describe('PUT /api/planner/lessons/:id', () => {
  it('updates lesson fields (title, description, dueDate)')
  it('returns 404 when id does not exist')
})

describe('PATCH /api/planner/lessons/:id/complete', () => {
  it('sets isCompleted to true')
  it('returns 404 when id does not exist')
})
