import { LessonTask } from '../../types'

export const plannerApi = {
  getLessons: async (week: string, childIds?: string[], subjectIds?: string[]): Promise<LessonTask[]> => {
    // TODO: Implement HTTP call to GET /api/planner/lessons
    return []
  },
  getLesson: async (id: string): Promise<LessonTask | null> => {
    // TODO: Implement HTTP call to GET /api/planner/lessons/:id
    return null
  },
  createLesson: async (data: Omit<LessonTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<LessonTask> => {
    // TODO: Implement HTTP call to POST /api/planner/lessons
    throw new Error('Not implemented')
  },
  updateLesson: async (id: string, patch: Partial<LessonTask>): Promise<LessonTask> => {
    // TODO: Implement HTTP call to PUT /api/planner/lessons/:id
    throw new Error('Not implemented')
  },
  completeLesson: async (id: string): Promise<LessonTask> => {
    // TODO: Implement HTTP call to PATCH /api/planner/lessons/:id/complete
    throw new Error('Not implemented')
  },
}
