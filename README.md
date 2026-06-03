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


## What this is not

**Not a chore tracker.** Household tasks and school records should not share a system. The software ends at the school day.

**Not a piety scoreboard.** Formation, adab, and spiritual growth are not metrics. They are not tracked, scored, compared, or displayed.

**Not an AI-first planner.** AI may support planning eventually — as a bounded, parent-approved assistant. Not as an autonomous scheduler making decisions without the parent in the room.

**Not a generic tool with Islamic labels.** The data model has room for Muslim subjects at its core. This is an architectural decision made at the start, not an add-on made later.

---

## What's built

**Foundation**  
Household workspace, child profiles, subject and course setup per child, school year with breaks, authenticated sign-in (magic-link, Google, Facebook), household settings.

**Planning**  
Weekly planner with forward/backward navigation, lesson and task creation, daily and weekly lesson list views, lesson status (not started, completed, skipped), reschedule and move, recurring weekly patterns, today's lessons card on the dashboard.

**Records**  
Attendance by child and date (present, absent, partial, with optional hours), attendance summary with missing-day detection, progress by subject, completed lesson history with filters.

**Portfolio and proof**  
Evidence items — title, child, subject, date, type (text, URL, file/photo), parent reflection. Evidence linked to lessons. Portfolio list with filters. Records report combining attendance, lessons, and portfolio counts. Records review checklist.

**Quran sessions**  
Quran session log with surah, ayah range (from/to), session type, and date. Dashboard chart of weekly Quran activity. Session history per child.

**Alerts and Islamic calendar**  
Alert rules engine — surfaces slippage, attendance gaps, and overdue Quran. Islamic calendar overlay with Hijri dates and Ramadan awareness.

**Dashboard**  
Composable widget dashboard — today's lessons, attendance summary, progress by subject, Quran activity chart, active alerts. Child selector persists across the session.

---

## Known gaps

- No email allow-list — any address can sign in; user-to-household invite flow not yet built
- No student portal — students cannot see their own task list or mark their own work
- Limited validation and error boundaries throughout
- No accessibility audit

---

## Architecture

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Postgres (Drizzle ORM)  
**Deployment:** Render  
**Auth:** Auth.js (NextAuth v5) with Drizzle adapter — magic-link, Google, Facebook

**Data chain:** `user` → `workspace` → `household_profile` → `student_profile` → `subject_course` → `lesson_task` / `attendance_record` / `evidence_item` / `quran_session`

**Feature structure:** Each domain owns its API router, server service, repository, context provider, and tests. The dashboard composes widgets from feature contexts — it does not own data.

> **Developer guide:** conventions, TDD rules, testing patterns, architecture rules, and the full troubleshooting reference live in [`CLAUDE.md`](./CLAUDE.md) and [`docs/`](./docs/).

---

## Quick start

```bash
npm install
npm run setup-hooks          # installs pre-commit version bump hook
cp .env.example .env.local   # fill in AUTH_SECRET, DATABASE_URL, RESEND_API_KEY
npm run db:migrate           # apply schema to your Postgres instance
npm run db:seed:demo         # optional: two demo households with 150 days of history
npm run dev                  # http://localhost:3000
```

```bash
npm test                     # Jest unit + integration
npm run test:e2e             # Playwright e2e (requires built app + DATABASE_URL)
npm run build && npm run start
```

Smoke check: `GET /api/health` → `200 { status: "healthy" }`.

---

## Status

Live: [sheathacademy.onrender.com](https://sheathacademy.onrender.com)

The family on the dashboard is real. The pains are real. The build is one feature at a time.
