# Learner home ("My day"), learner picker and sidebar — plan

**Source:** UAT round 2, step 8.3 (Amir, 2026-10-12), marked pass with the note "dashboard failed".
**Decisions (owner, 2026-10-13):** a learner's Home is "My day"; the fix also locks the learner picker to the learner and hides sidebar pages a learner can't use.
**Mode:** 3 (cross-feature: auth policy, layout shell, dashboard, schedule, plan).

## What is wrong (reproduced on dev v2.121.0 with a throwaway learner login)

1. **Home fails.** `DashboardProvider` loads `/api/dashboard/summary`, `/api/dashboard/records` and `/api/alerts`, and `ActiveSchoolYearProvider` loads `/api/school-years/active`. All are parent-only (403), so the page shows "Error Loading Dashboard". This dates from the learner policy (2026-09-28).
2. **The rest of the app loads another child.** The learner's app shell loads every child, so the picker offers siblings and "All children". Pages fall back to the first child (a sibling), and the policy then refuses: Learning Time, Portfolio and Records show "Learners can only access their own information."
3. **Siblings' data is readable.** `/api/children/children`, `/api/quran/sessions`, `/api/quran/summary`, `/api/learning-time/sessions` and `…/sessions/active` are allowed for learners but not pinned to them. Without a filter, a learner reads every child's profile, Quran and learning time. "My day" would have shown siblings' minutes as the learner's own.
4. **The sidebar shows parent pages** that are refused or empty for a learner: Attendance, Portfolio, Gradebook, Reports & Records, People (with Archive buttons), Resources, Messages, Compliance, My feedback.
5. **The header polls parent-only data.** `/api/alerts` loads on every page and `/api/messaging/unread` every 15 s, giving 403s for as long as the learner is signed in.

## Fix

| # | Change | Owner |
|---|---|---|
| S1 | Learner policy pins `children/children`, `quran/sessions`, `quran/summary` (`childId`), `learning-time/sessions` and `…/sessions/active` (`learnerId`) to the learner's own id, the same way it already pins `plan/lessons` and `subjects`. This only narrows access; no new access. | auth |
| S2 | `GET /api/children/children?childId=` returns just that learner. | children |
| C1 | `isLearnerSession(session)` / `useIsLearner()`: the role from `session.user.memberships` for `session.user.householdId`. | auth (front) |
| C2 | `LearnerSelfSelect` (in `AppShell`): for a learner, the selected learner is always themselves. This also replaces a stale sibling id left in sessionStorage by a parent on a shared computer. With S1 the shell knows only one learner, so the picker hides itself (it already hides below 2). | layout |
| C3 | `navForViewer({ isAdmin, isLearner })`: one pure function that filters modules and items. Records, People and Messages drop out for a learner; Growth keeps Badges and opens on Badges; Planbook drops Resources; My feedback is hidden. A module's remembered last page is ignored if it is no longer visible. | layout |
| C4 | Header: no bell and no `/api/alerts` for a learner. `useUnreadMessages({ enabled })`: the Sidebar does not poll for a learner. | layout / messaging |
| C5 | `DashboardEntry` (feature component; the app page stays thin) renders `LearnerHome` for a learner, outside `DashboardProvider` and `ActiveSchoolYearProvider`, and the parent Dashboard otherwise. | dashboard |
| C6 | `LearnerHome` ("My day"): greeting, today's schedule (own lessons; Mark done; no edit pencil; start Learning Time), Quran streak (own sessions; log a session), Learning time this week, My to-dos, Islamic calendar. | dashboard |
| C7 | `ScheduleTimeline` `onMarkDone`: a "Mark done" button on lesson rows not yet done or skipped, only when a handler is given. `TodaySchedulePanel` gets `canEdit` (default true) and `onMarkDone`. | schedule / dashboard |

## Data-flow trace

- **Role:** `resolveTenant` → JWT `memberships[].role` → `session.user.memberships` + `session.user.householdId` → `isLearnerSession`. This is the same source the server uses (`requireAuthCtx` → `ctx.role`).
- **Own learner id:** `learners.user_id` → `getLearnerByUserId` (policy) → injected `childId` on `/api/children/children` → `HouseholdProvider.studentProfiles = [own]` → `LearnerSelfSelect` sets `selectedChildId = own.id` → all pages filter by it.
- **My day:**
  - Lessons: `plannerApi.getLessons(undefined, [ownId], undefined, today, today)`, then the policy injects `childIds=own`.
  - Mark done: `plannerApi.completeLesson(id)` → `PATCH /plan/lessons/:id/complete`, which is allowlisted.
  - Quran: `quranApi.getSessions(ownId)`; logging a session uses `addSession` → `POST /quran/sessions`, allowlisted, with the learner's own `childId`.
  - Learning time: `LearningTimeWeekCard` → `/learning-time/sessions`, pinned by S1. Starting a session uses `QuickStartByCourseList`'s POST with the learner's own `learnerId`.
  - To-dos: `/api/todos`, allowlisted.
  - Islamic calendar: computed in the browser; nothing is fetched.
- **Fixtures:** test learner ids are `StudentProfile.id` (learner row ids), never `Workspace.id`; `householdId` is `HouseholdProfile.id`.

## Tests (failing first)

- **Unit:**
  - `learnerPolicy.test.ts`: the five new pins; a sibling named explicitly is still refused.
  - `children.test.ts`: `?childId=` returns one learner.
  - `viewerRole.test.ts`: owner, learner, no session, and a learner in another household.
  - `navConfig.test.ts`: learner nav vs parent nav, Growth opening on Badges.
- **Integration:**
  - `Sidebar.test.tsx`: as a learner, the hidden links are absent and nothing polls for unread messages.
  - `Header.test.tsx`: as a learner, no bell and no `/api/alerts` call.
  - `LearnerSelfSelect.test.tsx`: a stale sibling id is replaced with the learner's own.
  - `ScheduleTimeline.test.tsx`: Mark done appears, is clicked, and is absent when the lesson is done or no handler is given.
  - `LearnerHome.test.tsx`: loading, empty, error and populated states; Mark done; no pencil; no parent-only API calls; logging a Quran session.
  - `DashboardEntry.test.tsx`: a learner gets My day and a parent gets the Dashboard.
- **Dev UAT** (`e2e/uat/uat-learner-home.spec.ts`), as a learner login:
  - My day loads with no error and no failed API calls.
  - Mark done works.
  - The sidebar has no parent pages and there is no picker.
  - Learning Time and Quran show only the learner's data.
  - The parent Dashboard is unchanged.

## Out of scope

Learner-specific versions of Calendar, Lesson Planner, Lessons, Quran and Badges, beyond showing the learner's own data. Direct URLs to hidden pages still reach the page; the server refuses the data. Learner-facing wording elsewhere.
