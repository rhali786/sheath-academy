# Submitted Feature Briefs — Sheath Academy

> Generated 2026-06-26T21:59:11.916Z — 4 unclassified submissions from production

---

## 78ec6a48-ab39-4182-ab3a-e7827eb13efb

- **Page:** /compliance
- **Sentiment:** good
- **Submitted:** 2026-06-25T23:32:24.038Z
- **User:** dev@sheathacademy.ai

# Feature Request: Compliance System (Sheath Academy)

## 1. TL;DR
Build a **homeschool compliance system** that continuously answers "Are we compliant right now, and what's next?" AND produces audit-ready documentation on demand. It spans all 50 US states, built as one integrated system across three pillars: (A) a correctness/status engine, (B) documentation + reporting, and (C) trust/safety/governance. State requirement rules are **Sheath-maintained** with **parent override** capability. Posture is informational, not legal advice — provenance and "last-verified" timestamps are required, not optional.

## 2. Why this scope
We analyzed 14 compliance competitors. The market splits into four archetypes: compliance engine, state-specific paperwork automation, offline-first recordkeeper, and portfolio-first reporting. Sheath should combine the best of all: a correctness engine PLUS documentation/reporting, wrapped in a strong trust posture. Compliance is a chain: **Requirements → Deadlines → Logging → Evidence → Exports → Status + next actions.**

## 3. Goal & success criteria
- Continuously compute compliance status (green / yellow / red) with explainable reasons and concrete next actions.
- Generate audit-ready artifacts matching what evaluators/districts actually request.
- Cover all 50 states via a Sheath-maintained ruleset, with parent overrides where families know better or rules change.
- Maintain trust: clear provenance, disclaimers, privacy controls, retention/deletion, export-anytime.
Success = a parent always knows their status and why, can fix gaps with the smallest action, and can export a defensible record instantly.

## 4. Scope (all three pillars, built together)

### Pillar A — Compliance correctness + status engine ("Are we compliant?")
Goal: continuously compute compliant / at-risk / non-compliant with reasons + next actions.
- **State + pathway selection** (some states have multiple compliance paths).
- **Requirements model**: days/hours, subjects, filings, deadlines, evaluation/testing, retention.
- **Deadline engine**: generates a timeline from state rules + the family's school-year configuration.
- **Progress engine**: days/hours progress, subject coverage, "required artifacts complete?"
- **Status + why**: explainable status — what passed/failed and what to do next.
- **Missing-data detection**: detect gaps, propose the smallest fix.
- **Lightweight self-audit** → action items.
- **Submission tracking + audit trail**: drafted → sent → accepted, with timestamps + stored copies.

### Pillar B — Documentation + reporting ("Prove it instantly")
Goal: generate audit-ready artifacts that match evaluator/district expectations.
- **Fast capture**:
  - attendance (days and/or hours modes)
  - activities by subject + date
  - evidence/work samples (photo/file/link) tagged by subject/date
  - catch-up/backfill flow for when parents fall behind
- **Document generation** (state-formatted where applicable): LOI/NOI, IHIP/plan, quarterly/periodic reports, annual summary/assessment, etc. (varies by state).
- **Binder-quality exports** (one-click PDF):
  - attendance logs (date range)
  - subject/activity summaries
  - evidence portfolio
  - state forms / summaries
  - "what's included / what's missing" transparency
- **Sharing controls**: redaction options; share links vs download; per-child vs whole-family packet.

### Pillar C — Trust, safety, and governance (non-negotiable)
- Clear "informational, not legal advice" posture throughout.
- Requirement provenance: source links + last-verified timestamp on every state rule.
- Privacy-first defaults + export anytime.
- Retention/deletion controls.

## 5. Requirements data model: Sheath rules + parent overrides
- Sheath maintains a **structured 50-state ruleset** (requirements, deadlines, forms, evaluation rules, retention), each entry carrying **source link + last-verified timestamp**.
- Parents can **override** specific rules for their family (e.g., their district's known interpretation, a rule that changed) — overrides must be clearly marked as parent-set and must not silently overwrite the Sheath source-of-record.
- When a Sheath rule updates after a parent override exists, the system should surface the conflict for the parent rather than auto-resolving.
- Status calculations must always show which rule version (Sheath vs parent override) was applied.

## 6. Hard constraints (LOCKED — non-negotiable)
- **Informational, not legal advice** — surfaced clearly wherever requirements/status are shown.
- Every state rule must carry **provenance (source link) + last-verified timestamp**; no unsourced requirements.
- Status must be **explainable** — never show green/yellow/red without the "why" and the next action.
- **Privacy-first**: export anytime, retention/deletion controls, no unnecessary data sharing.
- Parent overrides are marked and auditable; they never silently replace the Sheath ruleset.
- Records and exports must be **defensible** — accurate timestamps, stored copies, clear "what's included/missing."
- Do not present generated documents as legally filed/accepted unless the submission tracker confirms that state.

## 7. The compliance chain (reference architecture)
Build the system around this pipeline; each stage feeds the next:
**Requirements → Deadlines → Logging → Evidence → Exports → Status + next actions.**
- Requirements (Pillar A, Section 5) define what's needed.
- Deadlines (A) turn rules + school year into a timeline.
- Logging (B) captures attendance/activities.
- Evidence (B) captures tagged work samples.
- Exports (B) assemble audit-ready artifacts.
- Status + next actions (A) continuously summarize where the family stands and what to do.

## 8. Acceptance criteria
- A parent can select their state + pathway and immediately see required days/hours, subjects, filings, deadlines, and retention rules — each with provenance + last-verified date.
- The system computes green/yellow/red status with an explainable breakdown and a prioritized next-action list.
- Missing-data detection identifies gaps and proposes the smallest fix.
- Parents can capture attendance (days/hours), activities by subject/date, and evidence tagged by subject/date, including a backfill flow.
- The system generates the correct state-formatted documents and one-click binder-quality PDF exports, with "what's included / what's missing" transparency.
- Submission tracking records drafted → sent → accepted with timestamps + stored copies.
- Every requirement displays source + last-verified timestamp; the "not legal advice" posture is visible.
- Parent overrides are supported, marked, and auditable; rule-update conflicts are surfaced, not auto-resolved.

## 9. DO NOT BUILD YET / flag for human (strict guardrails)
Do NOT invent or hardcode these; STOP and flag for human decision:
- **Any state requirement Sheath cannot source** — never fabricate a state's rules, deadlines, or forms. If authoritative data is unavailable for a state, mark it "not yet verified" rather than guessing.
- Legal interpretations or advice of any kind beyond informational summaries.
- Auto-submission/filing to any state agency without explicit human-in-the-loop confirmation.
- Treating a generated document as accepted/filed without submission-tracker confirmation.
- Any data-sharing default beyond privacy-first.
- Auto-resolving conflicts between Sheath rules and parent overrides.

## 10. Open questions for the human
Surface these in your plan; do not decide them yourself:
1. Authoritative source(s) and update cadence for the 50-state ruleset (how rules are verified and re-verified).
2. Which documents/forms are in v1 per state vs deferred (state form coverage varies widely).
3. How states with multiple compliance pathways are presented and switched.
4. Default retention period and deletion behavior.
5. Evidence storage limits and file-type support.
6. How "accepted" status is confirmed in the submission tracker (manual parent confirmation vs other).

## 11. Human-in-the-loop
- Present the build plan — especially the 50-state data-sourcing approach (Section 10, #1) and the v1 form coverage list (#2) — for human approval BEFORE building.
- Any feature touching submission to agencies, legal posture, or data retention requires explicit human review.
- Present built features for human review before merge/release.

---

## c71a4161-6191-40e7-9ab1-3d8cf8d2955e

- **Page:** /growth
- **Sentiment:** good
- **Submitted:** 2026-06-25T23:27:36.708Z
- **User:** dev@sheathacademy.ai

# Feature Request: Platform Badge System (Gamification v1)

## 1. TL;DR
Build an **optional, platform-level achievement-badge system** for our homeschooling/learning platform (Sheath), modeled on **Boy Scout–style merit badges**: a student earns a badge by *demonstrating mastery* of something, backed by evidence and parent/teacher verification. This is the v1 of gamification. It is deliberately narrow — badges and the things that make badges meaningful — and it explicitly excludes streaks, XP, points, ranks, competition, and reward shops. It is curriculum-agnostic: families use any curriculum, so do not build subject-specific badge maps. Sheath ships a starter badge set; parents/teachers can override criteria and add their own.

## 2. Why this scope
We evaluated the full gamification space (education tools, habit systems, productivity systems, Scouting advancement, BJJ belts) and chose to start with **capability-based recognition only**. Badges are the mechanic that makes invisible learning *mean* something without distorting behavior into point-chasing. Motivation mechanics (streaks/XP) and progression ranks are deferred to later phases.

## 3. Goal & success criteria
- A student earns a badge ONLY by demonstrating a skill/achievement with evidence + verification.
- Badges never auto-award from time logged, attendance, completion, or speed.
- Parents/teachers can configure, approve, disable, and audit every badge.
- The badge layer never writes to or alters the assessment/mastery record of truth.
Success = badges are meaningful, evidence-backed, parent-governed, and the system stays simple.

## 4. Scope
### In scope
- Evidence-linked achievement badges (Scouts-style).
- A Sheath-provided starter badge set, with parent/teacher override + custom badges.
- Badge criteria, evidence attachment, and a verification/approval flow.
- Earned-autonomy unlocks as the "reward" for badges (instead of any currency/reward shop).
- A badge-collection view that doubles as a continuity timeline across years.
- Grade-band presentation of the same badge engine.
- Parent/teacher governance: toggle, approve, verify, set visibility, opt out.
- Minimal "I did it" acknowledgment feedback for Grades 1–4 ONLY (see Section 8).

### Out of scope
- Subject-specific badge maps (history, science, math, literature, Islamic studies, etc.).
- Curriculum-specific quests.
- Student reward shops / spendable currency.
- Public leaderboards.

## 5. Hard constraints (LOCKED — non-negotiable)
- Badge system is an **optional overlay**, not required for core platform use.
- Scope is **platform-level**, not curriculum-specific.
- **No XP, points, or streaks** in v1 (minimal young-kid acknowledgment in Section 8 is NOT a streak/XP system).
- **No mastery ranks / belt progression** in v1 (deferred).
- **No competition** and **no public leaderboards**.
- **No student currency / reward shop.**
- Official badges require meaning: criteria, evidence, AND verification.
- **Keep assessment truth separate** from the badge layer; badges never modify records of truth.
- Continuity creates belonging, not functional/academic advantage.

## 6. Architecture: Mastery layer + thin Memory layer
Keep the data model cleanly separated from any future motivation layer.

### Mastery layer (the heart of v1)
- Evidence-linked badges.
- Badge criteria definitions.
- Parent/teacher verification + approval.
- Earned-autonomy unlocks tied to demonstrated reliability.

### Memory layer (thin in v1)
- Badge-collection timeline: prior-year + current-year badges, portfolio highlights, reflections, parent-visible history.
- **Rule:** the timeline creates belonging, not power, unlocks, or academic advantage.

(Motivation layer is intentionally NOT built in v1 — see Section 11.)

## 7. How a badge works (core flow)
1. A badge exists with defined **criteria** (from the Sheath starter set or a parent/teacher custom/override).
2. The student does the work and **submits evidence** (using the existing platform capture — see Section 10).
3. A parent/teacher **verifies** the evidence meets criteria and **approves** the award.
4. The badge is added to the student's collection/timeline.
5. Optionally, the badge **unlocks earned autonomy** (more independent work, expanded choices) per parent settings.

### Counts toward a badge (requires evidence/criteria/verification)
- Demonstrating a skill against the family's chosen curriculum criteria
- Submitting work that meets a defined standard
- Correcting and explaining prior mistakes
- Showing retention after a delay
- Completing a portfolio milestone
- Earning parent/teacher verification
- Moving from guided to independent work

### Never awards a badge by itself
- Time logged without evidence
- Clicking through tasks
- Attendance alone
- Speed alone
- Repeated attempts without improvement or verification

## 8. Badge content model: starter set + parent overrides
- Sheath ships a **starter set** of curriculum-agnostic badges (completion-quality, review, correction, evidence, reflection, consistency, independence, demonstrated capability categories — NOT tied to one curriculum's sequence).
- Parents/teachers can **edit criteria**, **disable** badges, or **create custom** badges.
- Each badge stores: name, description, criteria, required evidence type, verification requirement, grade-band(s), and parent-visibility setting.
- **Do not invent rank names or a fixed master badge inventory beyond a small starter set** — keep the starter set small and meaningful (see Section 11).

## 9. Grade-band presentation (one engine, three surfaces)
### Grades 1–4 (Elementary)
Simple, friendly badges; gentle celebration on award; parent-supported prompts; "I practiced / I finished / I corrected" markers as **minimal acknowledgment feedback** (NOT streaks, NOT XP); minimal settings shown to the child.

### Grades 5–8 (Middle)
Skill badges with clear criteria; reflection prompts; growing autonomy choices unlocked by badges; progress shown as badge collection, not points.

### Grades 9–12 (High)
Mastery-oriented badges + portfolio milestones; serious progress language; evidence-based; earned autonomy; minimal childish animation or game framing.

## 10. Boundary: badges respond to events, they do not capture them
**The badge system owns recognition logic, not event capture.**
- The existing session/workflow + evidence-capture layer owns HOW work and evidence are recorded (timer, controls, checklist, evidence upload, parent confirmation).
- The badge system owns WHAT recognition happens after a trusted event/evidence is recorded.
Do not build or modify the session timer/tracker or evidence-capture UX in this work.

## 11. DO NOT BUILD YET (strict guardrails)
Do NOT invent, scaffold, or hardcode these. If a design seems to need them, STOP and flag for human decision.
- Any XP, points, or streak mechanic.
- Mastery ranks / belt-style progression / rank vocabulary.
- A large fixed badge inventory beyond a small starter set.
- Continuity surface final name (Legacy Shelf vs Learning Timeline vs Portfolio vs Yearbook).
- Competition, leaderboards, teams, houses, or community-wide progress.
- Cooperative/group progress mechanics.
- Student currency / reward shop / spendable economy.
- Personal-bests / self-comparison scoring.
- Parent-rhythm / weekly-stewardship tooling.
- Quests/maps.
- Subject-specific badges for any Sheath-owned curriculum.
- Engagement-data automation or recommendations.

## 12. Open questions for the human
Surface these in your plan; do not decide them yourself:
1. Exact starter badge set (which curriculum-agnostic badges, and how many before it feels noisy).
2. Verification model granularity — which badges need parent vs teacher vs portfolio vs oral/written demonstration.
3. Continuity surface naming.
4. Visual playfulness per grade band (aniconic-friendly constraints).
5. What earned-autonomy unlocks should actually grant in the product.

## 13. Acceptance criteria & human-in-the-loop
- Badge system is fully optional and can be disabled platform-wide by a parent.
- No badge ever auto-awards without evidence + verification + parent/teacher approval.
- No badge action writes to or alters the assessment/mastery record of truth.
- Sheath starter badges exist and are fully editable/disable-able; parents can add custom badges.
- The same engine renders three distinct grade-band surfaces.
- Grades 1–4 acknowledgment feedback exists and is NOT a streak/XP system.
- Nothing from Section 11 is implemented.
- **Human checkpoint:** present the plan and any Section 12 decisions for human approval BEFORE building; present built features for human review before merge/release.

---

## 1032a087-60c3-4e3e-845d-b8a53477fa88

- **Page:** /growth
- **Sentiment:** good
- **Submitted:** 2026-06-25T23:09:42.975Z
- **User:** dev@sheathacademy.ai

# BUILD BRIEF — "Sheath Gradebook" (full feature, standalone build)

## 0. Your job
Read this brief in full, produce a build plan, then implement a complete, working Gradebook feature for a homeschool platform ("Sheath"). Build the FULL target scope described here — do not ship an MVP, do not phase, do not drop features as "later." Where a capability depends on systems that don't exist yet (Grading, Attendance, Compliance, Gamification), build the Gradebook standalone and stub the integration seam behind a clean interface (see §9). Ask me before substituting any feature with a simpler version.

## 1. Product context & who it's for
Sheath is a homeschool platform. The Gradebook RECORDS and REPRESENTS assessment results over time — turning individual grades into trends, report cards, transcripts, and credible records. It is downstream of "Grading" (which produces marks) but MUST fully support manual entry with no grading step.

Users:
- **Parent-teacher (primary):** one adult across multiple ages, subjects, and pedagogies. Not a registrar, not a 150-student teacher. Wants "where is each learner at" at a glance and a credible report/transcript on demand without busywork.
- **Learner:** understands progress without demotivation; knows exactly what to redo.
- **Compliance/records:** generates defensible records (esp. high-school grades / state reporting) that hold up.

## 2. Core design principles (non-negotiable)
1. **Configurable by default ("options, not dictation").** Never force a school's structure (semesters, fixed GPA, rigid categories). The family chooses grading scale, aggregation rule, reporting cadence, and whether formal "courses"/"terms" even exist.
2. **Trust posture.** AI/grading suggestions are advisory; the parent owns the recorded score. Every grade is overridable and auditable with full change history.
3. **One living record (designed-for, stubbed now).** The gradebook is one facet of a single shared student record (grading + attendance + compliance + gamification). Build standalone but model data and interfaces so these later attach with nothing to "sync."
4. **Provenance-based credibility (anti-surveillance).** Every recorded grade can carry its work sample, change history, and source so records are defensible to colleges/states WITHOUT surveillance, paywalls, or a registrar.
5. **No paywalls on the family's own data.** Export, transcripts, and report cards are rights, never premium unlocks.

## 3. Data model (build these entities + relationships)
- **Household** → has many **Learners**, has many **Users** (adults/children) with **Roles** (owner, co-parent, child-portal).
- **Learner** → has many **Subjects**.
- **Subject** (base unit) → optional promotion to a formal **Course** layer that unlocks credits/GPA/transcripts. Subjects exist without courses.
  - fields: name, gradingScaleId, aggregationRuleId, optional standardsSetId, isFormalCourse (bool), creditHours (nullable), termModel (nullable).
- **Assignment** → belongs to Subject/Course.
  - fields: title, type (e.g. quiz/test/project/practice/reading/memorization), optional dueDate, gradingMethod (points/percent/letter/mastery/completion/rubric), categoryId, standardsAlignment (array — one assignment may align to MULTIPLE standards), weight overrides.
- **Attempt/Submission** → belongs to Assignment + Learner; timestamped; supports multiple attempts/history.
- **Score** → belongs to Attempt. Type: numeric | percent | letter | rubric (per-criterion) | mastery level | completion.
  - state enum: graded | not-graded | missing | excused | complete. **`missing`/`not-graded`/`excused` MUST NEVER count as 0** in any average.
  - fields: value, isOverride (bool), source (auto-graded | parent-entered | publisher | outside-work | AI-suggested), evidenceRefs (attachments/work samples), comment.
- **GradingScale** (per-subject): number / percent / letter / mastery / completion; fully custom scales with custom cut points.
- **Category** (weighted categories per subject/course).
- **AggregationRule**: simple average | weighted categories | drop-lowest/best-of | mastery rollup (most-recent | decaying-average | highest) | subject-level rollup. Mixed paradigms must coexist in one record.
- **StandardsSet**: importable Common Core / per-state / custom / Islamic Studies strands. Importing standards is OPTIONAL and never a prerequisite to grade.
- **Term/Period** (OPTIONAL): family-defined; no semester lock.
- **MasterySkill** (for retention tracking): tracks whether a skill STICKS over time (decay-aware), the Qur'an/math-facts archetype — first-class, not a side feature.
- **ChangeHistory/AuditLog**: every grade change records who + when + old→new + reason.
- **CommentBank**: reusable narrative comments.

## 4. Aggregation & calculation engine (spec)
- Per-subject choice of scale; scales mixable across subjects in one learner.
- **Dual projection from the SAME scored work:** produce BOTH a points/percent/GPA view AND a standards/mastery view off one set of scores. Do not force the family to choose points OR standards.
- Auto-GPA: weighted + unweighted; honors weighting; credits-from-hours; four-GPA calc.
- Mastery calc method configurable per subject: most-recent | decaying-average | highest.
- **Decay-aware mastery:** retention is first-class — model skill decay over time and surface "needs review/refresh."
- Defaults (all overridable): simple transparent average for points subjects; most-recent for mastery subjects; **auto-zeroing OFF**; **drop-lowest OFF**; no decaying-average default; no semester-lock default.
- Rubric scoring with independent per-criterion scales.

## 5. Screens / UI (build all)
- **Multi-child command center / overview:** all learners at a glance; per-subject status; "needs attention" queue (missing work, low-confidence AI grades, decaying skills).
- **Per-learner snapshot:** subjects, current standing, trends.
- **Per-subject trend view:** over time; mastery + points toggle that is UNAMBIGUOUS (avoid the confusing dual "what's my grade" toggle — label clearly which is calculated vs projected).
- **Gradebook entry grid:** fast manual entry AND auto-flow intake; bulk "clear the pile" grade-all flow reshaped for one-parent-×-several-kids; inline annotation of worksheets/photos that flows to the record; explicit not-graded/missing/excused/complete marks.
- **Assignment & attempt detail:** attempt history, evidence attachments, override control (clearly marked vs calculated), comment bank.
- **Reports builder:** report cards, on-demand progress reports (any time, not just term end), transcripts.
- **AI Analyst panel (differentiator):** plain-language trends, flags, and "what to do next" for a non-expert solo parent — NOT admin-gated classroom analytics. Reliability/restraint is an explicit feature (don't over-claim).
- **Child/family portal:** child logins with appropriate, parent-controlled visibility.
- **Settings:** scales, categories, aggregation rules, terms, standards import, defaults — all editable by the parent without an admin/registrar role.

## 6. Reports & transcripts
- Configurable report cards (sub-grades, narrative comments).
- College-ready transcripts: one-click + customizable; weighted + unweighted GPA; honors; credits-from-hours; course-name auto-suggest; pre-submission error checking; print-ready; secure e-transcript delivery; one-click pull of gradebook grades into transcript; PDF export with date range.
- On-demand progress reports (generate anytime).
- Combined **attendance + grades PDF bundle** for compliance/state (attendance stubbed per §9).
- Credibility rests on verifiable provenance + attached evidence, NOT just formatting. Transcripts must NOT be limited to "completed courses only."

## 7. Exports & portability
- CSV export; printable PDF bundles with date ranges; attach work samples.
- **State-reporting formats — maintained, configurable per-state library (all 50 states)** with customizable fields, exportable on demand.
- Selective flagging of which items/work samples surface into portfolio or export.
- Full data ownership/export as a first-class right. Portfolio/evidence export is a primary artifact, not an afterthought.

## 8. Trust, audit & permissions
- Always-available manual override, clearly marked vs calculated.
- Full grade-change history / audit log (who/when/old→new).
- Household roles + visibility; child logins / family portal.
- Reusable comment bank.
- Advisory, opt-in originality/authenticity check — never an auto-accusation.
- Must work without forcing an online-only model where avoidable; design for local/offline-tolerant access.

## 9. Cross-feature integration SEAMS (stub now, clean interface)
Define typed interfaces + adapters (with a working local/mock implementation) so these attach later with nothing to sync:
- `GradingSource` → ingests evidence-rich marks + work samples into Attempt/Score.
- `AttendanceSource` → supplies attendance for the combined PDF bundle + credits-from-hours.
- `ComplianceSink` → consumes records for state reporting.
- `GamificationEmitter` → Gradebook EMITS events (new score, mastery achieved, streak); gamification decides the response. Gradebook never owns reward logic.
- One shared `StudentRecord` such that a single captured artifact can become grade + evidence + attendance + mastery event without duplication.

## 10. DESIGN-AGAINST list (real failure modes — do NOT do these)
- Auto-zeroing unsubmitted/ungraded work into the average.
- Setup that requires an admin/registrar before a parent can grade.
- Paywalled transcript/report-card printing or export; free tier with no transcripts at all; surprise recurring billing.
- Transcripts listing only "completed" courses.
- Ambiguous dual grade toggle; clunky edit flows; unintuitive UX.
- Online-only with no offline/local access; ads in the gradebook; split admin-vs-teacher interfaces; school/district role complexity; a manual "post grades" gate that hides or drops entered scores.
- Curriculum lock-in (only grading the vendor's own content).
- Splitting the gradebook from the record so grades must sync between systems.

## 11. Differentiators that MUST ship (the "for the win" layer)
1. One living record (modeled now, seams stubbed).
2. Dual points + standards gradebooks off the same evidence; mastery and GPA/transcript projected together.
3. Configurable mastery calc + decay-aware retention tracking.
4. AI analyst for the non-expert solo parent.
5. Provenance-based credibility (work sample + change history + source on every grade).
6. Importable standards libraries incl. Islamic Studies strands; multi-standard alignment.
7. Family-owned, fully exportable.
8. Real-time alerts on new scores; reusable comment bank; rubric scoring with independent per-criterion scales.

## 12. Acceptance criteria (must all pass)
- A parent can create a learner, a subject, and record a grade manually in under a minute with NO grading step, NO course, NO term, and NO admin setup.
- Missing/excused/not-graded items provably never lower an average.
- The same scored work renders BOTH a GPA/points view and a mastery/standards view.
- A subject can use a different scale and aggregation rule than another subject for the same learner, simultaneously.
- A mastery subject shows decay/retention status and a "needs review" flag.
- A college-ready transcript generates in one click with weighted+unweighted GPA, honors, credits-from-hours, attached evidence, and PDF export — with no paywall.
- An on-demand progress report and a combined attendance+grades PDF bundle generate at any time.
- Every grade shows source + override status + full change history.
- State-reporting export works for a configurable per-state format.
- Full CSV + data export available to the family with no premium gate.
- AI analyst returns plain-language trends/flags/next steps for the multi-child overview.
- Integration seams (§9) exist as typed interfaces with working mock adapters; removing the mock and attaching a real source requires no schema change.

## 13. Deliverables
- Data model / schema.
- Aggregation engine with configurable rules + tests proving the no-zero and dual-projection guarantees.
- All screens in §5.
- Reports/transcripts/exports in §6–7.
- Audit/permissions in §8.
- Integration seams + mock adapters in §9.
- A short README mapping each delivered piece to §11 differentiators and §12 acceptance criteria.

---

## 418c2940-88eb-4a2c-b36f-ed09a44eed5e

- **Page:** /plan
- **Sentiment:** good
- **Submitted:** 2026-06-19T04:59:48.659Z
- **User:** dev@sheathacademy.ai

Lesson Planner — Feature Scope → Developer Feedback Package (Build Toward the Hub Vision)
0) Intent / North Star (what we’re building)
The Lesson Planner should make it fast to turn intent into a runnable, structured lesson plan and schedule/assign it across multiple learners—while staying minimal-by-default, trustworthy, and non-destructive.
The target experience is a three-stage loop:
1) Preparation: create/ingest plan fast → review/correct → structure into strict step model → segment into assignable units → assign/schedule  
2) Execution: Learning Time Screen runs the session with minimal friction (Lesson Planner does not own the “do” cockpit)  
3) Administration: review/reuse/iterate plans + maintain a reusable library without guilt/backlog pressure
1) What already exists (good foundation; keep and align)
Based on current UI evidence:
1.1 Weekly scheduling control plane exists (/plan)
Week navigation (Prev/Next, Today, date picker)
Weekly grid with lesson items and drag/reschedule affordances
Keyboard drag-and-drop accessibility instructions (good)
1.2 A lesson record surface exists (/lessons)
List management + filters (learner, status, sort)
Inline edit mode via ?editId=...
Manual Save/Cancel
Delete action exists
“Today” panel exists
1.3 The system already supports advanced semantics (important)
Completion window model: “Available from” → “Due date” (not just a single scheduled day)
Status model includes: Not started / Completed / Skipped
“Group lesson” exists + propagation control (“Apply changes to all learners in this group”)
These are strong primitives; now we need to make them coherent, scalable, and aligned with the hub’s principles.
2) Core alignment gaps (what blocks the “hub dream” today)
2.1 The planning grid does not scale visually (screenshot issue)
Current default is effectively Child × Subject × Day → vertical explosion. With 4 kids × 7 subjects it becomes cumbersome to scan and manipulate.
2.2 Key semantics are ambiguous
Drag/drop says “Drag to reschedule” but it’s unclear what rescheduling means in a completion window world (does it change due date, available-from, shift the window, or a separate planned day?).
“Planbook vs Lesson Planner vs Lessons” is overlapping terminology; user can’t predict where to author vs schedule vs edit.
2.3 Trust/safety protections are incomplete
Filters and empty states need “why is nothing showing?” diagnostics.
Reschedule actions need Undo and non-destructive defaults (preview/undo direction).
2.4 The structured lesson plan model (strict step contract) is not visible/implemented in the current surfaces
The hub’s locked requirement includes strict step fields (Step text + Type + Done criteria; quantity optional) and segmentation into units for execution handoff. Current observed lesson schema is metadata-level, not step-level.
3) Required system decisions (make these explicit in code and UI)
To avoid building inconsistent behavior across surfaces, decide and document:
3.1 Lesson data model: individual vs group
Current UI implies both:
Planbook creation can select multiple learners
Lessons edit shows single Child plus “Group lesson” and propagation checkbox
Decision required: implement an explicit group model (recommended):
Group lesson (shared template/parent)
Per-learner instances (status/completion can vary)
Propagation defines which fields sync across instances
3.2 Scheduling semantics in a completion-window model
Decision required: what does a “planned day” mean relative to Available-from/Due?
Option: add an explicit Planned Day separate from window
Or define drag/drop updates Due date only (or shifts the entire window)
This decision determines how Planbook renders and how rescheduling behaves.
3.3 Validation and invariants
Enforce available_from <= due_date when both present
Fix the observed inverted range display (“Jun 18 – Jun 11”) as either render bug or invalid stored data (address both)
4) UI/UX build feedback to make current surfaces match the hub vision
4.1 Make the Planbook planning grid compact and household-scalable (minimal-by-default)
Change default layout:
Rows = Children only
Columns = days of week
Inside each child/day cell, show lesson chips/cards labeled with Subject + Title + Duration + Status
Add view modes (progressive disclosure):
By Child (default, compact)
By Subject (focus mode)
Expanded Child×Subject (power mode only)
Add sticky headers:
Sticky day header row
Sticky child column
This directly solves the vertical blow-up while preserving the weekly/timetable control plane primitive.
4.2 Clarify “Add lesson” as a contract (create vs schedule vs reuse)
Currently Planbook has an inline creation form; keep it, but make it predictable:
Label the section “Create lesson” and allow collapse
Make required fields explicit (Title? Due date? Learner selection?)
Keep Course/Subject dependent on learner, but handle edge cases:
If learner selected and there are no active courses: show a clear message + CTA
Important: define what “Add lesson” creates:
A new lesson record (and optionally schedules it), vs scheduling an existing template  
If both are needed, use a split action:
Schedule existing
Create new
4.3 Make rescheduling safe and explainable (trust protection + non-destructive defaults)
After drag/drop: show toast “Moved X to Friday” + Undo
Ensure keyboard drag/drop triggers same feedback
If completion-window semantics apply, show what changed:
“Due date updated to …” or “Planned day set to …”
4.4 Fix filters and empty states so nothing “disappears”
Convert Children/Subjects into clear filter pills
Rename “Clear” → Clear filters
Add filtered-out empty state: “No lessons match your filters” + Clear filters
Add setup empty state: if no children/subjects exist, show “Add a child/subject to start”
4.5 Lessons page edit safety (manual save is fine—make it robust)
Disable Save until changes exist
Warn on navigation away with unsaved changes
Make Cancel revert reliably
For Group lessons:
clarify delete semantics (delete instance vs entire group)
propagation checkbox default OFF with explanation of what propagates
4.6 Resource link: validate and make intentional
Validate URL field (helpful inline error)
If URL-only is intentional now, label it clearly; if multiple resources later, plan schema accordingly
5) Missing capabilities to fulfill the hub’s full scope (must be built next)
To make the “hub dream” real, the current system needs these additional capabilities beyond schedule+metadata:
5.1 Structured plan authoring (strict step contract)
Implement the step model with required fields:
Step text
Type (from default vocabulary)
Done criteria
Quantity/target optional
This can live in a dedicated “Lesson Planner” authoring surface or a drill-in from Lessons.
5.2 Multi-modal ingestion + confirm/correct loop
Add dictation / OCR / paste ingestion with:
extracted structure
uncertainty highlighting
fast review/correct
5.3 Segment into assignable units + execution handoff
Turn plan into assignable units that Learning Time Screen can run:
Start now / Start next / ad hoc entry points
payload includes context + tasks + optional suggested mode
5.4 Repair layer completeness (beyond single-item drag/drop)
Implement non-destructive reschedule primitives consistent with the hub:
batch shifts + vacations
preview counts (moved/skipped/conflicts)
explicit conflict policy
reversible operation log (not just one-step undo)
5.5 Optional governance toggles
If needed for co-ops/tutors:
draft/ready/review states
reviewer queue + feedback loop
artifacts/export (optional)
6) Acceptance checks (how we’ll know we matched the hub direction)
A multi-child household with many subjects can plan a week without the UI becoming vertically unmanageable.
Users can always answer: “Why is this on today?” and “What changed when I moved it?”
Filters never cause silent disappearance; empty states diagnose the reason.
Rescheduling is non-destructive with Undo and (for batch ops) preview + conflict policy.
Lesson authoring supports strict steps and feeds execution handoff without “planning inside execution.”
7) Immediate implementation note (based on observed bug)
Investigate the lesson metadata date range rendering:
“Jun 18 – Jun 11” appears reversed; likely start/end inversion or display ordering bug.
Fix at both:
validation (prevent)
rendering (defensive / consistent formatting)
