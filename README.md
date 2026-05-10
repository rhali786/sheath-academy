# Sheath Academy

**Homeschool management software built for Muslim families.**

There are over 158 homeschool management tools. None of them were built for this family.

The existing options are either generic American homeschool planners with an Islamic skin applied at the surface, Christian curriculum systems that treat faith as the organizing logic, or madrasah management tools designed for classrooms, not households. A Muslim family homeschooling three children — with Quran at the center, Arabic as a real subject, Islamic Studies woven through the week, and a school rhythm that pauses for Ramadan — cannot run their household on any of these without fighting the software every day.

Sheath Academy is built for that household. Not adapted for it. Built for it.

---

## The moat

**Every other tool treats Quran, Arabic, and Islamic Studies as renamed folders in a generic gradebook. We treat them as what they actually are.**

A Quran session is not a homework assignment. It has a surah, an ayah range, a session type — new memorization, revision, recitation — and a last-reviewed date that determines what should happen next. That logic cannot live in a notes field. It needs its own data structure. The same is true for Arabic, where skill progression follows a different shape than Western literacy. The same is true for Islamic Studies, where formation and understanding matter more than test scores.

No competitor has built this. Most never will, because their user base doesn't need it and retrofitting it would require rethinking the data model from scratch. We started from scratch.

The second part of the moat is discipline. Generic tools drift. They add chore tracking, piety metrics, behavior point systems, AI planners that make decisions without the parent. Each of those features sounds reasonable and each of them erodes the trust of the exact family this software serves. We have explicitly refused all of them — not as a product limitation, but as a design conviction. That refusal is legible to Muslim parents in a way that no amount of marketing can replicate.

---

## The North Star

> **Reduce the invisible operational burden on the parent so they can actually be present for the learning.**

The hardest part of homeschooling is not teaching. It is running a school. Keeping attendance, tracking what happened, proving it happened, knowing what didn't happen and when to worry, repairing the plan when life interrupts, and doing it all again next week. That burden is mostly invisible — it accumulates in the background until it weighs enough to make the whole thing feel unsustainable.

Sheath Academy carries that weight so the parent doesn't have to.

The measure of success is not feature count. It is whether a parent ends the school week calmer and more confident than they started it.

---

## What hurts — the pains this software was built to relieve

These are not invented personas. They are documented, lived experiences extracted from real homeschool families and cross-referenced against how 158 competing tools fail to address them.

---

**A mother is up at midnight the night before her annual homeschool review. She opens three apps, a spreadsheet, and a notebook. She cannot account for three weeks in February. She knows the learning happened. She cannot prove it.**

This is the central pain. Records scattered across systems — attendance in one place, lesson notes somewhere else, portfolio photos on a phone, grades half-entered in a spreadsheet — don't just create inconvenience. They create a low-grade anxiety that sits underneath every school week. The system exists to make that moment impossible.

---

**Sunday evening. The plan for the week has to be rebuilt from memory because last week's plan didn't survive contact with Tuesday.**

Most homeschool parents reconstruct their week from scratch every Sunday. The previous week's plan is a memory, not a starting point. Subject rhythms, recurring lessons, and weekly structures should persist without manual rebuilding. When a sick day or a field trip pulls a child off schedule, the repair should take two decisions, not twenty.

---

**A father realizes his son has been quietly behind in math for six weeks. Nothing flagged it. There was no moment where the system said: something is wrong here.**

Progress slippage in homeschool is invisible by default. Without a system that tracks completion against plan, a child can fall behind in a subject and the gap only becomes visible when it's large enough to feel like a failure. The system should surface slippage when it's small, not after it compounds.

---

**A parent in a portfolio-review state spends the last week of the year turning a year of learning into evidence, instead of reflecting on it.**

Attendance logs are records. A portfolio — photos of completed work, written reflections, Quran recitation notes, project documentation — is proof of learning. The difference matters to reviewers, to future schools, and to the family's own sense of what they built. Evidence capture should happen in the moment, not in a retrospective panic.

---

**A Quran teacher asks how Adam is progressing with Al-Mulk. The parent opens a notes app with three bullet points and a feeling.**

Quran tracking done wrong is worse than not tracking at all. A generic notes field loses the session structure that makes hifz progress legible — which ayahs were revised, how long since last review, whether this was new memorization or consolidation. Without that structure, "tracking" is just a log of dates. The system stores what actually matters.

---

**A parent downloads a well-reviewed homeschool app. It has streak counters for prayer, virtue points for good behavior, and a leaderboard for Quran memorization. She closes it and doesn't return.**

This is the design failure we are explicitly built to avoid. Quantifying spiritual practice — turning salah into a streak, adab into a score, memorization into a competition — creates comparison pressure, performative worship, and anxiety in children at the ages when their relationship with their deen is being formed. This software does not do that. Not as an oversight. As a commitment.

---

## The features — Wave 1 (Homeschool MVP)

Built in dependency order. Each wave is a working, usable product before the next begins.

### Wave 1A — Foundation
*The skeleton everything else attaches to.*

- Parent account and household workspace
- Child profiles — name, grade, active status
- Subject and course setup per child
- School year with start date, end date, active year
- Dashboard shell with guided setup prompts
- Child selector that persists across the session

### Wave 1B — Planning spine
*The plan that survives real life.*

- Weekly planner with forward and backward navigation
- Lesson and task creation — child, subject, date, notes, resource link
- Daily and weekly lesson list views
- Lesson status — not started, completed, skipped, moved — with timestamps
- Move and reschedule a lesson, with original position in history
- Recurring weekly pattern by weekday and subject
- Today's lessons card on the dashboard

### Wave 1C — Records spine
*Proof that school happened.*

- Attendance by child and date — present, absent, partial
- Optional hours and minutes per attendance entry
- Attendance summary with missing-day detection
- Progress by subject — completed, planned, and skipped counts
- Completed lesson history with date and subject filters
- Progress and attendance cards on the dashboard

### Wave 1D — Proof and export
*The confidence layer.*

- Portfolio evidence — title, child, subject, date, type, parent reflection
- Add evidence and attach it to the lesson it came from
- Text, URL, and file or photo evidence capture
- Portfolio list with filters by child, subject, and date
- Records report — attendance, lessons, and portfolio count in one view
- Export and print records summary
- Records review checklist — flags missing attendance, uncovered subjects, and evidence gaps

---

## What Wave 1 does not yet address

**Child-fit planning** — The planner organizes by child and subject. It does not yet respond to the child's pace, level, or needs. Every child gets the same structure with different labels. This is the most significant gap, and the most likely reason a parent eventually wants more. Wave 2 addresses it.

**Native Quran data structure** — Wave 1 attendance covers Quran sessions as a record. Native fields — surah, ayah range, session type, revision cycle — are Wave 2B. This is the primary differentiation and should follow Wave 1 closely.

**Student-facing experience** — The Wave 1 lesson list is parent-operated. Students cannot see their own task list or mark their own work. The student portal is Wave 2A.

**Alerts and notifications** — Intentionally absent. Alerts built before the core records are trusted become noise before they become useful.

---

## What this is not

**Not a chore tracker.** Household tasks and school records should not share a system. The software ends at the school day.

**Not a piety scoreboard.** Formation, adab, and spiritual growth are not metrics. They are not tracked, scored, compared, or displayed.

**Not an AI-first planner.** AI may support planning eventually — as a bounded, parent-approved assistant. Not as an autonomous scheduler making decisions without the parent in the room.

**Not a generic tool with Islamic labels.** The data model has room for Muslim subjects at its core. This is an architectural decision made at the start, not an add-on made later.

---

## Architecture

**Stack:** Next.js · TypeScript · Tailwind CSS · Postgres  
**Deployment:** Render

**Data chain:** `user_account` → `workspace` → `household_profile` → `student_profile` → `subject_course` → `lesson_task` → `attendance_record` → `evidence_item`

**Feature structure:** Each domain owns its own API router, context provider, and data table. The dashboard composes widgets from features — it does not own data.

> **Technical deep dive:** conventions, testing rules, local dev gotchas, and the full troubleshooting guide live in [`CLAUDE.md`](./CLAUDE.md).

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run dev:clean    # if /_next/static/* 404s: wipes .next then restarts
npm test             # Jest (API + UI integration)
npm run build && npm run start   # production locally
```

Smoke check: `GET /api/health` → `200` and `status: "healthy"`.

---

## Status

Wave 1A–1D: **In progress**  
Live: [sheathacademy.onrender.com](https://sheathacademy.onrender.com)

The family on the dashboard is real. The pains are real. The build is one feature at a time.
