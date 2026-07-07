# UAT: Feedback waves 1–4

User acceptance tests for the 8 production feedback items addressed in `20260611-feedback-waves-1-4-plan.md`. Each test is written from the **reporting user's perspective** (homeschool parent) and ties back to the verbatim feedback so a non-technical tester can confirm the concern is actually resolved.

**How to use:** Run each test on the deployed preview (or production after release) signed in to a real household. Mark **PASS** only if the *Expected result* is met exactly. Record the app version (shown in the header) and the date. If a test fails, note what actually happened.

**Environment:** ____________________  **Version:** ____________  **Tester:** ____________  **Date:** ____________

---

## Wave 1a — New courses appear immediately

Covers `50774221` (/plan) and `fcee6fd0` (/lessons).

> "I'm trying to add a lesson for a spelling class, but its not showing up on the course/subject list despite ust adding it as a course for them a moment ago."
> "It is, however showing science class which I added the other day."

**Precondition:** Signed in to a household with at least one learner. Do **not** reload the page at any point during this test — that is the whole point.

1. Go to **Settings → Courses**.
2. Add a new course named `UAT Spelling` and assign it to a learner. Save.
3. Without reloading, navigate to **Lessons** (`/lessons`).
4. Open the "Add lesson" course/subject dropdown.
5. **Expected:** `UAT Spelling` appears in the dropdown alongside older courses. ☐ PASS ☐ FAIL
6. Without reloading, navigate to the **Weekly Planner** (`/plan`).
7. Open the subject/course filter.
8. **Expected:** `UAT Spelling` appears in the filter. ☐ PASS ☐ FAIL
9. Back in **Settings → Courses**, archive `UAT Spelling`.
10. Without reloading, return to `/lessons` and `/plan`.
11. **Expected:** `UAT Spelling` no longer appears in the active course pickers. ☐ PASS ☐ FAIL

---

## Wave 1b — Generated lessons can be saved and appear in the planner

Covers `e534c6cc` (/plan).

> "I generated lessons using the Resources page which showed it would plan lessons starting today and continuing from there, but I don't see the lessons when I click on the Calendar, Lesson Planner, etc."

**Precondition:** Signed in to a household with at least one learner and one course.

1. Go to **Resources** (`/resources`) and open a resource that has chapters.
2. Click **Generate lessons**.
3. **Expected:** A preview list of lessons with dates (starting today) is shown. ☐ PASS ☐ FAIL
4. **Expected:** A **Save to plan** action is visible below the preview. ☐ PASS ☐ FAIL
5. **Expected:** Save to plan is disabled until you select a learner and a course. ☐ PASS ☐ FAIL
6. Select a learner and a course, then click **Save to plan**.
7. **Expected:** A confirmation appears (e.g. "N lessons added to the planner"). ☐ PASS ☐ FAIL
8. Navigate to **Lessons** (`/lessons`) / **Weekly Planner** (`/plan`).
9. **Expected:** The generated lessons appear on their generated due dates. ☐ PASS ☐ FAIL
10. Return to Resources without re-generating and confirm Save to plan does not silently create duplicates (it should be disabled or require a new generation). ☐ PASS ☐ FAIL

---

## Wave 2a — Quran memorization labels are clear

Covers `80f04cd0` (/quran).

> "Seeking clarification, is the 'memorization' option for when they've already memorized that surah? Because there's 'memorization' and 'new memorization.'"

**Precondition:** Signed in to a household with a learner; ideally one existing Quran session previously logged as "Memorisation".

1. Go to **Quran** (`/quran`), select a learner, and open **Add session**.
2. Open the session **Type** dropdown.
3. **Expected:** The two options are clearly distinguishable — one reads as *first-time / new memorization* (e.g. "New memorization (Hifz)") and the other as *reviewing an already-memorized surah* (e.g. "Memorization review (already memorized)"). The distinction the user asked about is now answerable from the labels alone. ☐ PASS ☐ FAIL
4. Add a session using the "review" option and save it.
5. **Expected:** The saved session still appears correctly in the list, and the type filter still works for it (no data/filter regression). ☐ PASS ☐ FAIL
6. Find the pre-existing "Memorisation" session (if one exists).
7. **Expected:** It now displays the friendly "review" label rather than the old raw text. ☐ PASS ☐ FAIL

---

## Wave 2b — Choose lesson pacing (weekly / every N days)

Covers `3c4cc9a2` (/resources).

> "...I like that I can change how many chapters I'm doing and what strategy. Its still automatically putting one chapter per day, rather than me choosing to do a chapter week or every x days."

**Precondition:** Signed in; a resource with several chapters available on Resources.

1. Go to **Resources** (`/resources`), open a multi-chapter resource, and find the lesson-generation form.
2. **Expected:** A **Pacing** control is present with options: Every school day / Once a week / Every N days. ☐ PASS ☐ FAIL
3. Select **Once a week** and Generate.
4. **Expected:** Preview lesson dates are 7 days apart. ☐ PASS ☐ FAIL
5. Select **Every N days**, set N = 3, and Generate.
6. **Expected:** An N input appears only for this option, and preview dates are 3 days apart. ☐ PASS ☐ FAIL
7. Select **Every school day** and Generate.
8. **Expected:** Behaves exactly as before (one per Mon–Fri school day). ☐ PASS ☐ FAIL

---

## Wave 3 — Link resources to a course

Covers `23cd6909` (/settings).

> "...It would be helpful if you could link the course with a specific resource from the resources page."

**Precondition:** Signed in to a household with at least one course and at least two resources.

1. Go to **Settings → Courses** and edit a course.
2. **Expected:** A **Linked resources** picker shows the household's resources and lets you select more than one. ☐ PASS ☐ FAIL
3. Link one resource and save.
4. **Expected:** The courses table shows the course has "1 resource linked". ☐ PASS ☐ FAIL
5. Edit again and link a second resource; save.
6. **Expected:** The courses table shows "2 resources linked". ☐ PASS ☐ FAIL
7. Unlink both resources and save.
8. **Expected:** The course shows "No resources linked". ☐ PASS ☐ FAIL
9. Confirm unlinking a resource from a course did **not** delete the resource itself (it still exists on the Resources page). ☐ PASS ☐ FAIL

---

## Wave 4a — Attendance notification clears after logging

Covers `9937be68` (/dashboard).

> "I saw the notification that I hadn't logged attendance today, so I clicked on the link and logged attendance, but the notification is still there."

**Precondition:** Signed in to a household that has **not** logged attendance for today. (If attendance is already logged, void it or use a learner with no record today.)

1. Open the **Dashboard** (`/dashboard`).
2. **Expected:** A "needs attention" notification about attendance not being logged today is shown. ☐ PASS ☐ FAIL
3. Click the notification's link and log attendance for the learner on the Attendance page.
4. Return to the **Dashboard**.
5. **Expected:** The "attendance not logged today" notification is **gone** for that learner (and gone entirely if it was the last learner missing). ☐ PASS ☐ FAIL
6. (Edge check) If your household spans a timezone where "today" could differ between your device and the server, confirm the alert still clears — this is the specific failure mode being fixed. ☐ PASS ☐ FAIL ☐ N/A

---

## Wave 4b — "Set up your household" is a clickable link

Covers `9bb8370e` (/dashboard).

> "At the top of the dashboard it says 'Set up your household.' It would be helpful to have a clickable link that takes you to that page."

**Precondition:** Signed in to a household where the "Set up your household" prompt is shown (i.e. setup is incomplete). *Note: the destination may be a dedicated setup page or the Settings page depending on the implementation choice — either is acceptable as long as it lands on the household setup form.*

1. Open the **Dashboard** (`/dashboard`).
2. **Expected:** The "Set up your household" prompt shows a clickable link / "Go →" affordance. ☐ PASS ☐ FAIL
3. Click it.
4. **Expected:** It navigates to the household setup page and the setup form is visible without extra clicks. ☐ PASS ☐ FAIL
5. Complete household setup.
6. Return to the Dashboard.
7. **Expected:** The "Set up your household" prompt no longer appears. ☐ PASS ☐ FAIL

---

## Sign-off

| Wave | Item(s) | Result | Notes |
|---|---|---|---|
| 1a | `50774221`, `fcee6fd0` | ☐ PASS ☐ FAIL | |
| 1b | `e534c6cc` | ☐ PASS ☐ FAIL | |
| 2a | `80f04cd0` | ☐ PASS ☐ FAIL | |
| 2b | `3c4cc9a2` | ☐ PASS ☐ FAIL | |
| 3 | `23cd6909` | ☐ PASS ☐ FAIL | |
| 4a | `9937be68` | ☐ PASS ☐ FAIL | |
| 4b | `9bb8370e` | ☐ PASS ☐ FAIL | |

All items must PASS before the corresponding feedback rows are marked resolved.
