import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { EvidenceItem } from '../types'
import { SEED_EVIDENCE } from './seed'

export const evidenceStore = createMemoryStore<EvidenceItem>(SEED_EVIDENCE)
