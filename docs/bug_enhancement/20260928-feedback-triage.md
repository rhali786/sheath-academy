# Feedback triage — 2026-09-28

**Source:** production `user_feedback` (Oregon / `sheath_academy`), 85 rows total.
**Backup taken first:** `backups/prod-2026-09-28T04-03-39/` — 31 tables, 39 migrations, read-only export, no errors.

| status | count |
|---|---|
| shipped | 46 |
| **submitted (this batch)** | **27** |
| in_pr | 6 |
| cancelled | 4 |
| reviewed | 2 |

All 27 `submitted` rows are unclassified (`feature_area`/`feedback_type`/`risk_level` all null). They span **2026-08-04 → 2026-08-31**, from a single active household (Naeem). Sentiment skews positive, but **6 are explicitly flagged "Blocker"** by the user in the message text — those are the real signal, not the sentiment field.

---

## Verified against current code (before planning)

Four claims checked against `master`, because they change scope materially:

1. **Bulk lesson shift / break-aware reschedule — NOT BUILT.** `SchoolYear.breaks` (jsonb, `db/schema.ts:187`) is modeled and has entry UI (`school-year/front/components/SchoolYearCard.tsx`, `lib/calculateDays.ts`). But the only rescheduling that exists is per-lesson drag (`plan/front/components/WeekGrid.tsx`) and a same-day `reschedule-unfinished` reflow (`schedule/types.ts:20`). **Nothing shifts a date range across learners.** This is the #1 ask — 3 separate blockers.
2. **`recurringSchedule` exists but is orphaned.** Added by `97f6ee0` on `SubjectCourse` (`db/schema.ts:222`). Consumed *only* by `learning-time/front/components/QuickStartByCourseList.tsx`. **It does not reach the `schedule` or `lessons` features at all** (grep: zero hits). So "set Math to 10:15 repeating and see it on the schedule" is half-built — the data model landed, the wiring did not.
3. **`/learning-time` is unreachable from navigation.** The route exists (`app/(shell)/learning-time/page.tsx`) but has **no entry in `NAV_ITEMS`** (`features/layout/lib/navConfig.ts`). An entire feature is orphaned. One-line fix.
4. **Nav IA was reworked** since item [1] was filed — "Plan" is now `Planbook › Lesson Planner`. That half of the complaint is resolved; the Learning Time half (#3) is not.

---

## Themes

### A. Break scheduling & bulk shift — 3 blockers, highest priority
| # | id | page | ask |
|---|---|---|---|
| 18 | `b8be399a` | /plan | shift entire school year around break times |
| 26 | `ef9163fd` | /plan | schedule breaks/holidays; free the schedule for sick days |
| 27 | `03a84383` | /plan | shift all coursework for all learners by a week; pre-schedule breaks |

Same feature, filed three times over three weeks, escalating (`poor` → `poor` → `bad`). Breaks are already modeled; the missing piece is the **reschedule engine** — which is the risk-heavy part. Needs its own design pass, not a quick fix.

### B. Recurring lesson times & repeat-across-range — 2 blockers
| # | id | page | ask |
|---|---|---|---|
| 19 | `5116ae4f` | /dashboard | set a time that auto-applies to every lesson of a course (Math 10:15 daily) |
| 20 | `fe487c22` | /dashboard | generate lessons over a date range with a weekly repeat pattern |
| 13 | `4ee15e76` | /dashboard | can't find how to set duration / start & end time |

Item 19 is mostly **wiring `recurringSchedule` through to the schedule** (see finding #2) — smaller than it looks. Item 20 is genuinely new generation logic. Item 13 may be pure discoverability once 19 lands.

### C. Lessons page is unusable at full-year scale — 4 items
| # | id | ask |
|---|---|---|
| 7 | `78b91193` | multi-select lessons for bulk delete; filter by class |
| 22 | `a69015d2` | filters / sorting once a full year × multiple learners is loaded |
| 25 | `04a1beb3` | add "overdue" to the status filter dropdown |
| 8 | `ef210b99` | clicking a lesson name opens the page, not that lesson |

Item 25 is a near-trivial win. 7 and 22 are the same underlying need (filter + bulk ops).

### D. Gradebook missing courses — 1 blocker, screenshot-confirmed
| # | id | ask |
|---|---|---|
| 14 | `7f96d574` | courses missing for some learners (screenshot) |
| 23 | `38c77fc2` | same, + attach grades to actual scheduled lessons rather than free-entry |

**Screenshot confirms it:** Samura shows 2 courses in Gradebook; the Settings screenshot from the same session shows her linked to more. This is a real data/query bug, not a misunderstanding. The grade-per-lesson half of 23 is a separate feature.

### E. Settings edit modal can't scroll — screenshot-confirmed, cheap fix
| # | id | ask |
|---|---|---|
| 6 | `bdaa53a4` | edit popup stretches, can't scroll or see top/bottom |
| 16 | `f5b49b97` | screenshot of the same |

**Screenshot confirms it:** the "Linked resources" checkbox list renders unbounded, pushing the modal past both viewport edges with no internal scroll. Contained CSS fix (`max-height` + `overflow-y-auto` on the modal body). Highest value-to-risk ratio in the batch.

### F. Learner accounts & permissions — includes one security-shaped item
| # | id | ask |
|---|---|---|
| 5 | `52f1ac5b` | learner login won't enable — clicked enable, saved, still shows disabled; login fails |
| 11 | `9e850827` | **students have full permissions** — can add courses, edit grades, archive other students |
| 12 | `87ad02f0` | let students self-report Quran progress |

**Item 11 deserves attention out of band.** Students being able to see and edit other students' grades is a data-exposure issue, not an enhancement. Item 5 is a straight bug.

### G. Navigation — 2 items, one is a one-liner
| # | id | ask |
|---|---|---|
| 1 | `ec67f864` | no way to reach "Plan" / "Learning Time" |
| 21 | `f98e0c6e` | Calendar leaves the tab set while Weekly Planner / Planning Matrix stay in it |

Per finding #3/#4: half of 1 is already fixed; the Learning Time nav entry is a one-line add. Item 21 is a real IA inconsistency — Calendar is a nav-level route (`/plan/schedule`) while its siblings are tabs on `/plan`.

### H. Resources & school-year rollover — 3 items
| # | id | ask |
|---|---|---|
| 2 | `fde7a084` | can't delete outdated resources; last year's material persists; no year reset |
| 3 | `cc2b557e` | *user's own correction to 2* — lessons didn't roll over, they were just incomplete and still listed |
| 17 | `31b0a814` | pick a start date when generating lessons (two books across one year) |

Item 3 narrows item 2 considerably — read them together. The surviving ask in 2 is **resource deletion** + a year-rollover story.

### I. Badges — 2 items, partly shipped
| # | id | ask |
|---|---|---|
| 10 | `74a79d58` | upload badge images from computer; distinctive default badges |
| 15 | `e41b3d34` | "platform badges" checkbox does nothing visible |

`3bf2fff` added custom badge images — **item 10 may already be satisfied; verify before planning.** Item 15 is a small clarity fix.

### J. Later / not this batch — 3 items
| # | id | ask |
|---|---|---|
| 4 | `31d88e3a` | remind me to buy the next book as a resource nears its end |
| 9 | `296863b7` | dashboard widget mockup (screenshot) + drag-drop screenshots into feedback |
| 24 | `c3406ebb` | customize home page — colors, backgrounds, movable widgets |

All three are speculative/"eventually" framing from the user. Item 24 overlaps the existing three-zone dashboard redesign already in `docs/`.

---

## Suggested sequencing

**Wave 1 — cheap, contained, high confidence.** E (modal scroll), G (Learning Time nav entry), C-25 (overdue filter), I-15 (badge checkbox). Small, isolated, each independently testable.

**Wave 2 — real bugs.** D-14 (gradebook missing courses), F-5 (learner login), F-11 (student permissions — possibly ahead of everything if you read it as data exposure).

**Wave 3 — the loud blockers.** A (break shift engine) and B (recurring times). A needs a design spike first; B-19 is mostly wiring already-landed data through.

**Deferred.** C-7/22 (filters + bulk ops), D-23 (grade-per-lesson), H (rollover), J.

---

## Open questions

1. **Item 11 (student permissions)** — do you want that pulled out of the batch and handled first? It reads as data exposure between learners in a shared household.
2. **Item 10 (badge upload)** — does `3bf2fff` already cover it? If so it closes with no code.
3. **Uncommitted `learning-time` work** currently in the tree (`schoolYearLoaded` gate in `LearningTimePage.tsx` + test) — commit, stash, or leave? Wave 1 touches nav config, not that file, so it's not blocking, but it should be resolved before we branch.
4. **Steward vs. manual.** The `sacad` dev DB (`DATABASE_URL`) is **unreachable — ECONNRESET on every attempt**, which is likely why `steward:*` has been unusable. Running `steward:daily` against prod would write classification columns to the production table. Given this batch is already triaged by hand above, the steward buys us little; recommend building the plan with `/plan-builder` instead.
