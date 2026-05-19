import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { Resource } from '@/features/resources/types'
import { SEED_RESOURCES } from './seed'

export const resourcesStore = createMemoryStore<Resource>(SEED_RESOURCES)
