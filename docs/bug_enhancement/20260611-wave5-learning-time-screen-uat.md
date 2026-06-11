# UAT: Wave 5 Phase 1 — Learning Time Screen (core session + single-learner cockpit)

User acceptance tests for **Phase 1** of the Learning Time Screen, addressed in `20260611-wave5-learning-time-screen-plan.md` (production feedback `46a51bee`). Written from the **reporting user's perspective** (homeschool parent running a live learning session).

> **Scope note:** Phase 1 is the time-only MVP for a *single learner at a time*. The original brief's task channel, mixed mode, multi-learner cockpit, lens switching, embedded resource viewer, and multi-actor roles are **Phases 2–6** and are intentionally NOT testable here. Tests below cover only what Phase 1 ships:
>
> > "Build a dedicated 'Learning Time Screen' that runs active learning sessions in real time... It must work for time-based... sessions, while producing a trustworthy session record for later review."

**How to use:** Run each test on the deployed preview (or production after release) signed in to a real household with at least one learner. Mark **PASS** only if the *Expected result* is met exactly. If a test fails, note what actually happened.

**Environment:** ____________________  **Version:** ____________  **Tester:** ____________  **Date:** ____________

---

## T1 — Entry point from the dashboard

1. Open the **Dashboard** (`/dashboard`).
2. **Expected:** A "Start Learning Time" entry point / module is visible. ☐ PASS ☐ FAIL
3. Click it.
4. **Expected:** You land on the Learning Time page (`/learning-time`). ☐ PASS ☐ FAIL

---

## T2 — Idle state and "Next" preview

**Precondition:** A learner who has at least one lesson due today (create one via the planner first if needed), and a second learner with **no** lesson due today.

1. On `/learning-time`, select the learner who has a lesson due today.
2. **Expected:** The learner's **Now card** shows an idle state ("Idle — awaiting assignment" or similar) with a **Next** line previewing today's next lesson (its title). ☐ PASS ☐ FAIL
3. Select the learner with no lesson due today.
4. **Expected:** The Now card shows the idle state with "Nothing assigned now" and **no** Next line. ☐ PASS ☐ FAIL

---

## T3 — Configure and start a Timer (countdown) session

**Precondition:** A learner selected, idle.

1. From the idle Now card, click **Start session** (or equivalent).
2. **Expected:** A configuration step lets you optionally link today's lesson (or choose "Ad-hoc"), optionally pick a subject, and choose a time-channel type. ☐ PASS ☐ FAIL
3. Choose **Timer**, set the target to **5 minutes**, optionally link the shown lesson.
4. Click **Start**.
5. **Expected:** The Now card switches to a running state showing a countdown that decreases from 5:00. ☐ PASS ☐ FAIL

---

## T4 — Pause and resume

**Precondition:** A Timer or Stopwatch session running (from T3).

1. Click **Pause**.
2. **Expected:** The time display stops changing. ☐ PASS ☐ FAIL
3. Click **Resume**.
4. **Expected:** The time display continues from where it paused (does not reset, does not jump ahead by the paused duration). ☐ PASS ☐ FAIL

---

## T5 — Finish manually and finalize with an outcome

**Precondition:** A session running (from T3/T4), before the timer reaches zero.

1. Click **Finish**.
2. **Expected:** The card moves to an "ended" state showing a fast summary step with an outcome choice (Complete / Partial / Abandoned) and an optional notes field. ☐ PASS ☐ FAIL
3. Choose **Partial**, type a short note, and click **Save**.
4. **Expected:** The session shows as finalized; a "Start another session" affordance returns the card to idle. ☐ PASS ☐ FAIL

---

## T6 — Mid-session refresh restores state (server-authoritative time)

This is the key trustworthiness check — elapsed time must come from the server, not the browser.

**Precondition:** A learner selected, idle.

1. Start a new **Stopwatch** session and let it run for at least ~30 seconds.
2. Note the elapsed time shown.
3. **Reload the page** (full browser refresh) while the session is running.
4. **Expected:** After reload, the same session is still shown as running, and the elapsed time is correct (roughly the noted value plus the reload delay) — **not** reset to zero and **not** wildly off. ☐ PASS ☐ FAIL

---

## T7 — Stopwatch (count-up) session

**Precondition:** A learner selected, idle.

1. Start a session, choosing **Stopwatch**.
2. **Expected:** The time display counts **up** from 0:00, and there is no countdown target. ☐ PASS ☐ FAIL
3. Click **Finish**, choose an outcome, Save.
4. **Expected:** Finalizes the same way as the timer session. ☐ PASS ☐ FAIL

---

## T8 — Scheduled window session (no pause)

**Precondition:** A learner selected, idle.

1. Start a session, choosing **Scheduled window**, and set a start/end clock time.
2. **Expected:** The card shows progress through the scheduled window. ☐ PASS ☐ FAIL
3. **Expected:** Pause/Resume is **not** offered for a scheduled-window session (matches the brief: a scheduled window completes when the window ends). ☐ PASS ☐ FAIL

---

## T9 — One active session per learner

**Precondition:** A learner with a session already running (start one if needed).

1. With that learner's session running, attempt to start a second session for the **same** learner.
2. **Expected:** The app does not allow two simultaneous active sessions for one learner — you are directed to the running session (resume/finish) rather than creating a parallel one. ☐ PASS ☐ FAIL

---

## T10 — Dashboard reflects an active session

**Precondition:** A session currently running for some learner.

1. Navigate back to the **Dashboard** (`/dashboard`).
2. **Expected:** The Learning Time module indicates a session is in progress (e.g. "Resume session — <learner>, <elapsed>") and links back into the cockpit. ☐ PASS ☐ FAIL

---

## T11 — Empty / no-learner state

**Precondition:** (If feasible) a household with no learners, or otherwise confirm graceful handling.

1. Open `/learning-time` for a household with no learners.
2. **Expected:** A clear empty-state message is shown (no crash, no blank screen). ☐ PASS ☐ FAIL ☐ N/A

---

## Out of scope for this UAT (do not test — later phases)

- Task checklists/counters, mixed time+task sessions, "ended by tasks" (Phase 2)
- Seeing all learners' cards on one screen at once, Dayboard / Now-Next lens switch (Phase 3)
- Opening lesson resources (PDF/video) inside the session without losing state (Phase 4)
- Facilitator/Viewer roles, parent-attention conflict warnings (Phase 5)
- Sessions appearing in Records/Reports, attendance-minute reconciliation, evidence attachment (Phase 6)

---

## Sign-off

| Test | Covers | Result | Notes |
|---|---|---|---|
| T1 | Dashboard entry point | ☐ PASS ☐ FAIL | |
| T2 | Idle + Next preview | ☐ PASS ☐ FAIL | |
| T3 | Timer start | ☐ PASS ☐ FAIL | |
| T4 | Pause/resume | ☐ PASS ☐ FAIL | |
| T5 | Finish + finalize | ☐ PASS ☐ FAIL | |
| T6 | Refresh restores state | ☐ PASS ☐ FAIL | |
| T7 | Stopwatch | ☐ PASS ☐ FAIL | |
| T8 | Scheduled window | ☐ PASS ☐ FAIL | |
| T9 | One active session/learner | ☐ PASS ☐ FAIL | |
| T10 | Dashboard reflects active session | ☐ PASS ☐ FAIL | |
| T11 | Empty state | ☐ PASS ☐ FAIL | |

All applicable tests must PASS before Phase 1 is considered accepted. Phase 1 does **not** resolve feedback `46a51bee` in full — it delivers the MVP slice; the item stays open until the later phases (or is explicitly re-scoped).
