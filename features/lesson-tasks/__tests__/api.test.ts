/**
 * @jest-environment node
 */
import { GET, POST } from '@/features/lesson-tasks/api/routes/lesson-tasks'
import {
  GET as GETOne,
  PATCH as PATCHOne,
  DELETE as DELETEOne,
} from '@/features/lesson-tasks/api/routes/lesson-task'
import { resetStore, createLessonTask } from '@/features/lesson-tasks/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

const validBody = {
  childId: SEED_IDS.adam,
  subjectId: 'subject_seed_002',
  title: 'Test lesson',
  date: '2026-05-12',
}

function makeRequest(url: string, options?: RequestInit): Request {
  return new Request(url, options)
}

beforeEach(() => {
  resetStore()
})

describe('GET /api/lesson-tasks', () => {
  it('200 with lesson task array', async () => {
    const res = await GET(makeRequest('http://localhost/api/lesson-tasks'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
  })

  it('200 with filtered results by childId', async () => {
    const res = await GET(makeRequest(`http://localhost/api/lesson-tasks?childId=${SEED_IDS.adam}`))
    const body = await res.json()
    expect(res.status).toBe(200)
    body.data.forEach((t: { childId: string }) => expect(t.childId).toBe(SEED_IDS.adam))
  })

  it('200 with filtered results by subjectId', async () => {
    const res = await GET(makeRequest('http://localhost/api/lesson-tasks?subjectId=subject_seed_002'))
    const body = await res.json()
    expect(res.status).toBe(200)
    body.data.forEach((t: { subjectId: string }) => expect(t.subjectId).toBe('subject_seed_002'))
  })

  it('200 with filtered results by date', async () => {
    const res = await GET(makeRequest('http://localhost/api/lesson-tasks?date=2026-05-11'))
    const body = await res.json()
    expect(res.status).toBe(200)
    body.data.forEach((t: { date: string }) => expect(t.date).toBe('2026-05-11'))
  })

  it('200 with empty array when no matches', async () => {
    const res = await GET(makeRequest('http://localhost/api/lesson-tasks?childId=nonexistent'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toEqual([])
  })
})

describe('POST /api/lesson-tasks', () => {
  it('201 with created lesson task', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      })
    )
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.status).toBe('success')
    expect(body.data.title).toBe('Test lesson')
    expect(body.data.id).toMatch(/^lesson_task_/)
  })

  it('400 for missing title', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, title: '' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('400 for missing childId', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, childId: '' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('400 for missing subjectId', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, subjectId: '' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('400 for non-existent child', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, childId: 'nonexistent_child' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('400 for non-existent subject', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, subjectId: 'nonexistent_subject' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('400 for cross-child subject mismatch', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, subjectId: 'subject_seed_004' }), // khadijah's subject
      })
    )
    expect(res.status).toBe(400)
  })

  it('400 for invalid date', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, date: 'not-a-date' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('400 for invalid status', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, status: 'moved' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('400 for invalid resource link scheme', async () => {
    const res = await POST(
      makeRequest('http://localhost/api/lesson-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, resourceLink: 'javascript:alert(1)' }),
      })
    )
    expect(res.status).toBe(400)
  })
})

describe('GET /api/lesson-tasks/:id', () => {
  it('200 with lesson task', async () => {
    const task = createLessonTask(validBody)!
    const res = await GETOne(task.id)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(task.id)
  })

  it('404 for unknown ID', async () => {
    const res = await GETOne('nonexistent_id')
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.status).toBe('error')
  })
})

describe('PATCH /api/lesson-tasks/:id', () => {
  it('200 with updated lesson task', async () => {
    const task = createLessonTask(validBody)!
    const res = await PATCHOne(
      task.id,
      makeRequest(`http://localhost/api/lesson-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title', status: 'completed' }),
      })
    )
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.title).toBe('Updated Title')
    expect(body.data.status).toBe('completed')
  })

  it('400 for validation failure', async () => {
    const task = createLessonTask(validBody)!
    const res = await PATCHOne(
      task.id,
      makeRequest(`http://localhost/api/lesson-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('404 for unknown ID', async () => {
    const res = await PATCHOne(
      'nonexistent_id',
      makeRequest('http://localhost/api/lesson-tasks/nonexistent_id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'x' }),
      })
    )
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/lesson-tasks/:id', () => {
  it('200 on success', async () => {
    const task = createLessonTask(validBody)!
    const res = await DELETEOne(task.id)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
  })

  it('404 for unknown ID', async () => {
    const res = await DELETEOne('nonexistent_id')
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.status).toBe('error')
  })
})

describe('App router catch-all — DELETE method supported', () => {
  it('DELETE function is exported from the catch-all route', async () => {
    const routeModule = await import('@/app/api/[...slug]/route')
    expect(typeof routeModule.DELETE).toBe('function')
  })

  it('DELETE routes lesson-tasks requests correctly', async () => {
    const task = createLessonTask(validBody)!
    const { DELETE } = await import('@/app/api/[...slug]/route')
    const res = await DELETE(
      makeRequest(`http://localhost/api/lesson-tasks/${task.id}`, { method: 'DELETE' }),
      { params: Promise.resolve({ slug: ['lesson-tasks', task.id] }) }
    )
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
  })
})
