# Sheath Academy — Wave 1 Feature Specification

**Master document for Wave 1 (Homeschool MVP).** This is the consolidated specification — every feature, every pain it addresses, every acceptance criterion, every architectural note, every open question, every design decision required before sprint.

Wave 1 ships the homeschool MVP across four sub-waves: Foundation (1A), Planning Spine (1B), Records Spine (1C), and Proof and Export (1D). After Wave 1, a parent can run a homeschool week from setup through compliance review using only this software.

This document is the source of truth for builds, code reviews, and product decisions in Wave 1. If something is in here, it is the specification. If something is missing, it needs to be answered before that feature's sprint begins.

---

## How to read this document

**Section 1 — Foundations.** The North Star, the moat, the design principles, and the architectural layers Wave 1 sits on.

**Section 2 — The pain landscape.** Every pain Wave 1 addresses, with severity scores, the people who experience them, and the relief mechanism the feature provides. Pains are atomic — each one names one burden.

**Section 3 — The data model.** Every entity Wave 1 introduces, with fields, relationships, access rules, and the build queue rows that touch it.

**Section 4 — The features.** All 35 features, organized by wave (1A → 1B → 1C → 1D). Each feature has its full specification: user story, acceptance criteria, dependencies, t-shirt size, pain mapping with relief mechanism, source rationale, MVP rationale, the entities it touches, and open questions to resolve before sprint.

**Section 5 — Build sequence summary.** A flat ordered list of all 35 features with sizes for sprint planning.

**Section 6 — Cross-cutting concerns.** Things that cut across multiple features and need a unified decision: auth, validation, empty states, mobile behavior, accessibility.

---

# 1. Foundations

## 1.1 The North Star

> **Reduce the invisible operational burden on the parent so they can actually be present for the learning.**

The hardest part of homeschooling is not teaching. It is running a school. The measure of success is not feature count. It is whether a parent ends the week calmer and more confident than they started it.

Every feature in this document is justified against this North Star. If a feature does not reduce parental burden or increase parental confidence, it does not belong in Wave 1.

## 1.2 The moat

**Every other tool treats Quran, Arabic, and Islamic Studies as renamed folders in a generic gradebook. Sheath Academy treats them as what they actually are.**

This is the architectural claim that justifies the project. It informs three Wave 1 decisions:

1. The `subject_course` entity is built with hooks for Muslim-native fields (surah, ayah range, session type, last-reviewed date). These fields are not surfaced in Wave 1 UI but the schema accommodates them so Wave 2B can ship without a migration.
2. No Wave 1 feature creates a streak counter, leaderboard, or comparison metric for any spiritual practice. This is a permanent design discipline, not a Wave 1 omission.
3. The portfolio system is built generic enough to hold Quran recitation evidence, Arabic copywork samples, and Islamic Studies reflections without special-casing — the same evidence model serves all subjects.

## 1.3 Design principles

These are the rules every Wave 1 feature is judged against:

**Parent-controlled, not parent-replaced.** The system never makes decisions on the parent's behalf. AI is not in Wave 1. Auto-scheduling is not in Wave 1. Recommendations are not in Wave 1.

**Records, not surveillance.** This is a school management system. It is not a chore tracker, a behavior monitor, or a household policing tool.

**Confidence, not anxiety.** Every records feature is designed to give the parent quiet certainty that what happened was captured. Compliance features explicitly avoid creating dread.

**Fast entry over rich entry.** A parent will abandon the system if recording attendance takes 30 seconds. PAIN-014 (fast data entry) is a quality gate on every Wave 1 feature, not a separate feature.

**No piety scoreboards.** Spiritual practice is never quantified, ranked, streaked, or compared. This is non-negotiable.

**Defer alerts.** No notification system in Wave 1. Alerts built before records are trusted become noise before they become useful.

## 1.4 Architectural layers

Wave 1 sits on the first six of eight architectural layers. The last two are reserved for later.

**Layer 1 — Identity / Ownership** — *MVP core*  
Includes: User account, parent profile, household workspace, session/auth state.

Why it matters: Everything else needs a secure owner and workspace boundary.

**Layer 2 — Student / Subject Spine** — *MVP core*  
Includes: Child/student profile, subject/course, school year/term.

Why it matters: All learning records attach to a child, subject, and time context.

**Layer 3 — Planner / Task Spine** — *MVP core*  
Includes: Weekly planner, lesson/task object, task status, move/reschedule history, notes/resources.

Why it matters: Planning repair and curriculum-to-work transformation depend on this atomic work object.

**Layer 4 — Records Spine** — *MVP core*  
Includes: Attendance records, optional hours/minutes, progress by subject, completed lesson history.

Why it matters: This relieves record confidence and compliance anxiety.

**Layer 5 — Proof / Portfolio Spine** — *MVP / early*  
Includes: Evidence item, evidence type, file/link/text notes, lesson/evidence relationship.

Why it matters: Proof of learning must be connected to actual work, not a random file bucket.

**Layer 6 — Reports / Export** — *MVP / early*  
Includes: Report view, export job, selected child/year/date range, record checklist.

Why it matters: Records become trustable when they can be reviewed, printed, exported, and checked for gaps.

**Layer 7 — Reusable Roles / Editions** — *Design for later; build later*  
Includes: Role model, institution/workspace modes, class/roster structures.

Why it matters: Needed for full-time school, weekend/madrasah, co-op, tutoring, etc., but not first homeschool build.

**Layer 8 — Guidance / AI / Advanced Intelligence** — *Later; bounded*  
Includes: Rules-based next action, AI planning helper, AI guidance, personalization.

Why it matters: Should sit on top of reliable data, not compensate for missing core workflow.

Layers 1–6 are Wave 1 scope. Layer 7 (Reusable Roles / Editions) and Layer 8 (Guidance / AI / Advanced Intel) are deliberately excluded from Wave 1 to keep the architecture from collapsing under premature complexity.

---

# 2. The pain landscape

Wave 1 directly addresses 29 of the 33 pains in the canon. Each pain below is presented with its severity, frequency, switching pressure, primary user, relief promise, and anti-pattern (the wrong way to relieve it).

**How to read pain scoring.** Each pain has three scores from 1–5:

- **Severity** — how badly it hurts when it occurs
- **Frequency** — how often it occurs
- **Switching Pressure** — how strongly this pain motivates a family to change tools

The combined score (max 15) is a rough priority indicator. Wave 1 prioritized the highest combined scores.

---

## 2.1 Pains addressed by Wave 1

_20 pains, sorted by combined severity + frequency + switching pressure._

### PAIN-003 — Scattered records weaken confidence

**Score: 15/15** · Severity 5 · Frequency 5 · Switching Pressure 5  
**Category:** Records / Operational Confidence  
**Who experiences it:** Homeschool Parent

**The pain.** Parents lose confidence when attendance, grades, notes, portfolios, and completed work are scattered across multiple systems or paper records.

**Relief promise.** Provide one coherent operational record layer.

**Anti-pattern (the wrong way to relieve it).** Overcomplicated systems and fragmented storage

**Wave 1 features that address this pain:**
- #3 — Child profile data model
- #4 — Add/edit child profile
- #8 — Parent dashboard shell
- #25 — Completed lesson history
- #33 — Basic records report view
- #34 — Export records summary

---

### PAIN-018 — Parents need attendance proof

**Score: 15/15** · Severity 5 · Frequency 5 · Switching Pressure 5  
**Category:** Attendance / Compliance  
**Who experiences it:** Homeschool Parent

**The pain.** Parents need simple proof that school happened on required days without reconstructing attendance from memory later.

**Relief promise.** Make attendance logging quick, visible, and exportable.

**Anti-pattern (the wrong way to relieve it).** Compliance panic, stale records, hard-to-export logs.

**Wave 1 features that address this pain:**
- #20 — Attendance record data model
- #21 — Mark attendance by child/date
- #23 — Attendance summary

---

### PAIN-027 — Parents need one operating surface

**Score: 15/15** · Severity 5 · Frequency 5 · Switching Pressure 5  
**Category:** Dashboard / Control Center  
**Who experiences it:** Homeschool Parent

**The pain.** Parents need one clear surface showing schedule, attendance, records, progress, and next actions without hunting across separate areas.

**Relief promise.** Give parents a calm command center with the right next action.

**Anti-pattern (the wrong way to relieve it).** Dashboard clutter and hidden urgent work.

**Wave 1 features that address this pain:**
- #2 — Household workspace
- #8 — Parent dashboard shell
- #9 — Child selector

---

### PAIN-004 — Missed days create planning exhaustion

**Score: 14/15** · Severity 5 · Frequency 5 · Switching Pressure 4  
**Category:** Planning / Pacing  
**Who experiences it:** Homeschool Parent

**The pain.** When a school day is missed, parents must manually repair schedules, pacing, assignments, and sequencing.

**Relief promise.** Make schedule repair calm and visible when life interrupts the plan.

**Anti-pattern (the wrong way to relieve it).** Rigid automation and hidden backlog

**Wave 1 features that address this pain:**
- #11 — Weekly planner structure
- #16 — Move/reschedule lesson
- #17 — Basic repeating weekly pattern

---

### PAIN-010 — Planning labor repeats every week

**Score: 14/15** · Severity 5 · Frequency 5 · Switching Pressure 4  
**Category:** Planning / Pacing  
**Who experiences it:** Homeschool Parent

**The pain.** Parents repeatedly spend time building, adjusting, and rewriting weekly plans instead of using a calmer reusable planning system.

**Relief promise.** Reduce repeated planning labor while keeping parent control over final plans.

**Anti-pattern (the wrong way to relieve it).** Opaque AI planning, over-automation, generic curriculum suggestions.

**Wave 1 features that address this pain:**
- #11 — Weekly planner structure
- #17 — Basic repeating weekly pattern

---

### PAIN-014 — Fast data entry is essential

**Score: 14/15** · Severity 5 · Frequency 5 · Switching Pressure 4  
**Category:** Operational Friction  
**Who experiences it:** Parent; Teacher

**The pain.** Parents and teachers will avoid the system if lesson, assignment, attendance, or record entry takes too long.

**Relief promise.** Make the common logging path fast, minimal, and progressive in complexity.

**Anti-pattern (the wrong way to relieve it).** Overbuilt forms, too many required fields, slow daily logging.

**Wave 1 features that address this pain:**
- #13 — Add lesson/task
- #15 — Lesson status states
- #18 — Parent lesson notes/resources

---

### PAIN-019 — Parents need hours documentation

**Score: 14/15** · Severity 5 · Frequency 4 · Switching Pressure 5  
**Category:** Attendance / Compliance  
**Who experiences it:** Homeschool Parent

**The pain.** Some parents need to document instructional hours or minutes clearly because state, program, or family requirements may depend on time records.

**Relief promise.** Allow optional hours/minutes tracking where needed without forcing it on every family.

**Anti-pattern (the wrong way to relieve it).** One-size-fits-all compliance burden, legal overclaiming.

**Wave 1 features that address this pain:**
- #22 — Optional hours/minutes field

---

### PAIN-022 — Formal records need credibility

**Score: 14/15** · Severity 5 · Frequency 4 · Switching Pressure 5  
**Category:** Records / Reports  
**Who experiences it:** Parent; Admin; Student

**The pain.** Users need report cards, transcripts, and official-looking record outputs that are credible enough for reviews, transfers, high school planning, or institutional follow-up.

**Relief promise.** Turn captured learning records into credible formal outputs without overclaiming authority.

**Anti-pattern (the wrong way to relieve it).** Overbuilt report-builder before records are reliable.

**Wave 1 features that address this pain:**
- #7 — School year setup
- #33 — Basic records report view
- #34 — Export records summary

---

### PAIN-024 — Families need data trust and portability

**Score: 14/15** · Severity 5 · Frequency 4 · Switching Pressure 5  
**Category:** Privacy / Data Trust  
**Who experiences it:** Parent; Admin

**The pain.** Families and institutions need confidence that records are private, exportable, deletable, and not trapped in a system they cannot leave.

**Relief promise.** Make privacy, export, retention, deletion, and data portability visible and trustworthy.

**Anti-pattern (the wrong way to relieve it).** Data lock-in, unclear retention, hard-to-export records.

**Wave 1 features that address this pain:**
- #33 — Basic records report view
- #34 — Export records summary

---

### PAIN-025 — Compliance confidence needs bounded guidance

**Score: 14/15** · Severity 5 · Frequency 4 · Switching Pressure 5  
**Category:** Compliance / Legal Boundaries  
**Who experiences it:** Homeschool Parent

**The pain.** Parents need help understanding requirements and preparing records, but the system must not present itself as legal advice.

**Relief promise.** Provide source-linked, last-reviewed compliance support with clear disclaimers and exportable records.

**Anti-pattern (the wrong way to relieve it).** Stale requirement summaries or one-size-fits-all state guidance.

**Wave 1 features that address this pain:**
- #35 — Records review checklist

---

### PAIN-026 — Core access and identity must not block daily use

**Score: 14/15** · Severity 5 · Frequency 5 · Switching Pressure 4  
**Category:** Access / Identity / Profiles  
**Who experiences it:** Parent; Student; Teacher

**The pain.** Families need reliable access across devices, browsers, accounts, and child profiles so basic daily schooling does not break before learning work begins.

**Relief promise.** Make sign-in, profile selection, device access, and daily identity context stable and low-friction.

**Anti-pattern (the wrong way to relieve it).** Fragile login, profile confusion, mobile-hostile UI.

**Wave 1 features that address this pain:**
- #1 — Parent account sign-in
- #3 — Child profile data model
- #4 — Add/edit child profile

---

### PAIN-029 — Muslim subjects need native records

**Score: 14/15** · Severity 5 · Frequency 4 · Switching Pressure 5  
**Category:** Muslim-Native Records  
**Who experiences it:** Parent; Teacher; Quran teacher

**The pain.** Quran, Arabic, Islamic Studies, adab, and service learning need native record fields instead of being squeezed into generic subject or gradebook structures.

**Relief promise.** Model Muslim learning domains with appropriate fields, evidence types, goals, and privacy boundaries.

**Anti-pattern (the wrong way to relieve it).** Generic subject labels and crude religious scoring.

**Wave 1 features that address this pain:**
- #5 — Subject/course data model
- #6 — Create subject/course for child

---

### PAIN-005 — Progress is invisible until too late

**Score: 13/15** · Severity 5 · Frequency 4 · Switching Pressure 4  
**Category:** Progress Visibility  
**Who experiences it:** Parent; Teacher; Student

**The pain.** Parents, teachers, and students often cannot see slipping performance or missing work until a grading period or evaluation window is almost over.

**Relief promise.** Show standing and trends early enough for support instead of surprise.

**Anti-pattern (the wrong way to relieve it).** Punitive dashboards and ranking culture

**Wave 1 features that address this pain:**
- #8 — Parent dashboard shell
- #24 — Progress by subject
- #26 — Progress and attendance cards

---

### PAIN-016 — Curriculum must become actionable work

**Score: 13/15** · Severity 5 · Frequency 4 · Switching Pressure 4  
**Category:** Curriculum Operations  
**Who experiences it:** Parent; Teacher; Admin

**The pain.** Curriculum content is not enough unless it can be converted into child-level lessons, assignments, tasks, and records.

**Relief promise.** Make curriculum operational by connecting it to assignments, pacing, progress, and evidence.

**Anti-pattern (the wrong way to relieve it).** Static PDFs, disconnected curriculum, content library without execution workflow.

**Wave 1 features that address this pain:**
- #5 — Subject/course data model
- #12 — Lesson/task data model
- #13 — Add lesson/task

---

### PAIN-017 — Records need broader learning artifacts

**Score: 13/15** · Severity 5 · Frequency 4 · Switching Pressure 4  
**Category:** Portfolio / Proof of Learning  
**Who experiences it:** Parent; Teacher

**The pain.** Families need to capture real proof of learning beyond grades and assignments, including photos, notes, files, Quran recitation evidence, projects, and reflections.

**Relief promise.** Support flexible evidence types connected to actual learning records.

**Anti-pattern (the wrong way to relieve it).** Random file bucket, portfolio detached from lessons, evidence chaos.

**Wave 1 features that address this pain:**
- #5 — Subject/course data model
- #27 — Portfolio evidence data model
- #28 — Add portfolio evidence item
- #29 — Attach evidence to lesson/task
- #30 — Upload file/photo/link/text evidence
- #31 — Parent reflection/note on evidence
- #32 — Portfolio list and filters

---

### PAIN-020 — Programs need safety/accountability attendance

**Score: 13/15** · Severity 5 · Frequency 4 · Switching Pressure 4  
**Category:** Attendance / Program Safety  
**Who experiences it:** Admin; Teacher

**The pain.** Schools, co-ops, and Quran programs need attendance visibility for safety, accountability, and follow-up, not only academic recordkeeping.

**Relief promise.** Make program attendance visible to authorized roles with clear accountability and follow-up.

**Anti-pattern (the wrong way to relieve it).** Weak role permissions, over-notification, privacy leakage.

**Wave 1 features that address this pain:**
- #20 — Attendance record data model
- #21 — Mark attendance by child/date

---

### PAIN-023 — Assessment needs clarity without score obsession

**Score: 12/15** · Severity 4 · Frequency 4 · Switching Pressure 4  
**Category:** Assessment / Progress  
**Who experiences it:** Parent; Teacher; Student

**The pain.** Users need grades, assessment records, and progress indicators to be clear, but not so heavy that they turn learning into anxious scorekeeping.

**Relief promise.** Make assessment status visible and useful while preserving room for narrative, mastery, and family preference.

**Anti-pattern (the wrong way to relieve it).** Rigid grading assumptions for all homeschool families.

**Wave 1 features that address this pain:**
- #24 — Progress by subject

---

### PAIN-015 — Students need actionable task clarity

**Score: 11/15** · Severity 4 · Frequency 4 · Switching Pressure 3  
**Category:** Student Workflow  
**Who experiences it:** Student

**The pain.** Students need to know exactly what to do next, what is complete, and what still needs attention without depending on repeated parent/teacher chasing.

**Relief promise.** Turn assignments into clear student-facing next actions.

**Anti-pattern (the wrong way to relieve it).** Vague assignment lists, hidden completion state, notification overload.

**Wave 1 features that address this pain:**
- #14 — Daily/weekly lesson list
- #19 — Today’s lessons card

---

### PAIN-021 — Quran sessions need attendance proof

**Score: 11/15** · Severity 4 · Frequency 4 · Switching Pressure 3  
**Category:** Quran/Hifz Operations  
**Who experiences it:** Quran teacher; Parent

**The pain.** Quran and hifz teachers need quick proof of session attendance so recitation, memorization, and review records stay credible.

**Relief promise.** Connect attendance to Quran/Hifz session records without slowing teachers down.

**Anti-pattern (the wrong way to relieve it).** Generic attendance detached from Quran learning records.

**Wave 1 features that address this pain:**
- #20 — Attendance record data model

---

### PAIN-030 — Onboarding friction blocks adoption

**Score: 11/15** · Severity 4 · Frequency 4 · Switching Pressure 3  
**Category:** Onboarding / Support  
**Who experiences it:** Parent; Teacher; Admin

**The pain.** Parents and teachers may abandon a useful tool if setup, first-week use, help docs, or recovery from confusion is not simple enough.

**Relief promise.** Provide lightweight onboarding and help at the moment of confusion.

**Anti-pattern (the wrong way to relieve it).** Long setup wizard, hidden help, support dependency.

**Wave 1 features that address this pain:**
- #10 — Next setup prompt

---

## 2.2 Pains NOT directly addressed by Wave 1

These four pains are intentionally not addressed by Wave 1 features. Each has a deliberate reason and a Wave assignment for when it will be addressed.

### PAIN-001 — Formation reduced to crude scoring

**Score: 12/15** · Severity 5 · Frequency 3 · Switching Pressure 4  
**Category:** Formation / Tarbiyah

**The pain.** Parents and educators need a way to record formation, adab, and spiritual growth without reducing the child to a crude numeric score.

**Why deferred.** Out of Wave 1 scope.

---

### PAIN-002 — Piety scoreboard pressure

**Score: 12/15** · Severity 5 · Frequency 3 · Switching Pressure 4  
**Category:** Formation / Tarbiyah

**The pain.** Spiritual motivation systems can unintentionally create unhealthy comparison, performative worship, or pressure around religious appearance.

**Why deferred.** **Boundary pain — a discipline, not a feature.** This pain is something Wave 1 must not accidentally create rather than something that needs building. The risk is in how Quran logging, Islamic Studies tracking, and portfolio reflection are designed. The design decisions in Wave 2B (Quran/Hifz tracking) determine whether this pain is created or avoided. Treated as a permanent design rule across all waves.

---

### PAIN-028 — Roles need clear permission boundaries

**Score: 12/15** · Severity 4 · Frequency 4 · Switching Pressure 4  
**Category:** Roles / Permissions

**The pain.** Teachers, tutors, co-ops, schools, and parents need role-based access without exposing too much student information or overcomplicating the homeschool MVP.

**Why deferred.** Out of Wave 1 scope.

---

### PAIN-006 — Institutions need formation records

**Score: 11/15** · Severity 4 · Frequency 4 · Switching Pressure 3  
**Category:** Formation / Tarbiyah

**The pain.** Schools and programs need a record of formation/adab growth that is visible enough for follow-up without turning it into crude moral grading.

**Why deferred.** Out of Wave 1 scope.

---

### PAIN-011 — Parents want child-fit planning

**Score: 11/15** · Severity 4 · Frequency 4 · Switching Pressure 3  
**Category:** Planning / Personalization

**The pain.** Parents want plans that fit the child’s level, pace, needs, and curriculum instead of one-size-fits-all schedules.

**Why deferred.** **Acknowledged gap.** Wave 1 builds a planner organized by child and subject but the planner does not yet respond to the child's pace, level, or needs. This is the most significant Wave 1 gap. Targeted for Wave 2C (Trust and Guidance) when bounded child-fit suggestions can be added safely.

---

### PAIN-012 — Parents need bounded on-demand guidance

**Score: 11/15** · Severity 4 · Frequency 4 · Switching Pressure 3  
**Category:** Guidance / Trust

**The pain.** Parents want quick answers and decision support inside the school workflow, but unbounded AI guidance can become untrusted, unsafe, or religiously careless.

**Why deferred.** Out of Wave 1 scope.

---

### PAIN-007 — Salah practice visibility gap

**Score: 10/15** · Severity 4 · Frequency 3 · Switching Pressure 3  
**Category:** Formation / Tarbiyah

**The pain.** Parents or teachers may need visibility into salah practice routines, but that visibility can become spiritually harmful if treated like a public performance metric.

**Why deferred.** Out of Wave 1 scope.

---

### PAIN-031 — Communication can become noise

**Score: 10/15** · Severity 3 · Frequency 4 · Switching Pressure 3  
**Category:** Communication / Alerts

**The pain.** Parents, teachers, and admins need timely updates, but broad messaging and alerts can become noisy or too school-like for homeschool use.

**Why deferred.** **Correctly deferred.** Wave 1 has no notification system. Building alerts before the core records are trusted creates noise before utility. Targeted for Wave 2 with explicit guardrails to prevent over-notification.

---

### PAIN-008 — Classroom routines need recognition without manipulation

**Score: 9/15** · Severity 3 · Frequency 4 · Switching Pressure 2  
**Category:** Classroom Culture / Formation

**The pain.** Teachers need ways to acknowledge classroom routines and behavior patterns without manipulating students through shallow points or public status games.

**Why deferred.** **Out of MVP scope.** This is a full-time school and co-op concern, not a homeschool concern. Targeted for Wave 3 institutional editions.

---

### PAIN-013 — AI cost can become hidden or uncontrolled

**Score: 9/15** · Severity 3 · Frequency 3 · Switching Pressure 3  
**Category:** Pricing / Trust

**The pain.** AI-heavy tools can create unclear usage costs or force families to subsidize features they may not trust or need.

**Why deferred.** Out of Wave 1 scope.

---

### PAIN-033 — Edition and plan boundaries need clarity

**Score: 9/15** · Severity 3 · Frequency 3 · Switching Pressure 3  
**Category:** Plans / Settings / Boundaries

**The pain.** Users and admins need to know what their edition includes, what is enabled, and what limits apply without confusion.

**Why deferred.** Out of Wave 1 scope.

---

### PAIN-009 — Household task tracking can blur into school formation

**Score: 8/15** · Severity 3 · Frequency 3 · Switching Pressure 2  
**Category:** Household Operations

**The pain.** Families may want household task visibility, but it can blur chores, character, schoolwork, and spiritual formation into one confusing tracking system.

**Why deferred.** Out of Wave 1 scope.

---

### PAIN-032 — Muslim calendar rhythm affects planning

**Score: 8/15** · Severity 3 · Frequency 3 · Switching Pressure 2  
**Category:** Calendar / Muslim Rhythm

**The pain.** Muslim families and programs need planning to recognize Ramadan, Eid, and religious calendar rhythms without forcing generic school calendars.

**Why deferred.** Out of Wave 1 scope.

---

# 3. The data model

Wave 1 introduces 8 P0 entities plus 6 P1 entities reserved for early use within Wave 1 or immediately after. The data chain runs:

```
user_account → workspace → household_profile → student_profile
                                                    ↓
                                              subject_course
                                                    ↓
                                              lesson_task
                                                    ↓
                                              attendance_record
                                              evidence_item
```

Every record in Wave 1 traces back to a `user_account` through this chain. Multi-tenancy, future role models, and edition support are all hung off this spine.

## `user_account`

**MVP Priority:** P0

**Purpose.** Authentication identity for parent/admin and future users.

**Key fields.** `id, email, name, auth_provider_id, email_verified, created_at, last_login_at, status`

**Required relationships.** May own workspace_membership

**Optional / future relationships.** Future: student account, teacher account, tutor account

**Created by / owner.** System / user

**Read access.** Self; workspace admins as appropriate

**Write access.** Self for profile; system/admin for status

**Deletion / archive rule.** Soft-delete/deactivate first; preserve record ownership history.

**Notes & guardrails.** Do not custom-roll password security.

**Touched by build queue rows:** 1

**Related pains:** PAIN-003; PAIN-012

---

## `workspace`

**MVP Priority:** P0

**Purpose.** Generic container for household now and institutions later.

**Key fields.** `id, workspace_type, name, owner_user_id, created_at, status, plan_id`

**Required relationships.** owner_user_id → user_account.id

**Optional / future relationships.** Future workspace_type: household, school, weekend_program, tutor, co_op

**Created by / owner.** Parent/admin

**Read access.** Workspace members

**Write access.** Owner/admin

**Deletion / archive rule.** Archive/deactivate; handle child records before deletion.

**Notes & guardrails.** Prefer workspace as reusable parent object over hardcoding household everywhere.

**Touched by build queue rows:** 2; 50; 52; 54; 55

**Related pains:** PAIN-003

---

## `household_profile`

**MVP Priority:** P0

**Purpose.** Homeschool-specific profile for family/household context.

**Key fields.** `id, workspace_id, household_name, timezone, default_school_year_id, settings_json`

**Required relationships.** workspace_id → workspace.id

**Optional / future relationships.** Future: family preferences, local community settings

**Created by / owner.** Parent

**Read access.** Household members

**Write access.** Parent/admin

**Deletion / archive rule.** Archive with workspace; do not orphan children.

**Notes & guardrails.** This is homeschool-specific; avoid making it carry institution settings.

**Touched by build queue rows:** 2

**Related pains:** PAIN-003

---

## `workspace_membership`

**MVP Priority:** P1 / future-ready

**Purpose.** Links users to workspace roles.

**Key fields.** `id, workspace_id, user_account_id, role, status, invited_at, accepted_at`

**Required relationships.** workspace_id; user_account_id

**Optional / future relationships.** Future roles: parent, student, teacher, admin, tutor

**Created by / owner.** Workspace owner/admin

**Read access.** Workspace admins

**Write access.** Owner/admin

**Deletion / archive rule.** Deactivate membership, do not delete historical record references.

**Notes & guardrails.** Do not overbuild institution roles before homeschool MVP.

**Touched by build queue rows:** 36; 53

**Related pains:** PAIN-020

---

## `student_profile`

**MVP Priority:** P0

**Purpose.** Child/student record inside workspace.

**Key fields.** `id, workspace_id, display_name, grade_level, dob_optional, active_status, sort_order, archived_at`

**Required relationships.** workspace_id → workspace.id

**Optional / future relationships.** Future: linked student account, parent relationships, school roster

**Created by / owner.** Parent/admin

**Read access.** Parent; later student/teacher by permission

**Write access.** Parent/admin

**Deletion / archive rule.** Archive instead of delete once records exist.

**Notes & guardrails.** Use student_profile even for homeschool child for future reuse.

**Touched by build queue rows:** 3; 4; 36; 51

**Related pains:** PAIN-003; PAIN-015

---

## `school_year`

**MVP Priority:** P1

**Purpose.** Organizes records and reports by school year/term.

**Key fields.** `id, workspace_id, name, start_date, end_date, active_flag`

**Required relationships.** workspace_id

**Optional / future relationships.** Future term/semester objects

**Created by / owner.** Parent/admin

**Read access.** Parent/admin

**Write access.** Parent/admin

**Deletion / archive rule.** Do not delete if reports/attendance exist; archive or lock.

**Notes & guardrails.** Needed before clean summaries/exports.

**Touched by build queue rows:** 7

**Related pains:** PAIN-003; PAIN-018

---

## `subject_course`

**MVP Priority:** P0

**Purpose.** Subject/course container for learning records.

**Key fields.** `id, workspace_id, student_id, name, subject_type, category, active_status, sort_order, metadata_json`

**Required relationships.** workspace_id; student_id → student_profile.id

**Optional / future relationships.** Muslim-native subject types: Quran, Arabic, Islamic Studies, adab/tarbiyah

**Created by / owner.** Parent/admin

**Read access.** Parent; later teacher/student by permission

**Write access.** Parent/admin

**Deletion / archive rule.** Archive if lesson/evidence records exist.

**Notes & guardrails.** Must support Quran/Arabic later without schema regret.

**Touched by build queue rows:** 5; 6; 41; 42; 43; 44

**Related pains:** PAIN-016

---

## `lesson_task`

**MVP Priority:** P0

**Purpose.** Atomic work object for planner, progress, curriculum execution, and reports.

**Key fields.** `id, workspace_id, student_id, subject_course_id, title, description/notes, assigned_date, due_date_optional, status, resource_text_or_url, created_at, updated_at`

**Required relationships.** workspace_id; student_id; subject_course_id

**Optional / future relationships.** Future recurrence_id, curriculum_content_id, student_submission_id

**Created by / owner.** Parent/admin

**Read access.** Parent; later student/teacher

**Write access.** Parent/admin; later teacher with permission

**Deletion / archive rule.** Soft-delete or archive; preserve completed history where needed.

**Notes & guardrails.** Do not make planner a shallow calendar-only layer.

**Touched by build queue rows:** 11; 12; 13; 14; 15; 16; 18; 19

**Related pains:** PAIN-010; PAIN-014; PAIN-015; PAIN-016

---

## `lesson_task_status_history`

**MVP Priority:** P1

**Purpose.** Tracks status changes, moves, completions, and reschedules.

**Key fields.** `id, lesson_task_id, from_status, to_status, from_date, to_date, changed_by_user_id, changed_at, reason_optional`

**Required relationships.** lesson_task_id

**Optional / future relationships.** Future audit log / parent approval flow

**Created by / owner.** System/user

**Read access.** Parent/admin

**Write access.** System appends; limited direct editing

**Deletion / archive rule.** Keep for audit/history; rarely delete.

**Notes & guardrails.** Useful for plan repair and trust.

**Touched by build queue rows:** 15; 16; 38; 39

**Related pains:** PAIN-004; PAIN-010

---

## `recurrence_rule`

**MVP Priority:** P1

**Purpose.** Defines repeating weekly lesson/task patterns.

**Key fields.** `id, workspace_id, student_id, subject_course_id, title_template, weekdays, start_date, end_date, default_notes, active_status`

**Required relationships.** workspace_id; student_id; subject_course_id

**Optional / future relationships.** Future recurrence exceptions

**Created by / owner.** Parent/admin

**Read access.** Parent/admin

**Write access.** Parent/admin

**Deletion / archive rule.** Deactivate rather than delete if generated tasks exist.

**Notes & guardrails.** Non-AI relief path for repeated planning labor.

**Touched by build queue rows:** 17

**Related pains:** PAIN-010

---

## `attendance_record`

**MVP Priority:** P0

**Purpose.** Daily attendance/time record for child/date.

**Key fields.** `id, workspace_id, student_id, school_year_id, date, status, minutes_optional, notes_optional, marked_by_user_id, marked_at`

**Required relationships.** workspace_id; student_id; school_year_id

**Optional / future relationships.** Future program/class attendance, Quran session attendance

**Created by / owner.** Parent/admin

**Read access.** Parent/admin

**Write access.** Parent/admin

**Deletion / archive rule.** Allow edit history if compliance/audit needs grow.

**Notes & guardrails.** Hours/minutes optional; do not force.

**Touched by build queue rows:** 20; 21; 22; 23

**Related pains:** PAIN-018; PAIN-019

---

## `evidence_item`

**MVP Priority:** P0 / early

**Purpose.** Portfolio/proof of learning object.

**Key fields.** `id, workspace_id, student_id, subject_course_id_optional, lesson_task_id_optional, evidence_type, title, note, url_optional, file_id_optional, evidence_date, created_by_user_id`

**Required relationships.** workspace_id; student_id

**Optional / future relationships.** Optional subject_course_id; optional lesson_task_id; future student submission

**Created by / owner.** Parent/admin; later student pending approval

**Read access.** Parent/admin; later scoped student/teacher

**Write access.** Parent/admin; later approval workflow

**Deletion / archive rule.** Soft-delete; handle file deletion separately.

**Notes & guardrails.** Must not become random file bucket; connect when possible.

**Touched by build queue rows:** 27; 28; 29; 30; 31; 32; 40

**Related pains:** PAIN-017; PAIN-003

---

## `file_asset`

**MVP Priority:** P1 / storage-gated

**Purpose.** Metadata for uploaded photos/files linked to evidence.

**Key fields.** `id, workspace_id, storage_provider, storage_key, filename, mime_type, size_bytes, uploaded_by_user_id, uploaded_at, deletion_status`

**Required relationships.** workspace_id

**Optional / future relationships.** May link to evidence_item, user avatar, student submission

**Created by / owner.** Uploader

**Read access.** Authorized workspace users

**Write access.** Uploader/admin based on role

**Deletion / archive rule.** Deletion must remove/expire stored file according to privacy policy.

**Notes & guardrails.** If storage not ready, ship text/link evidence first.

**Touched by build queue rows:** 30; 49

**Related pains:** PAIN-017; PAIN-012

---

## `report_request / report_export`

**MVP Priority:** P1

**Purpose.** Tracks generated/exported record summaries.

**Key fields.** `id, workspace_id, student_id, school_year_id, date_range_start, date_range_end, report_type, generated_by_user_id, generated_at, export_format, file_asset_id_optional`

**Required relationships.** workspace_id; student_id; school_year_id

**Optional / future relationships.** Future saved report snapshots

**Created by / owner.** Parent/admin

**Read access.** Parent/admin

**Write access.** Parent/admin

**Deletion / archive rule.** Preserve export metadata; delete file asset per policy.

**Notes & guardrails.** MVP can start with live HTML/print view before saved exports.

**Touched by build queue rows:** 33; 34; 35

**Related pains:** PAIN-003; PAIN-005; PAIN-018

---

## `records_check`

**MVP Priority:** P1

**Purpose.** Computed checklist/gap signals before export.

**Key fields.** `computed, not necessarily stored: missing_attendance_days, subjects_without_lessons, no_evidence_flags, date_range`

**Required relationships.** Queries attendance, lesson_task, evidence_item, subject_course

**Optional / future relationships.** Future saved checklist state

**Created by / owner.** System

**Read access.** Parent/admin

**Write access.** System computed

**Deletion / archive rule.** No canonical storage needed unless saving checklist snapshots.

**Notes & guardrails.** Avoid legal compliance claims; phrase as records review.

**Touched by build queue rows:** 35

**Related pains:** PAIN-005

---

## `curriculum_content_item`

**MVP Priority:** Later / optional

**Purpose.** Sheath or imported curriculum item attachable to subject/lesson.

**Key fields.** `id, provider, title, subject_type, grade_level, content_type, source_ref, metadata_json`

**Required relationships.** None required for MVP unless content integration ships

**Optional / future relationships.** Links to lesson_task, subject_course, content packages

**Created by / owner.** Admin/content team

**Read access.** Authorized customers

**Write access.** Admin/content team

**Deletion / archive rule.** Archive/version rather than destructive edit if used in plans.

**Notes & guardrails.** Do not let content product derail core operating spine.

**Touched by build queue rows:** 56

**Related pains:** PAIN-016

---

## `audit_event`

**MVP Priority:** Later / trust

**Purpose.** Append-only system record of important changes.

**Key fields.** `id, workspace_id, actor_user_id, entity_type, entity_id, action, before_json_optional, after_json_optional, occurred_at`

**Required relationships.** workspace_id; actor_user_id

**Optional / future relationships.** Future institution accountability, parent approval, AI suggestion history

**Created by / owner.** System

**Read access.** Admin/developer; limited user-facing history later

**Write access.** System only

**Deletion / archive rule.** Append-only with retention policy.

**Notes & guardrails.** Do not overbuild at MVP, but schema planning helps.

**Touched by build queue rows:** 16; 38; 39; 49; 53

**Related pains:** PAIN-012; PAIN-020

---

# 4. The features

All 35 features, organized by wave. Each feature is a complete specification — read it once and you have everything that exists about that feature.

## Wave 1A — Homeschool MVP foundation

*The skeleton everything else attaches to.*

**Wave goal.** After Wave 1A, a parent can sign in, set up their household, add their children, define subjects, and see a working dashboard with guided next steps. Nothing has been recorded yet — but the structure exists for everything that comes next.

---

### Feature 1 — Parent account sign-in

**Epic:** Account / Workspace · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need to access my household workspace securely.

**Acceptance criteria (done means).** Parent can create account, sign in, sign out, and return to same workspace.

**Dependencies.** None

**Build gate.** Ready

**Source / why this feature exists.** Every other workflow requires a parent/admin identity.

**MVP rationale.** No product exists without secure parent access.

**Risk if cut.** No persistent user system.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-026 — Core access and identity must not block daily use** *(Primary relief, Strong)*
  - *How this feature relieves it:* Parent identity is required before any household records can exist.
  - *Build implication:* Foundation row; keep simple for MVP.

**Data model entities involved:**

- `user_account` — Authentication identity for parent/admin and future users.

**Related canonical features:** Parent/admin account

**Build queue notes.** Keep simple; no institution roles yet.

**Open questions to resolve before sprint:**

- Auth provider: roll our own (NextAuth + email/password), use a managed service (Clerk, Auth0, Supabase Auth), or magic link only?
- Email verification required at signup or deferred?
- Password requirements?
- Session length and refresh policy?

---

### Feature 2 — Household workspace

**Epic:** Account / Workspace · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need one place for my family records.

**Acceptance criteria (done means).** New account creates or joins one household; household has name, owner, and created date.

**Dependencies.** Parent account sign-in

**Build gate.** After feature 1 built

**Source / why this feature exists.** Homeschool product is household-first.

**MVP rationale.** The homeschool unit is the family/household; this prevents loose records.

**Risk if scoped too richly.** Overbuilding institutions here.

**Risk if cut.** Records become scattered and hard to scope.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-027 — Parents need one operating surface** *(Primary relief, Strong)*
  - *How this feature relieves it:* A household workspace gives the parent one family operating context.
  - *Build implication:* Foundation row; keep household-first.

**Data model entities involved:**

- `workspace` — Generic container for household now and institutions later.
- `household_profile` — Homeschool-specific profile for family/household context.

**Related canonical features:** Household/family profile

**Build queue notes.** This becomes the parent’s operating layer.

**Open questions to resolve before sprint:**

- Can a single user belong to multiple workspaces (e.g., remarried family, co-parenting)? MVP answer: probably no, defer to Wave 3.
- What's the workspace name default — 'Naeem Family' style, or just left blank?

---

### Feature 3 — Child profile data model

**Epic:** Student / Child Profiles · **Wave:** Wave 1A · **T-shirt size:** XS

**User story.** As a parent, I need to track each child separately.

**Acceptance criteria (done means).** System stores child name, grade/level, optional DOB, active status, and household ID.

**Dependencies.** Household workspace

**Build gate.** After feature 2 built

**Source / why this feature exists.** Planning, attendance, portfolio, and reports attach to a child.

**MVP rationale.** Multi-child tracking is core homeschool value.

**Risk if scoped too richly.** Too much demographic data.

**Risk if cut.** Planner, attendance, and reports cannot attach correctly.

**MVP decision:** MVP Core

**Pains this feature addresses (2):**

- **PAIN-003 — Scattered records weaken confidence** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Profiles prevent records from blending across children.
  - *Build implication:* Connect profile model to records spine.
- **PAIN-026 — Core access and identity must not block daily use** *(Primary relief, Strong)*
  - *How this feature relieves it:* Child profiles anchor child-specific work, records, attendance, and evidence.
  - *Build implication:* Treat as foundation data model with clear profile selection.

**Data model entities involved:**

- `student_profile` — Child/student record inside workspace.

**Related canonical features:** Student / child profile

**Build queue notes.** Core data model before UI polish.

**Open questions to resolve before sprint:**

- What is 'grade/level' — US K-12 only, or international labels too?
- Is DOB optional or required?
- Soft delete vs hard delete for archived children?

---

### Feature 4 — Add/edit child profile

**Epic:** Student / Child Profiles · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need to add my children before planning lessons.

**Acceptance criteria (done means).** Parent can create/edit/archive a child; child appears in selectors across app.

**Dependencies.** Child profile data model

**Build gate.** After feature 3 built

**Source / why this feature exists.** No homeschool records spine exists without child setup.

**MVP rationale.** Multi-child tracking is core homeschool value.

**Risk if scoped too richly.** Too much demographic data.

**Risk if cut.** Planner, attendance, and reports cannot attach correctly.

**MVP decision:** MVP Core

**Pains this feature addresses (2):**

- **PAIN-003 — Scattered records weaken confidence** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Profiles prevent records from blending across children.
  - *Build implication:* Connect profile model to records spine.
- **PAIN-026 — Core access and identity must not block daily use** *(Primary relief, Strong)*
  - *How this feature relieves it:* Child profiles anchor child-specific work, records, attendance, and evidence.
  - *Build implication:* Treat as foundation data model with clear profile selection.

**Data model entities involved:**

- `student_profile` — Child/student record inside workspace.

**Related canonical features:** Student / child profile

**Build queue notes.** Must support multiple children.

**Open questions to resolve before sprint:**

- What does 'archive' mean in the UI — hidden but recoverable?
- Can a child be reactivated? How?
- Confirmation flow for archive?

---

### Feature 5 — Subject/course data model

**Epic:** Subjects / Courses · **Wave:** Wave 1A · **T-shirt size:** XS

**User story.** As a parent, I need subjects/courses to organize learning.

**Acceptance criteria (done means).** System stores subject/course name, child, category, active status, and order.

**Dependencies.** Add/edit child profile

**Build gate.** After feature 4 built

**Source / why this feature exists.** Lessons, progress, portfolio, and reports need a subject/course spine.

**MVP rationale.** Lessons, progress, reports, and portfolio need subject organization.

**Risk if scoped too richly.** Overbuilding curriculum catalog too early.

**Risk if cut.** Work becomes a generic task list with weak educational meaning.

**MVP decision:** MVP Core

**Pains this feature addresses (3):**

- **PAIN-016 — Curriculum must become actionable work** *(Secondary relief, Strong)*
  - *How this feature relieves it:* Native subjects still need to become lessons, goals, evidence, and progress records.
  - *Build implication:* Connect Muslim-native fields to lesson/task/evidence model.
- **PAIN-017 — Records need broader learning artifacts** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Quran/audio/adab/service evidence requires artifact types beyond generic grades.
  - *Build implication:* Include evidence models for Muslim learning domains.
- **PAIN-029 — Muslim subjects need native records** *(Primary relief, Strong)*
  - *How this feature relieves it:* Quran, Arabic, Islamic Studies, and adab need non-generic fields.
  - *Build implication:* Make this a core Sheath data architecture decision.

**Data model entities involved:**

- `subject_course` — Subject/course container for learning records.

**Related canonical features:** Subject/course setup

**Build queue notes.** Use flexible model for Quran/Arabic later.

**Open questions to resolve before sprint:**

- What is 'category' — predefined enum (Quran, Arabic, Islamic Studies, Math, Reading, Science, History, English, Other) or freeform?
- Should categories drive default colors/icons?

---

### Feature 6 — Create subject/course for child

**Epic:** Subjects / Courses · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need to set up the subjects each child is studying.

**Acceptance criteria (done means).** Parent can create at least one subject for each child and see it in course list.

**Dependencies.** Subject/course data model

**Build gate.** After feature 5 built

**Source / why this feature exists.** Turns child profiles into usable homeschool records.

**MVP rationale.** Lessons, progress, reports, and portfolio need subject organization.

**Risk if scoped too richly.** Overbuilding curriculum catalog too early.

**Risk if cut.** Work becomes a generic task list with weak educational meaning.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-029 — Muslim subjects need native records** *(Primary relief, Strong)*
  - *How this feature relieves it:* Flexible subject/course setup creates room for Quran, Arabic, Islamic Studies, and ordinary subjects.
  - *Build implication:* Keep generic enough for all subjects but ready for native templates.

**Data model entities involved:**

- `subject_course` — Subject/course container for learning records.

**Related canonical features:** Subject/course setup

**Build queue notes.** Keep form short.

**Open questions to resolve before sprint:**

- Can the same subject (e.g., 'Math') be created independently for each child, or shared at the household level?
- MVP recommendation: per-child for simplicity. Shared subjects come later if needed.

---

### Feature 7 — School year setup

**Epic:** School Year / Term · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent, I need records organized by school year.

**Acceptance criteria (done means).** Parent can set school year name, start date, end date, and active year.

**Dependencies.** Household workspace; Add/edit child profile

**Build gate.** After features 2 and 4 built

**Source / why this feature exists.** Needed for reports and summaries; not first-day blocker.

**MVP rationale.** Reports and attendance need a time container.

**Risk if scoped too richly.** Building terms/calendars too richly.

**Risk if cut.** Reports/export lack context.

**MVP decision:** MVP Core, simple

**Pains this feature addresses (1):**

- **PAIN-022 — Formal records need credibility** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Records and reports need a year/term container to be credible.
  - *Build implication:* Keep simple; avoid calendar bloat.

**Data model entities involved:**

- `school_year` — Organizes records and reports by school year/term.

**Related canonical features:** School year / term setup

**Build queue notes.** Do not overbuild calendars yet.

**Open questions to resolve before sprint:**

- Does the parent set the school year manually or does the system suggest a default (e.g., Aug 1 – May 31)?
- Can a household have multiple active school years (e.g., transitioning between years)?
- What happens to existing data when a school year ends?

---

### Feature 8 — Parent dashboard shell

**Epic:** Dashboard · **Wave:** Wave 1A · **T-shirt size:** M

> ⚠️ **SPLIT RECOMMENDED.** The done means combines a layout shell with five distinct empty-state prompts. Split into (8a) layout, navigation, and routing scaffold; (8b) empty state system with prompt sequence and copy. Different deliverables, different review surfaces.

**User story.** As a parent, I need a home base to see what to do next.

**Acceptance criteria (done means).** Dashboard loads and shows empty-state prompts for children, subjects, lessons, attendance, portfolio.

**Dependencies.** Parent account sign-in; Household workspace

**Build gate.** After features 1 and 2 built

**Source / why this feature exists.** Competitors repeatedly sell the all-in-one dashboard promise.

**MVP rationale.** Dashboard should tell parent where to start and what needs attention.

**Risk if scoped too richly.** Decorative dashboard wasting dev time.

**Risk if cut.** User feels lost after login.

**MVP decision:** MVP Core, thin

**Pains this feature addresses (3):**

- **PAIN-003 — Scattered records weaken confidence** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Dashboard can unify records, tasks, attendance, and progress context.
  - *Build implication:* Surface records state without duplicating every module.
- **PAIN-005 — Progress is invisible until too late** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Dashboard can reveal slipping progress early enough for support.
  - *Build implication:* Avoid anxious warning systems.
- **PAIN-027 — Parents need one operating surface** *(Primary relief, Strong)*
  - *How this feature relieves it:* Dashboard reduces hunting across tabs and surfaces next actions.
  - *Build implication:* Keep dashboard calm and action-oriented.

**Related canonical features:** Parent dashboard

**Build queue notes.** Start as shell; cards come later.

**Open questions to resolve before sprint:**

- Wireframe needed before sprint. Mobile-first or desktop-first?
- What are the 5 empty states' exact copy?
- Do prompts dismiss permanently or rotate?

---

### Feature 9 — Child selector

**Epic:** Dashboard · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a parent with multiple children, I need to switch between children easily.

**Acceptance criteria (done means).** Dashboard can filter by All Children or one selected child; selection persists during session.

**Dependencies.** Add/edit child profile; Parent dashboard shell

**Build gate.** After features 4 and 8 built

**Source / why this feature exists.** Multi-child management is a core homeschool pain.

**MVP rationale.** Multi-child tracking is core homeschool value.

**Risk if scoped too richly.** Too much demographic data.

**Risk if cut.** Planner, attendance, and reports cannot attach correctly.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-027 — Parents need one operating surface** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Parent needs quick switching between children inside the operating surface.
  - *Build implication:* Do not bury child switching.

**Related canonical features:** Child selector

**Build queue notes.** Do not bury this in settings.

**Open questions to resolve before sprint:**

- Default view: 'All Children' or first child?
- How is 'selection persists during session' implemented — cookie, localStorage, server-side preference?

---

### Feature 10 — Next setup prompt

**Epic:** Dashboard · **Wave:** Wave 1A · **T-shirt size:** S

**User story.** As a new parent user, I need to know what to do first.

**Acceptance criteria (done means).** Dashboard prompts: add child, add subject, create first lesson, mark attendance, add portfolio evidence.

**Dependencies.** Parent dashboard shell; Child selector

**Build gate.** After features 8 and 9 built

**Source / why this feature exists.** Reduces onboarding confusion and support burden.

**MVP rationale.** Dashboard should tell parent where to start and what needs attention.

**Risk if scoped too richly.** Decorative dashboard wasting dev time.

**Risk if cut.** User feels lost after login.

**MVP decision:** MVP Core, thin

**Pains this feature addresses (1):**

- **PAIN-030 — Onboarding friction blocks adoption** *(Primary relief, Medium)*
  - *How this feature relieves it:* Guidance reduces setup confusion by showing next missing action.
  - *Build implication:* Rules-based before AI.

**Related canonical features:** Guided next-action assistant

**Build queue notes.** Small UX feature with high leverage.

**Open questions to resolve before sprint:**

- What's the prompt order? Hardcoded sequence or smart based on what's missing?
- What does 'completed' look like — does the prompt strip disappear entirely after setup?


## Wave 1B — Homeschool planning spine

*The plan that survives real life.*

**Wave goal.** After Wave 1B, a parent can plan a week, add lessons by child and subject, mark what happened, and reschedule when life interrupts. The dashboard now shows today's work. The product is operationally useful.

---

### Feature 11 — Weekly planner structure

**Epic:** Planner · **Wave:** Wave 1B · **T-shirt size:** M

> ⚠️ **RESOLVE BEFORE SPRINT.** Needs a wireframe decision before coding starts: is this a desktop-style week grid, a mobile vertical list, or both? The grid layout choice affects every downstream planner feature.

**User story.** As a parent, I need to see the learning week at a glance.

**Acceptance criteria (done means).** Parent can view a week, move between weeks, and see child/subject/day organization.

**Dependencies.** Child profile; Subject/course setup; School year setup

**Build gate.** After features 4, 6, 7 built

**Source / why this feature exists.** Planning/scheduling is one of the highest recurring competitor feature families.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (2):**

- **PAIN-004 — Missed days create planning exhaustion** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Scheduling matters because it enables later plan repair.
  - *Build implication:* Tie to rescheduling and pacing repair.
- **PAIN-010 — Planning labor repeats every week** *(Primary relief, Strong)*
  - *How this feature relieves it:* Planbook scheduling reduces weekly reconstruction work.
  - *Build implication:* Keep parent-controlled; avoid calendar bloat.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Calendar / planbook scheduling

**Build queue notes.** Keep first version simple and fast.

**Open questions to resolve before sprint:**

- **Wireframe required.** Grid layout, list layout, or hybrid?
- Mobile rendering — vertical day list?
- Default week starts Sunday or Monday?
- How are weekends shown — collapsed, hidden, or equal?

---

### Feature 12 — Lesson/task data model

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** XS

**User story.** As a parent, I need individual lessons/tasks to plan and track.

**Acceptance criteria (done means).** System stores title, child, subject, date, status, notes, optional resource link.

**Dependencies.** Weekly planner structure

**Build gate.** After feature 11 built

**Source / why this feature exists.** Lessons are the atomic unit for planning, progress, and reporting.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-016 — Curriculum must become actionable work** *(Primary relief, Strong)*
  - *How this feature relieves it:* Creates the atomic work object that curriculum can attach to.
  - *Build implication:* Core platform architecture dependency.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Lesson/task creation

**Build queue notes.** Unlocks multiple later features.

**Open questions to resolve before sprint:**

- What's the difference between a 'lesson' and a 'task' in the data model — same entity, different label, or two entities?
- MVP recommendation: one entity called `lesson_task`.
- Status enum values — exact list?

---

### Feature 13 — Add lesson/task

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need to add what each child should do.

**Acceptance criteria (done means).** Parent can add, edit, and delete a lesson/task for selected child, subject, and date.

**Dependencies.** Lesson/task data model

**Build gate.** After feature 12 built

**Source / why this feature exists.** Without this, planner is only a shell.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (2):**

- **PAIN-014 — Fast data entry is essential** *(Primary relief, Strong)*
  - *How this feature relieves it:* Task records relieve operational burden only if the common entry path is fast and progressively detailed.
  - *Build implication:* Require minimal fields first; optional details later.
- **PAIN-016 — Curriculum must become actionable work** *(Primary relief, Strong)*
  - *How this feature relieves it:* Turns curriculum content into child-level assigned work.
  - *Build implication:* Curriculum cannot remain a detached content library.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Lesson/task creation

**Build queue notes.** First real usable planning action.

**Open questions to resolve before sprint:**

- What fields are required vs optional?
- Date picker default — today or selected planner date?
- Subject dropdown filtered by selected child?

---

### Feature 14 — Daily/weekly lesson list

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need to see what is assigned today and this week.

**Acceptance criteria (done means).** Planner shows assigned lessons by day; dashboard can pull today’s list.

**Dependencies.** Add lesson/task; Child selector

**Build gate.** After features 9 and 13 built

**Source / why this feature exists.** Turns lesson creation into daily usability.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-015 — Students need actionable task clarity** *(Primary relief, Strong)*
  - *How this feature relieves it:* Shows students/parents what is assigned, what is done, and what remains.
  - *Build implication:* Keep task language clear and age-appropriate.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Lesson list / daily checklist

**Build queue notes.** Make it readable before automations.

**Open questions to resolve before sprint:**

- What's the default date range — today only, this week, or rolling 7 days?
- Are skipped lessons hidden by default?
- How are completed lessons styled — strikethrough, faded, or moved to a separate section?

---

### Feature 15 — Lesson status states

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need to track what actually happened.

**Acceptance criteria (done means).** Parent can change status; completed/skipped/moved status is stored with timestamp.

**Dependencies.** Daily/weekly lesson list

**Build gate.** After feature 14 built

**Source / why this feature exists.** Required for progress, attendance logic, reports, and rescheduling.

**MVP rationale.** The product must survive real life; plan repair is a core pain.

**Risk if scoped too richly.** Complex automations too early.

**Risk if cut.** Planner becomes brittle and parents abandon it.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-014 — Fast data entry is essential** *(Primary relief, Strong)*
  - *How this feature relieves it:* Fast status changes capture what actually happened.
  - *Build implication:* Simple states first.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.
- `lesson_task_status_history` — Tracks status changes, moves, completions, and reschedules.

**Related canonical features:** Lesson completion tracking

**Build queue notes.** Use simple states now; nuance later.

**Open questions to resolve before sprint:**

- Exact status enum: Not Started, Completed, Skipped, Moved? Anything else?
- Is 'Moved' a status or a different concept (the original instance becomes a tombstone)?
- Can status be changed back from Completed to Not Started?

---

### Feature 16 — Move/reschedule lesson

**Epic:** Planner · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need the plan to survive real life.

**Acceptance criteria (done means).** Parent can move lesson to another date; original shows moved status or history.

**Dependencies.** Lesson status states

**Build gate.** After feature 15 built

**Source / why this feature exists.** Competitors show strong pain around plan repair and flexible rescheduling.

**MVP rationale.** The product must survive real life; plan repair is a core pain.

**Risk if scoped too richly.** Complex automations too early.

**Risk if cut.** Planner becomes brittle and parents abandon it.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-004 — Missed days create planning exhaustion** *(Primary relief, Strong)*
  - *How this feature relieves it:* Lets parents repair pacing without rebuilding everything manually.
  - *Build implication:* Preserve parent control over automation.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.
- `lesson_task_status_history` — Tracks status changes, moves, completions, and reschedules.
- `audit_event` — Append-only system record of important changes.

**Related canonical features:** Reschedule / plan repair

**Build queue notes.** Simple move before one-click automation.

**Open questions to resolve before sprint:**

- Does moving a lesson update the original date or create a new instance referencing the original?
- Can a lesson be moved more than once? How is history shown?
- What happens if a lesson is moved past the school year end?

---

### Feature 17 — Basic repeating weekly pattern

**Epic:** Planner · **Wave:** Wave 1B · **T-shirt size:** L

> ⚠️ **SPLIT REQUIRED — HIGHEST RISK ITEM IN MVP.** Recurrence is the feature that breaks planning apps. The done means hides massive complexity. Required product decisions before any code: What happens when you edit one instance vs. the series? What happens when a recurring lesson is moved — does the pattern break? What happens to historical recurrences when you delete the rule? How are recurring vs. one-time lessons displayed differently? What happens at school year boundaries? Recommended split: (17a) recurring pattern creation only — define rule, generate forward instances, no edit-series logic; (17b) recurring pattern edit and exception handling — defer to Phase 1.5 or Wave 2.

**User story.** As a parent, I need to avoid retyping the same plan every week.

**Acceptance criteria (done means).** Parent can create recurring task by weekday and subject for a date range.

**Dependencies.** Add lesson/task; Weekly planner structure

**Build gate.** After features 11 and 13 built

**Source / why this feature exists.** Reduces planning labor after core planner works.

**MVP rationale.** Useful, but not required to prove first value if manual lesson creation works.

**Risk if scoped too richly.** Recurrence bugs and edge cases.

**Risk if cut.** More repeated entry labor in MVP.

**MVP decision:** Post-MVP / v1.1

**Pains this feature addresses (2):**

- **PAIN-004 — Missed days create planning exhaustion** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Copy/reuse also supports plan repair after schedule disruption.
  - *Build implication:* Do not overbuild template library first.
- **PAIN-010 — Planning labor repeats every week** *(Primary relief, Strong)*
  - *How this feature relieves it:* Reduces repeated manual planning without needing AI.
  - *Build implication:* Useful non-AI relief path; may ship earlier than AI.

**Data model entities involved:**

- `recurrence_rule` — Defines repeating weekly lesson/task patterns.

**Related canonical features:** Recurring lesson pattern

**Build queue notes.** Can defer if MVP timing is tight.

**Open questions to resolve before sprint:**

- **See split note above.** Major scoping required.
- If a recurring lesson's status is set to Skipped, does that affect future instances?
- What's the UI for creating a recurring rule — a separate flow or part of Add Lesson?

---

### Feature 18 — Parent lesson notes/resources

**Epic:** Lessons / Tasks · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need to attach page, link, or reminder.

**Acceptance criteria (done means).** Lesson supports notes and one or more resource links/text references.

**Dependencies.** Add lesson/task

**Build gate.** After feature 13 built

**Source / why this feature exists.** Keeps planner practical without full curriculum import.

**MVP rationale.** This is the day-to-day operating spine.

**Risk if scoped too richly.** Trying to recreate full LMS/calendar too early.

**Risk if cut.** Product lacks daily utility.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-014 — Fast data entry is essential** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Notes/resources keep lesson entry practical without full curriculum import.
  - *Build implication:* Text/link first; files later.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Lesson notes / resources

**Build queue notes.** Text/link first; files later.

**Open questions to resolve before sprint:**

- Is 'one or more resource links' an array or a single field?
- Are notes markdown-supported or plain text?
- Are URLs auto-linkified?

---

### Feature 19 — Today’s lessons card

**Epic:** Dashboard · **Wave:** Wave 1B · **T-shirt size:** S

**User story.** As a parent, I need the dashboard to tell me what is due today.

**Acceptance criteria (done means).** Dashboard shows today’s tasks by child with status controls or quick links.

**Dependencies.** Daily/weekly lesson list; Lesson status states

**Build gate.** After features 14 and 15 built

**Source / why this feature exists.** Makes dashboard operational instead of decorative.

**MVP rationale.** Dashboard should tell parent where to start and what needs attention.

**Risk if scoped too richly.** Decorative dashboard wasting dev time.

**Risk if cut.** User feels lost after login.

**MVP decision:** MVP Core, thin

**Pains this feature addresses (1):**

- **PAIN-015 — Students need actionable task clarity** *(Primary relief, Strong)*
  - *How this feature relieves it:* Today’s lessons card brings daily work to the parent dashboard.
  - *Build implication:* Operational dashboard, not decoration.

**Data model entities involved:**

- `lesson_task` — Atomic work object for planner, progress, curriculum execution, and reports.

**Related canonical features:** Dashboard daily lessons

**Build queue notes.** Parent daily use begins here.

**Open questions to resolve before sprint:**

- What if there are zero lessons today — show empty state or hide the card?
- What if some children have no lessons? Show all children always or hide empty?


## Wave 1C — Homeschool records spine

*Proof that school happened.*

**Wave goal.** After Wave 1C, a parent can record attendance, see progress by subject, and review what was actually completed. The records that matter for compliance and confidence now exist.

---

### Feature 20 — Attendance record data model

**Epic:** Attendance · **Wave:** Wave 1C · **T-shirt size:** XS

**User story.** As a parent, I need attendance records for compliance and tracking.

**Acceptance criteria (done means).** System stores child, date, attendance status, optional notes, optional hours/minutes.

**Dependencies.** Add/edit child profile; School year setup

**Build gate.** After features 4 and 7 built

**Source / why this feature exists.** Attendance is a records/compliance spine item across competitors.

**MVP rationale.** Records confidence and compliance anxiety are buying triggers.

**Risk if scoped too richly.** Overbuilding compliance logic.

**Risk if cut.** Weak recordkeeping value.

**MVP decision:** MVP Core

**Pains this feature addresses (3):**

- **PAIN-018 — Parents need attendance proof** *(Primary relief, Strong)*
  - *How this feature relieves it:* Attendance record data and marking attendance prove school happened.
  - *Build implication:* Must be fast and visible.
- **PAIN-020 — Programs need safety/accountability attendance** *(Primary relief, Strong)*
  - *How this feature relieves it:* Gives programs a shared attendance record for safety, accountability, and follow-up.
  - *Build implication:* Role permissions and visibility rules matter.
- **PAIN-021 — Quran sessions need attendance proof** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Can support Quran/Hifz session record credibility if adapted to Quran workflows.
  - *Build implication:* Do not treat Quran sessions as generic class attendance only.

**Data model entities involved:**

- `attendance_record` — Daily attendance/time record for child/date.

**Related canonical features:** Attendance logs

**Build queue notes.** Do before advanced reporting.

**Open questions to resolve before sprint:**

- What's the attendance status enum — Present, Absent, Partial? Or Present, Absent, Excused, Sick, Holiday?
- Is there a 'Not Recorded' state, or do missing days simply not have records?
- Recommendation: keep it simple. Present, Absent, Partial.

---

### Feature 21 — Mark attendance by child/date

**Epic:** Attendance · **Wave:** Wave 1C · **T-shirt size:** S

**User story.** As a parent, I need to quickly record that school happened today.

**Acceptance criteria (done means).** Parent can mark present/absent/partial for a child/date and edit it later.

**Dependencies.** Attendance record data model

**Build gate.** After feature 20 built

**Source / why this feature exists.** Core compliance and recordkeeping task.

**MVP rationale.** Records confidence and compliance anxiety are buying triggers.

**Risk if scoped too richly.** Overbuilding compliance logic.

**Risk if cut.** Weak recordkeeping value.

**MVP decision:** MVP Core

**Pains this feature addresses (2):**

- **PAIN-018 — Parents need attendance proof** *(Primary relief, Strong)*
  - *How this feature relieves it:* Creates the daily record that school happened.
  - *Build implication:* Must be fast and visible from daily workflow.
- **PAIN-020 — Programs need safety/accountability attendance** *(Primary relief, Strong)*
  - *How this feature relieves it:* Gives programs a shared attendance record for safety, accountability, and follow-up.
  - *Build implication:* Role permissions and visibility rules matter.

**Data model entities involved:**

- `attendance_record` — Daily attendance/time record for child/date.

**Related canonical features:** Attendance logs

**Build queue notes.** Must be faster than paper log.

**Open questions to resolve before sprint:**

- UI pattern — calendar grid, daily list, quick-tap cards?
- Mobile vs desktop differences?
- Bulk-mark a week?

---

### Feature 22 — Optional hours/minutes field

**Epic:** Attendance · **Wave:** Wave 1C · **T-shirt size:** XS

**User story.** As a parent, I need to record hours when required or useful.

**Acceptance criteria (done means).** Attendance entry can store hours/minutes; blank allowed where not needed.

**Dependencies.** Mark attendance by child/date

**Build gate.** After feature 21 built

**Source / why this feature exists.** Some states/families need time records; avoid forcing all users.

**MVP rationale.** Some families need it; others should not be forced into it.

**Risk if scoped too richly.** Making all users feel legally burdened.

**Risk if cut.** Families in hour-based contexts lack required tracking.

**MVP decision:** MVP Core, optional

**Pains this feature addresses (1):**

- **PAIN-019 — Parents need hours documentation** *(Primary relief, Strong)*
  - *How this feature relieves it:* Supports time documentation where required without burdening families that do not need it.
  - *Build implication:* Optional, not universal; avoid compliance overreach.

**Data model entities involved:**

- `attendance_record` — Daily attendance/time record for child/date.

**Related canonical features:** Hours tracking

**Build queue notes.** Optional and unobtrusive.

**Open questions to resolve before sprint:**

- Validation rule — minutes 0-59, hours unconstrained, or capped at 24?
- Display format — '2h 30m' or '2.5 hours' or both?

---

### Feature 23 — Attendance summary

**Epic:** Attendance · **Wave:** Wave 1C · **T-shirt size:** M

> ⚠️ **RESOLVE BEFORE SPRINT.** 'Missing days' requires a rule: which days should have attendance? School days only? Every day? Weekday + active school year + non-holiday? This rule affects the summary's accuracy and the records review checklist (#35) downstream.

**User story.** As a parent, I need to know if records are complete.

**Acceptance criteria (done means).** Parent can see attendance count and missing days for selected child/year.

**Dependencies.** Mark attendance by child/date; School year setup

**Build gate.** After features 7 and 21 built

**Source / why this feature exists.** Summaries make records usable and audit-ready.

**MVP rationale.** Raw attendance entries need summary to create confidence.

**Risk if scoped too richly.** Overclaiming legal compliance.

**Risk if cut.** Attendance log is not useful enough.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-018 — Parents need attendance proof** *(Primary relief, Strong)*
  - *How this feature relieves it:* Turns daily records into reviewable totals and missing-day visibility.
  - *Build implication:* Summaries should not overclaim legal compliance.

**Data model entities involved:**

- `attendance_record` — Daily attendance/time record for child/date.

**Related canonical features:** Attendance summary

**Build queue notes.** Foundation for reports/export.

**Open questions to resolve before sprint:**

- **Define 'school days' rule.** Weekdays only? Weekday + active school year + non-holiday? Per-household configurable?
- What's a 'missing day' — only weekdays, only days in active school year?
- How is the summary scoped — current week, current month, school year?

---

### Feature 24 — Progress by subject

**Epic:** Progress · **Wave:** Wave 1C · **T-shirt size:** M

> ⚠️ **SCOPE DECISION NEEDED.** Done means lists four aggregations (child/subject/week/year). Building all four at once is L. Recommend scoping to two views at MVP — likely week and year as a toggle — and treating month/quarter as Wave 2.

**User story.** As a parent, I need to see progress without calculating manually.

**Acceptance criteria (done means).** Progress view shows completed/planned/skipped counts by child/subject/week/year.

**Dependencies.** Lesson status states; Subject/course setup

**Build gate.** After features 6 and 15 built

**Source / why this feature exists.** Repeated competitor value: progress tracking and parent clarity.

**MVP rationale.** Parents need visibility into what happened without manual calculation.

**Risk if scoped too richly.** Overbuilding grades/analytics.

**Risk if cut.** No progress confidence.

**MVP decision:** MVP Core, basic

**Pains this feature addresses (2):**

- **PAIN-005 — Progress is invisible until too late** *(Primary relief, Strong)*
  - *How this feature relieves it:* Progress insights can surface slipping performance before report periods.
  - *Build implication:* Make insights supportive and calm.
- **PAIN-023 — Assessment needs clarity without score obsession** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Analytics can clarify assessment but can also overemphasize scores.
  - *Build implication:* Balance metrics with narrative and mastery context.

**Related canonical features:** Progress summaries

**Build queue notes.** First version can be count-based.

**Open questions to resolve before sprint:**

- **Scope decision: which time aggregations ship in MVP?**
- Recommendation: week and year as a toggle. Defer month/quarter.
- How are 'planned' counts calculated — only lessons that exist, or also lessons that should exist based on recurrence?

---

### Feature 25 — Completed lesson history

**Epic:** Progress · **Wave:** Wave 1C · **T-shirt size:** S

**User story.** As a parent, I need a record of what we actually did.

**Acceptance criteria (done means).** Parent can filter completed lessons by child, subject, date range, and status.

**Dependencies.** Lesson status states

**Build gate.** After feature 15 built

**Source / why this feature exists.** Necessary for reports and parent confidence.

**MVP rationale.** Parents need visibility into what happened without manual calculation.

**Risk if scoped too richly.** Overbuilding grades/analytics.

**Risk if cut.** No progress confidence.

**MVP decision:** MVP Core, basic

**Pains this feature addresses (1):**

- **PAIN-003 — Scattered records weaken confidence** *(Primary relief, Strong)*
  - *How this feature relieves it:* Completed lesson history turns task status into a usable evidence trail.
  - *Build implication:* Needed for reports and parent confidence.

**Related canonical features:** Completed lesson history

**Build queue notes.** This becomes the evidence trail.

**Open questions to resolve before sprint:**

- Default sort — newest first?
- Pagination or infinite scroll?
- Export from this view too, or only from the records report?

---

### Feature 26 — Progress and attendance cards

**Epic:** Dashboard · **Wave:** Wave 1C · **T-shirt size:** S

**User story.** As a parent, I need the dashboard to show records health.

**Acceptance criteria (done means).** Dashboard shows current week attendance and subject progress for selected child/all children.

**Dependencies.** Attendance summary; Progress by subject

**Build gate.** After features 23 and 24 built

**Source / why this feature exists.** Makes dashboard useful for oversight.

**MVP rationale.** Useful, but can be thin if detailed summaries exist elsewhere.

**Risk if scoped too richly.** Dashboard bloat.

**Risk if cut.** Parent may miss records health signals.

**MVP decision:** Thin MVP only

**Pains this feature addresses (1):**

- **PAIN-005 — Progress is invisible until too late** *(Primary relief, Strong)*
  - *How this feature relieves it:* Shows current standing and projected outcomes before evaluation windows close.
  - *Build implication:* Avoid ranking culture and anxiety-heavy alerts.

**Related canonical features:** Dashboard progress cards

**Build queue notes.** Avoid too many cards in MVP.

**Open questions to resolve before sprint:**

- What's on each card at a glance — single number, mini-chart, status indicator?
- How many weeks of data — current week only, or 4-week trend?


## Wave 1D — Homeschool proof and export

*The confidence layer.*

**Wave goal.** After Wave 1D, a parent can capture proof of learning — photos, notes, links, reflections — and produce a credible, exportable records summary. The MVP is feature-complete: a parent can run a homeschool week from setup through compliance review.

---

### Feature 27 — Portfolio evidence data model

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** XS

**User story.** As a parent, I need to preserve proof of learning.

**Acceptance criteria (done means).** System stores evidence title, child, subject, date, type, notes, and created by.

**Dependencies.** Child profile; Subject/course setup

**Build gate.** After features 4 and 6 built

**Source / why this feature exists.** Portfolio/proof is central to Sheath and repeated competitor signal.

**MVP rationale.** Proof of learning is a key Sheath differentiator and record-confidence feature.

**Risk if scoped too richly.** Too many media/storage complications.

**Risk if cut.** No proof-of-learning layer.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Primary relief, Strong)*
  - *How this feature relieves it:* Creates a place for non-grade evidence such as files, notes, links, photos, and reflections.
  - *Build implication:* Do not make portfolio a random bucket detached from learning records.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.

**Related canonical features:** Portfolio / proof

**Build queue notes.** Data model before upload UI.

**Open questions to resolve before sprint:**

- What's the type enum for evidence — Photo, Document, Writing Sample, Project, Recitation, Other?
- Is 'created by' relevant in MVP (probably parent only) or only future-state?

---

### Feature 28 — Add portfolio evidence item

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** S

**User story.** As a parent, I need to add proof quickly after learning happens.

**Acceptance criteria (done means).** Parent can add evidence item with title, child, subject, date, type, and note.

**Dependencies.** Portfolio evidence data model

**Build gate.** After feature 27 built

**Source / why this feature exists.** This is the first real portfolio action.

**MVP rationale.** Proof of learning is a key Sheath differentiator and record-confidence feature.

**Risk if scoped too richly.** Too many media/storage complications.

**Risk if cut.** No proof-of-learning layer.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Primary relief, Strong)*
  - *How this feature relieves it:* Portfolio data model creates a place for learning proof beyond grades.
  - *Build implication:* Connect to learning records.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.

**Related canonical features:** Portfolio capture

**Build queue notes.** Keep simple; file handling next.

**Open questions to resolve before sprint:**

- What fields are required at minimum?
- Quick-add flow — one screen or wizard?

---

### Feature 29 — Attach evidence to lesson/task

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** S

**User story.** As a parent, I need proof connected to what was assigned/completed.

**Acceptance criteria (done means).** Evidence can link to one lesson/task; lesson view shows attached evidence.

**Dependencies.** Add portfolio evidence item; Lesson/task data model

**Build gate.** After features 12 and 28 built

**Source / why this feature exists.** Connects planner to portfolio, avoiding random file bucket.

**MVP rationale.** Valuable, but not required if evidence can attach to child/subject/date in MVP.

**Risk if scoped too richly.** Complex linking UX too early.

**Risk if cut.** Evidence less connected to exact assignment.

**MVP decision:** v1.1

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Primary relief, Strong)*
  - *How this feature relieves it:* Linking evidence to lessons prevents random file-bucket behavior.
  - *Build implication:* Connect proof to actual work.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.

**Related canonical features:** Portfolio-to-lesson link

**Build queue notes.** Very valuable after portfolio works.

**Open questions to resolve before sprint:**

- Can one evidence item attach to multiple lessons, or strictly one?
- Recommendation: many-to-one (one evidence → one lesson) for MVP simplicity.
- What's the UI on the lesson view — show count, show thumbnails, show list?

---

### Feature 30 — Upload file/photo/link/text evidence

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** L

> ⚠️ **SPLIT REQUIRED.** The done means caveat 'file/photo upload included if storage is ready' is doing massive work. File upload requires storage provider decision (S3, Cloudflare R2, equivalent), upload API, file size limits, MIME-type allowlist, progress indicators, error handling, and storage cost governance. Split into (30a) text note + URL evidence — ship this in Wave 1D; (30b) file/photo upload — separate sprint after storage architecture is decided. Do not let file upload block the rest of Portfolio.

**User story.** As a parent, I need to save photos, files, links, or text notes as proof.

**Acceptance criteria (done means).** Evidence supports text note and URL; file/photo upload included if storage is ready.

**Dependencies.** Add portfolio evidence item

**Build gate.** After feature 28 built

**Source / why this feature exists.** Portfolio without actual evidence capture is too thin.

**MVP rationale.** Evidence capture matters, but storage should not block the whole MVP.

**Risk if scoped too richly.** Storage/privacy delays.

**Risk if cut.** Portfolio feels thin without real artifact capture.

**MVP decision:** MVP simple; file optional

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Primary relief, Strong)*
  - *How this feature relieves it:* Lets users capture actual artifacts instead of only recording textual summaries.
  - *Build implication:* Storage/privacy architecture must be serious.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.
- `file_asset` — Metadata for uploaded photos/files linked to evidence.

**Related canonical features:** Evidence upload

**Build queue notes.** If storage delays, ship text/link first.

**Open questions to resolve before sprint:**

- **See split note above.** Storage architecture decision required.
- If file upload is deferred, ship URL + text only and label clearly.
- Max file size?
- Allowed MIME types — images only, or documents too?

---

### Feature 31 — Parent reflection/note on evidence

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** XS

**User story.** As a parent, I need to explain why an item proves learning.

**Acceptance criteria (done means).** Evidence has parent note/reflection visible in portfolio and report view.

**Dependencies.** Add portfolio evidence item

**Build gate.** After feature 28 built

**Source / why this feature exists.** Supports portfolio quality without complex grading.

**MVP rationale.** Basic note is enough for MVP; richer reflection can come later.

**Risk if scoped too richly.** Over-designed portfolio writing flow.

**Risk if cut.** Less rich evidence context.

**MVP decision:** v1.1 / Muslim-native layer

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Parent reflection explains why evidence matters.
  - *Build implication:* Useful for portfolio quality.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.

**Related canonical features:** Portfolio notes

**Build queue notes.** Useful for Muslim-native reflection later.

**Open questions to resolve before sprint:**

- Single text field or structured (what was learned, what surprised me, etc.)?
- Recommendation: single field, prompted with a placeholder.

---

### Feature 32 — Portfolio list and filters

**Epic:** Portfolio · **Wave:** Wave 1D · **T-shirt size:** S

**User story.** As a parent, I need to find proof later.

**Acceptance criteria (done means).** Parent can view and filter evidence items; empty states guide evidence capture.

**Dependencies.** Add portfolio evidence item

**Build gate.** After feature 28 built

**Source / why this feature exists.** Evidence must be retrievable to be useful.

**MVP rationale.** Evidence is only useful if retrievable.

**Risk if scoped too richly.** Overbuilding showcase portfolios.

**Risk if cut.** Evidence capture becomes a pile.

**MVP decision:** MVP Core

**Pains this feature addresses (1):**

- **PAIN-017 — Records need broader learning artifacts** *(Primary relief, Strong)*
  - *How this feature relieves it:* Portfolio evidence must be findable later.
  - *Build implication:* Filtering turns capture into usable portfolio.

**Data model entities involved:**

- `evidence_item` — Portfolio/proof of learning object.

**Related canonical features:** Portfolio view

**Build queue notes.** Turns capture into portfolio.

**Open questions to resolve before sprint:**

- What filters in MVP — child, subject, date range, type?
- Search by title?
- Sort options?

---

### Feature 33 — Basic records report view

**Epic:** Reports / Exports · **Wave:** Wave 1D · **T-shirt size:** M

> ⚠️ **BORDERLINE M.** Read-only view aggregating five data sources. Complexity is in layout and aggregation, not new logic. Treat as M but resolve the visual design question before sprint: how do five record types coexist on one page without overwhelming the parent?

**User story.** As a parent, I need a summary of homeschool records.

**Acceptance criteria (done means).** Report includes child info, subjects, attendance, completed lessons, and portfolio count.

**Dependencies.** Attendance summary; Progress by subject; Portfolio list and filters

**Build gate.** After features 23, 24, 32 built

**Source / why this feature exists.** Reports/exports are repeated competitor and homeschool compliance value.

**MVP rationale.** Report view turns records into usable confidence.

**Risk if scoped too richly.** PDF/export complexity too early if report itself is weak.

**Risk if cut.** Records remain trapped in app views.

**MVP decision:** MVP Core

**Pains this feature addresses (3):**

- **PAIN-003 — Scattered records weaken confidence** *(Primary relief, Strong)*
  - *How this feature relieves it:* Brings attendance, grades, notes, and evidence into one operational layer.
  - *Build implication:* Should remain core operating spine.
- **PAIN-022 — Formal records need credibility** *(Secondary relief, Strong)*
  - *How this feature relieves it:* Formal PDF outputs support credible documentation.
  - *Build implication:* Keep outputs honest about source and status.
- **PAIN-024 — Families need data trust and portability** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Export ability helps families trust data portability.
  - *Build implication:* Avoid lock-in; make clean data exit possible.

**Data model entities involved:**

- `report_request / report_export` — Tracks generated/exported record summaries.

**Related canonical features:** Reports / exports

**Build queue notes.** Start with readable HTML/print view.

**Open questions to resolve before sprint:**

- **Visual design needed.** How do five data types coexist on one page?
- Print-friendly by default or web-first?
- Date range picker?

---

### Feature 34 — Export records summary

**Epic:** Reports / Exports · **Wave:** Wave 1D · **T-shirt size:** L

> ⚠️ **SPLIT REQUIRED.** 'Export or print' hides a fork. Print is a print-stylesheet CSS problem. PDF export is either server-side rendering (Puppeteer, wkhtmltopdf) or client-side library (jsPDF). These are different architectures. Split into (34a) print-optimized records page using CSS print stylesheets — ship this; (34b) PDF download — separate sprint after rendering approach is chosen.

**User story.** As a parent, I need to save/share records outside the app.

**Acceptance criteria (done means).** Parent can export or print records summary for selected child/year/date range.

**Dependencies.** Basic records report view

**Build gate.** After feature 33 built

**Source / why this feature exists.** Export makes records portable and trustable.

**MVP rationale.** Portability is a trust feature.

**Risk if scoped too richly.** PDF engineering delays.

**Risk if cut.** Parents cannot save/share records confidently.

**MVP decision:** MVP simple export

**Pains this feature addresses (3):**

- **PAIN-003 — Scattered records weaken confidence** *(Primary relief, Strong)*
  - *How this feature relieves it:* Exports make centralized records reviewable outside the app.
  - *Build implication:* Prioritize records summary export before many decorative formats.
- **PAIN-022 — Formal records need credibility** *(Secondary relief, Strong)*
  - *How this feature relieves it:* Formal PDF outputs support credible documentation.
  - *Build implication:* Keep outputs honest about source and status.
- **PAIN-024 — Families need data trust and portability** *(Secondary relief, Medium)*
  - *How this feature relieves it:* Export ability helps families trust data portability.
  - *Build implication:* Avoid lock-in; make clean data exit possible.

**Data model entities involved:**

- `report_request / report_export` — Tracks generated/exported record summaries.

**Related canonical features:** PDF/export

**Build queue notes.** PDF can come after print-friendly view.

**Open questions to resolve before sprint:**

- **See split note above.** Print or PDF — pick one for MVP.
- If print: CSS print stylesheets, page break logic, header/footer.
- If PDF: client-side or server-side rendering?
- Filename convention?

---

### Feature 35 — Records review checklist

**Epic:** Records QA · **Wave:** Wave 1D · **T-shirt size:** S

**User story.** As a parent, I need to know if my records are incomplete.

**Acceptance criteria (done means).** Checklist flags missing attendance days, subjects without lessons, and no portfolio evidence.

**Dependencies.** Attendance summary; Progress by subject; Portfolio list and filters

**Build gate.** After features 23, 24, 32 built

**Source / why this feature exists.** Trust feature that prevents false confidence.

**MVP rationale.** Valuable trust feature, but may not be needed before basic reports/export.

**Risk if scoped too richly.** Legal/compliance overclaiming.

**Risk if cut.** Parents miss gaps.

**MVP decision:** v1.1 unless very thin

**Pains this feature addresses (1):**

- **PAIN-025 — Compliance confidence needs bounded guidance** *(Primary relief, Medium)*
  - *How this feature relieves it:* Checklist shows record gaps before export without claiming legal certainty.
  - *Build implication:* Trust feature, not legal guarantee.

**Data model entities involved:**

- `report_request / report_export` — Tracks generated/exported record summaries.
- `records_check` — Computed checklist/gap signals before export.

**Related canonical features:** Records checklist

**Build queue notes.** Do not overclaim legal compliance.

**Open questions to resolve before sprint:**

- What gaps are flagged — missing attendance days, subjects with no lessons, no portfolio items, anything else?
- Are these advisory (here's what's incomplete) or blocking (you cannot export until X)?
- Recommendation: advisory.


---

# 5. Build sequence summary

All 35 features in dependency order with t-shirt sizes for sprint planning.

| # | Feature | Wave | Epic | Size | Notes |
|---|---|---|---|---|---|
| 1 | Parent account sign-in | 1A | Account / Workspace | S |  |
| 2 | Household workspace | 1A | Account / Workspace | S |  |
| 3 | Child profile data model | 1A | Student / Child Profiles | XS |  |
| 4 | Add/edit child profile | 1A | Student / Child Profiles | S |  |
| 5 | Subject/course data model | 1A | Subjects / Courses | XS |  |
| 6 | Create subject/course for child | 1A | Subjects / Courses | S |  |
| 7 | School year setup | 1A | School Year / Term | S |  |
| 8 | Parent dashboard shell | 1A | Dashboard | M | **Split** |
| 9 | Child selector | 1A | Dashboard | S |  |
| 10 | Next setup prompt | 1A | Dashboard | S |  |
| 11 | Weekly planner structure | 1B | Planner | M | **Resolve first** |
| 12 | Lesson/task data model | 1B | Lessons / Tasks | XS |  |
| 13 | Add lesson/task | 1B | Lessons / Tasks | S |  |
| 14 | Daily/weekly lesson list | 1B | Lessons / Tasks | S |  |
| 15 | Lesson status states | 1B | Lessons / Tasks | S |  |
| 16 | Move/reschedule lesson | 1B | Planner | S |  |
| 17 | Basic repeating weekly pattern | 1B | Planner | L | **Split** |
| 18 | Parent lesson notes/resources | 1B | Lessons / Tasks | S |  |
| 19 | Today’s lessons card | 1B | Dashboard | S |  |
| 20 | Attendance record data model | 1C | Attendance | XS |  |
| 21 | Mark attendance by child/date | 1C | Attendance | S |  |
| 22 | Optional hours/minutes field | 1C | Attendance | XS |  |
| 23 | Attendance summary | 1C | Attendance | M | **Resolve first** |
| 24 | Progress by subject | 1C | Progress | M | **Scope decision** |
| 25 | Completed lesson history | 1C | Progress | S |  |
| 26 | Progress and attendance cards | 1C | Dashboard | S |  |
| 27 | Portfolio evidence data model | 1D | Portfolio | XS |  |
| 28 | Add portfolio evidence item | 1D | Portfolio | S |  |
| 29 | Attach evidence to lesson/task | 1D | Portfolio | S |  |
| 30 | Upload file/photo/link/text evidence | 1D | Portfolio | L | **Split** |
| 31 | Parent reflection/note on evidence | 1D | Portfolio | XS |  |
| 32 | Portfolio list and filters | 1D | Portfolio | S |  |
| 33 | Basic records report view | 1D | Reports / Exports | M | Borderline |
| 34 | Export records summary | 1D | Reports / Exports | L | **Split** |
| 35 | Records review checklist | 1D | Records QA | S |  |

**Size totals:** XS = 6 · S = 19 · M = 6 · L = 4

**Items requiring splits or pre-sprint decisions:** 8 (split or scope-decide), 17 (split required, highest risk), 30 (split required), 34 (split required), 11 (resolve wireframe), 23 (resolve school-day rule), 24 (scope aggregations), 33 (resolve visual design).

---

# 6. Cross-cutting concerns

Decisions that span multiple features and need a single answer rather than per-feature negotiation.

## 6.1 Authentication and session

Resolves before Feature #1. Affects every protected route across the app.

- Auth provider — managed (Clerk, Supabase Auth, NextAuth + provider) or self-rolled?
- Email verification — required at signup or deferred until first sensitive action?
- Session persistence — JWT, server session, or both?
- Password recovery flow — email link, OTP, or both?
- Multi-device sign-in policy.

**Recommendation:** managed auth provider for Wave 1. Don't custom-roll password security. The Data Model `notes` column for `user_account` says this explicitly.

## 6.2 Multi-tenancy and workspace scoping

Resolves before Feature #2. Affects every database query and every API endpoint.

- Every query must scope to the active `workspace_id`.
- Workspace membership is checked at the API middleware layer, not per-feature.
- Future-state: a single user may belong to multiple workspaces. MVP simplification: one workspace per user, but the schema supports the future case.

## 6.3 Feature module structure

Each feature module owns its own:
- API router (`features/<feature>/api/`)
- Data access layer / repository
- Page (`features/<feature>/page.tsx`)
- Dashboard widget (`features/<feature>/widget.tsx`)
- Shared types and validation schemas

The dashboard composes widgets from features. The dashboard does not own data. This is the architectural fix to the monolith CC flagged.

## 6.4 Empty states

Affects Features #8, #10, #19, #26, #32, and any list view in Wave 1.

Every list view, dashboard card, and report needs a designed empty state. The empty state should:
- Tell the parent why the section is empty (not a generic 'no data')
- Tell them the next action (create a child, add a subject, mark today's attendance)
- Link or button to that next action

Empty states are not afterthoughts. For a brand-new user, every screen is empty for several days.

## 6.5 Mobile vs. desktop

Wave 1 must work on mobile. Most homeschool parents log attendance and check today's lesson list from a phone. Wireframe decisions for Features #8, #11, #14, #21 must address mobile behavior explicitly, not as a responsive afterthought.

## 6.6 Validation

Use a single shared schema definition (Zod, Valibot, or equivalent) for both client and server validation. Never validate twice with different rules.

Per-feature validation rules (date ranges, required fields, enum values) should be defined in `features/<feature>/schema.ts` and imported by both the API route and the form component.

## 6.7 Date and time handling

Affects Features #7, #15, #20, #21, #22, and any feature with a date.

- Store all timestamps in UTC.
- Display in the household's local timezone (stored on `household_profile`).
- 'Today' is always relative to the household timezone, not the server.
- 'School year' is a date range stored as `start_date` and `end_date`, both inclusive.

## 6.8 Privacy and data trust

PAIN-024 is addressed across Wave 1 by:
- Soft deletion as default (children, subjects, lessons, evidence). Records are recoverable.
- Export endpoints in Feature #34 give the user their data back in a portable format.
- No third-party analytics, tracking, or advertising integrations in Wave 1.
- Audit log entity reserved (`audit_event`) but not built — append-only system record of important changes is a Wave 2/3 concern.

## 6.9 Accessibility

- All interactive elements must be keyboard-navigable.
- ARIA labels on dashboard tiles, status badges, and icon-only buttons.
- Color is not the sole indicator of state. Status badges include text, not just color.
- Touch targets ≥ 44px on mobile.

## 6.10 Performance

- Dashboard load < 2 seconds for a household with 5 children, 1 school year of records.
- Mark attendance interaction < 200ms perceived response time.
- List views (Features #14, #25, #32) paginate at 50 items.

---

# Appendix

## A. Glossary

**Wave.** A delivery sequence. Waves are dependency-ordered, not theme-ordered. A wave is ready to start when the prior wave is done.

**Epic.** A theme group cutting across waves. Used for code organization and feature documentation. Examples: Dashboard (touched in 1A, 1B, 1C), Portfolio (entirely within 1D).

**Pain.** An atomic, named burden experienced by a real user. Pains live in `Pain Canon`. Each pain has severity, frequency, and switching pressure scores.

**Pain map.** The relationship layer. Many features can relieve one pain; many pains can be relieved by one feature.

**Done means.** The acceptance criteria for a feature. The feature is not Built until Done Means is satisfied. Built ≠ QA Passed; QA tests against Done Means.

**Build gate.** The condition that must be true before the feature can begin. Examples: 'previous feature complete', 'design wireframe approved', 'storage decision made'.

## B. Source workbook

This document is derived from `Sheath_Academy___Competitor_Analysis.xlsx` — a 46-tab product operations workbook containing:

- 158 audited competitors
- 2,505 normalized feature signals
- 398 canonical features
- 33 atomic pains
- 130 pain-feature mappings
- 72 build queue rows (35 of them in Wave 1)
- 17 data model entities
- 23 backend architecture layers

The workbook remains the source of truth for evidence, audits, and the broader roadmap beyond Wave 1.

## C. Status tracking

Use the Build Queue tab in the workbook for status, Built?, and QA Passed? tracking. This document is the specification — it does not track work-in-progress state.

---

*End of Wave 1 Specification.*
