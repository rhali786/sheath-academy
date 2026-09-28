import { getUserById, addMember, reactivateMember } from '@/features/household/server/repository'
import {
  createLearnerCredentialUser,
  updateUserUsername,
  updateUserPassword,
  getUserByIdentifier,
  getUserByEmail,
  deleteUser,
} from '@/features/auth/server/repository'
import { hashPassword } from '@/features/auth/server/password'
import { logger } from '@/features/lib/logger'

/**
 * Synthesized email for username-only learner logins — `users.email` is NOT NULL
 * UNIQUE and these learners have no real address. Keyed by learner id so the row
 * is stable, collision-safe, and — critically — *re-findable*: it is the only way
 * to recognise a credential user that belongs to this learner but was never
 * linked back to it (`learners.userId` still NULL).
 */
export function placeholderLearnerEmail(learnerId: string): string {
  return `learner.${learnerId}@no-email.local`
}

export interface ProvisionLearnerLoginInput {
  householdId: string
  learnerId: string
  /** Used as the credential user's display name when creating one. */
  learnerName: string
  username: string
  /** Plaintext. Required unless the resolved credential user already has a hash. */
  password?: string
  /** `learners.userId` — set when the learner is already linked to a credential user. */
  existingUserId: string | null
}

export type ProvisionLearnerLoginResult =
  | {
      ok: true
      /** The credential user the learner should be linked to. */
      userId: string
      /**
       * Non-null only when this call *created* the user. The caller must
       * `deleteUser(createdUserId)` if it then fails to link it to the learner —
       * see the compensation note below.
       */
      createdUserId: string | null
    }
  | { ok: false; status: 400 | 409; message: string }

/**
 * Resolves (or creates) the credential user backing a learner's sign-in, and
 * makes sure they hold an active `learner` membership in the household.
 *
 * Enabling learner login spans three tables owned by three features — `users`
 * (auth), `household_members` (household) and `learners.userId` (children) — and
 * there is no transaction spanning them. The failure that produced feedback item
 * 5 is the half-finished state: the credential user gets created (claiming its
 * username), then a later step fails, leaving `learners.userId` NULL. Every
 * subsequent attempt then hit the dup-username check and returned 409 *forever*,
 * and the UI swallowed the error so nobody could see why.
 *
 * Two properties fix that for good:
 *
 *   1. **Idempotent / self-healing.** A learner's own leftover credential user is
 *      located by its placeholder email and *adopted* (username + password reset,
 *      membership reactivated) instead of colliding with it. This unsticks
 *      households already trapped, and works whether the parent retries with the
 *      same username or a different one.
 *   2. **Compensated.** If `addMember` fails right after creating the user, the
 *      user row is deleted before rethrowing, so a fresh orphan is never left
 *      behind. The caller owns the same duty for the final link step and is told
 *      what to clean up via `createdUserId`.
 */
export async function provisionLearnerLogin(
  input: ProvisionLearnerLoginInput,
): Promise<ProvisionLearnerLoginResult> {
  const { householdId, learnerId, learnerName, username, existingUserId } = input
  const trimmedPassword = input.password?.trim()

  // Which credential user should this learner use?
  //  - the linked one, when learners.userId is set; otherwise
  //  - this learner's own orphan, recognised by the placeholder email.
  const linkedUser = existingUserId ? await getUserById(existingUserId) : null
  const ownOrphan = linkedUser ? null : await getUserByEmail(placeholderLearnerEmail(learnerId))
  const target = linkedUser ?? ownOrphan

  if (ownOrphan) {
    logger.info(
      { householdId, learnerId, userId: ownOrphan.id },
      'provisionLearnerLogin: adopting this learner\'s unlinked credential user',
    )
  }

  // The username must be free, or already belong to the user we resolved above.
  const dup = await getUserByIdentifier(username)
  if (dup && dup.id !== target?.id) {
    return { ok: false, status: 409, message: 'Username is already taken' }
  }

  // Disabling clears the hash (deactivateUserCredentials), so a re-enable needs a
  // fresh password; an already-enabled learner can be edited without retyping one.
  if (!target?.passwordHash && !trimmedPassword) {
    return { ok: false, status: 400, message: 'password is required to enable learner login' }
  }

  if (target) {
    await updateUserUsername(target.id, username)
    if (trimmedPassword) {
      await updateUserPassword(target.id, await hashPassword(trimmedPassword))
    }
    // addMember is a no-op when a row already exists, so pair it with
    // reactivateMember to cover both "never a member" and "membership disabled".
    await addMember(householdId, target.id, 'learner')
    await reactivateMember(householdId, target.id)
    return { ok: true, userId: target.id, createdUserId: null }
  }

  const credUser = await createLearnerCredentialUser({
    name: learnerName,
    email: placeholderLearnerEmail(learnerId),
    username,
    passwordHash: await hashPassword(trimmedPassword!),
  })

  try {
    await addMember(householdId, credUser.id, 'learner')
  } catch (err) {
    // Undo the user we just created rather than leaving its username claimed.
    await deleteUser(credUser.id)
    logger.error(
      { householdId, learnerId, userId: credUser.id, err },
      'provisionLearnerLogin: addMember failed — rolled back the new credential user',
    )
    throw err
  }

  return { ok: true, userId: credUser.id, createdUserId: credUser.id }
}
