# Dashboard redesign — discussion handoff (2026-07-07)

Working doc to resume the dashboard rethink after a `/clear`. This is a **design discussion**, not yet an approved plan. Source of truth for the current layout: `features/dashboard/front/pages/Dashboard.tsx`.

---

## The job of the dashboard

Per `architecture-rules`, Home **composes Today-facing data** — it owns no business logic, it surfaces other features. It should answer three questions at a glance:

1. **What's happening today?** (schedule, what to start)
2. **Are we okay?** (on-track / proof / compliance)
3. **What needs *me*?** (the one list a parent acts on)

Current failure: it's a **pile of ~10 cards in two rigid rails**, and "what needs me" (`NeedsAttention`) is buried 4th in a column. Two concrete UI bugs feed the "wonky" feel:
- **Compounding padding** — hero `pb-6` + insights `py-6` + `RecordsProof`'s own nested `<section py-10 pb-16>` = a big dead gap between the schedule block and the records block.
- **Unbalanced rails** — left is one tall panel, right stacks 4 cards; CSS grid makes the row as tall as the taller side, so the right column reads as an endless column with whitespace opposite it.

---

## CURRENT dashboard (as built)

```
┌──────────────────────────────────────────────────────────────┐
│ NextSetupStrip (conditional)                                   │
│ DashboardHeader  [date picker]                    [alerts 🔔]  │
├──────────────────────────────────────────────────────────────┤
│ TodayTaskSummaryCards            (full width)                  │
├───────────────────────────────────────┬──────────────────────┤
│ HERO GRID (lg:grid-cols-3)            │  aside (right rail)   │
│                                        │                      │
│  TodaySchedulePanel   (col-span-2)     │  PersonalAssistant   │
│                                        │  LearningTimeEntry   │
│                                        │  PersonalTodoList    │
│                                        │  NeedsAttention  ⬅ buried
│                                        │  (4 stacked cards →  │
│                                        │   column runs long)  │
├───────────────────────────────────────┴──────────────────────┤
│ "MORE INSIGHTS" SECTION (lg:grid-cols-3)                       │
│                                        │                      │
│  RecordsProof  (col-span-2)            │  SchoolYearProgress  │
│  ⬅ renders its OWN full section        │  QuranStreak         │
│     with py-10 pb-16 (double pad)      │  IslamicCalendar × N │
├──────────────────────────────────────────────────────────────┤
│ worklog (tiny footer link)                                     │
└──────────────────────────────────────────────────────────────┘
```

### Current widget inventory + verdict
| Widget | Verdict | Why |
|--------|---------|-----|
| TodayTaskSummaryCards | Keep | core "today" glance |
| TodaySchedulePanel | Keep | the spine of Today |
| NeedsAttention | **Keep + promote** | this *is* question 3 — should be the anchor, not buried |
| SchoolYearProgressCard | Keep | clean "are we on track" |
| RecordsProof | **Split** | weekly proof counts (keep) + heavy export/print launcher (move to /records) |
| PersonalAssistantPanel | **Prove-it-or-cut** | valuable only if the insight is real; if it restates counts it's noise |
| LearningTimeEntry | **Merge** | "Start learning time" is a button, not a card → fold into schedule |
| PersonalTodoList | Demote | useful but not "today's learning" → lower band |
| QuranStreak | Keep | identity + engagement |
| IslamicCalendarCards | Keep, banded | low-frequency; small band item |

---

## Features that SHIPPED but have no Home surface (the opportunity)

| Feature | Route | Dashboard move |
|---------|-------|----------------|
| **Compliance** (green/yellow/red + deadlines) | /compliance | **NEW "Compliance status" card** — highest-value add; answers "are we okay?" |
| **Gradebook** needs-attention (missing work, decaying skills) | /growth/gradebook | **Feed into NeedsAttention**, not a new card |
| **Badges** (recent awards) | /growth/badges | Optional small "recent wins" in Growth band (delight; low priority) |
| **Reminders** (planned feature) | (new) | Needs a Home surface — slots into Attention / a band |

Full route list confirmed from `features/layout/lib/navConfig.ts`: Home, Planbook (Calendar, Lesson Planner, Lessons, Resources, Quran), Records (Attendance, Reports), Growth (Portfolio, Gradebook, Badges), Compliance, People, Messages, Learning Time (via dashboard entry).

---

## PROPOSED dashboard — three honest zones

Each zone answers one of the three questions. Fewer, sharper cards; balanced widths; no compounding padding.

```
┌──────────────────────────────────────────────────────────────┐
│ DashboardHeader  [date picker]                    [alerts 🔔]  │
├──────────────────────────────────────────────────────────────┤
│ ZONE A — TODAY                                                 │
│  TodayTaskSummaryCards                       (full width)      │
│  ┌───────────────────────────────┬───────────────────────┐    │
│  │ TodaySchedulePanel            │  ATTENTION HUB         │    │
│  │  (with ▶ Start learning-time  │  (promoted NeedsAttn)  │    │
│  │   button merged in)           │  • overdue lessons     │    │
│  │                               │  • attendance gaps     │    │
│  │                               │  • gradebook flags     │    │
│  │                               │  • compliance due      │    │
│  │                               │  • upcoming reminders  │    │
│  └───────────────────────────────┴───────────────────────┘    │
├──────────────────────────────────────────────────────────────┤
│ ZONE B — PER-LEARNER COMMAND CENTER            (full width)    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Amina   att 96% · 3/4 today · grade ↗ · compliance ●    │   │
│  │ Yusuf   att 88% · 2/5 today · grade → · compliance ●    │   │
│  │ …one compact row per learner ("where is each learner")  │   │
│  └────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│ ZONE C — PROOF & PROGRESS      (responsive band, balanced)    │
│  ┌────────────┬────────────┬────────────┬────────────┐        │
│  │ SchoolYear │ Compliance │ Records    │ Quran      │        │
│  │ Progress   │ status NEW │ proof(slim)│ Streak     │        │
│  └────────────┴────────────┴────────────┴────────────┘        │
│  ┌────────────┬────────────┐                                   │
│  │ Badges     │ Islamic    │  (+ Personal To-dos, demoted)     │
│  │ (optional) │ Calendar   │                                   │
│  └────────────┴────────────┘                                   │
└──────────────────────────────────────────────────────────────┘
```

### Headline changes
1. **Promote NeedsAttention → cross-feature "Attention Hub"** (the single most valuable change). Aggregates overdue lessons + attendance gaps + gradebook flags + compliance deadlines + reminders — by **reading each feature's service** (dashboard composes, never computes).
2. **Add a Compliance status card** — new shipped feature, currently zero Home presence.
3. **Add a per-learner command-center row** — the "where is each learner at" glance both the gradebook and compliance briefs asked for ("one living record").
4. **Cut/merge clutter** — LearningTimeEntry → a button on the schedule; RecordsProof export → link to /records; Todos + Islamic → demoted band.
5. **Fix the mechanics** — remove RecordsProof's nested section padding; replace rigid 2-col rails with balanced bands so no column runs endlessly.

---

## Open questions / before building
- **Service-surface audit (first plan step):** confirm each feature (attendance, plan, gradebook, compliance, reminders) exposes a service the dashboard can read for the Attention hub + learner row + compliance card — so Home stays a composer and grows no business logic.
- **Assistant panel:** verify whether `PersonalAssistantPanel` produces a distinct insight or just restates counts → keep vs cut.
- **Scope:** this is now a **Mode 3/4 redesign**, not the earlier "tighten + rebalance." Bigger than a spacing fix.
- **Build vs prototype-first:** option to prototype the three-zone layout as a visual artifact for reaction before committing to the full plan.

## Decisions already made in discussion
- Layout direction the user first picked (before going deeper): "Tighten + rebalance." The three-zone redesign is the expanded version of that.
- Learning-time feedback `66087f44` ("select by course not just learner"): **largely already satisfied** — NowCard already lets you pick Subject + Lesson (learner-scoped); only a course-first entry axis is missing → low priority.

## Next step
Turn the chosen direction into a proper plan (service-surface audit → three-zone IA → Attention hub → Compliance card → learner row → the cuts) with a measured-rate estimate — OR prototype the layout as an artifact first.
