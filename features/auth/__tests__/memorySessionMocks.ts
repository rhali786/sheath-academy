import { SEED_IDS } from '@/features/lib/seedIds'

/** Household profile returned by mocked getHouseholdProfile in memory API tests. */
export const memorySessionHousehold = {
  id: SEED_IDS.household,
  workspaceId: SEED_IDS.workspace,
  familyName: 'Test Household',
  createdAt: new Date().toISOString(),
}

/** Call at top of API route test files (after jest.mock declarations). */
export function bindMemorySessionAuth(mockAuth: jest.Mock): void {
  mockAuth.mockResolvedValue({
    user: { id: 'test-user', email: 'test@sheathacademy.ai', name: 'Test' },
  })
}
