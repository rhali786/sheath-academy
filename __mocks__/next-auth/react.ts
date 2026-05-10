// Default mock for next-auth/react in Jest.
// Per-test overrides via jest.mock('next-auth/react', () => ...) take priority.
export const useSession = jest.fn(() => ({ data: null, status: 'unauthenticated' }))
export const signIn = jest.fn()
export const signOut = jest.fn()
export const SessionProvider = ({ children }: { children: React.ReactNode }) => children
