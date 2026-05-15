import { createMemoryStore } from '@/features/lib/server/memoryStore'
import { AttendanceRecord } from '../types'
import { SEED_ATTENDANCE } from './seed'

export const attendanceStore = createMemoryStore<AttendanceRecord>(SEED_ATTENDANCE)
