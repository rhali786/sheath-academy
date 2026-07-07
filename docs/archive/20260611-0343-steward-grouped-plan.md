# Feedback Steward Grouped Plan

Generated at: 2026-06-11T03:43:04.627Z

## Feedback IDs

- 80f04cd0-5893-4c85-9167-997a96229a46
- 9bb8370e-bf6f-45b7-8058-b1e975025291

Auto-eligible: 80f04cd0-5893-4c85-9167-997a96229a46, 9bb8370e-bf6f-45b7-8058-b1e975025291
Approved: none

## Workstream 1: Make every setup-prompt step in the dashboard NextSetupStrip clickable. The 'household', 'firstChild', and 'firstSubject' steps currently have no `href` in STEP_MESSAGES, so they render no 'Go →' link (verified at features/setup/front/components/NextSetupStrip.tsx:7-35 and :82-89). Add verified Settings destinations: household → /settings, firstChild → /settings?tab=children, firstSubject → /settings?tab=subjects (tab ids confirmed in features/settings/front/pages/SettingsPage.tsx:24,59).

- Feature area: dashboard
- Owning component: features/setup/front/components/NextSetupStrip.tsx
- Allowed files: features/setup/front/components/NextSetupStrip.tsx, features/setup/__tests__/integration/NextSetupStrip.test.tsx
- Blast radius: Local UI change to one component plus its test. Destination routes are verified to exist: /settings (default household tab) and the ?tab=children / ?tab=subjects query tabs in SettingsPage.tsx (TAB_IDS at line 24). Note one behavioral nuance: when setup is incomplete Dashboard.tsx:139-141 returns the full-page <HouseholdSetup /> instead of the strip, so the 'household' step rarely surfaces inside the strip itself — adding its href is still correct and harmless, but the most visible win is firstChild/firstSubject gaining links. No schema, enum, or cross-feature changes.
- Test plan:
  - `NEW TEST: features/setup/__tests__/integration/NextSetupStrip.test.tsx — 'renders a Go link to /settings when nextStep is household'`
  - `NEW TEST: features/setup/__tests__/integration/NextSetupStrip.test.tsx — 'renders a Go link to /settings?tab=children when nextStep is firstChild'`
  - `RUN: npm test -- features/setup/__tests__/integration/NextSetupStrip.test.tsx`

### UAT

### 9bb8370e-bf6f-45b7-8058-b1e975025291

- Context: At the top of the dashboard it says 'Set up your household.' It would be helpful to have a clickable link that takes you to that page.
- Open the Render preview and sign in to a household that has completed household creation but has no children yet.
- Navigate to /dashboard.
- Confirm the green setup strip at the very top of the page shows a prompt (e.g. 'Add your first child').
- Confirm a 'Go →' button/link now appears on the right side of that strip.
- Click 'Go →' and confirm it navigates to the Settings page on the correct tab (Children).
- Use the browser back button, then add a child and confirm the strip advances to the next step and its 'Go →' link also navigates correctly.
## Workstream 2: Clarify the two memorisation session types on the Quran page so users understand 'New memorisation' (first-time memorising) vs 'Memorisation' (reviewing an already-memorised surah). SESSION_TYPES at features/quran/front/pages/QuranPage.tsx:15 contains both 'New memorisation' and 'Memorisation', rendered as <option> children with no clarifying copy at lines 213, 292, 327. This is a HOLD: the feedback is a question and the safe fix interacts with persisted data — see clarifyingQuestions and blastRadiusNotes before implementing.

- Feature area: quran
- Owning component: features/quran/front/pages/QuranPage.tsx
- Allowed files: features/quran/front/pages/QuranPage.tsx, features/quran/__tests__/integration/QuranPage.test.tsx
- Blast radius: The SESSION_TYPES strings are persisted: each <option> uses its text as both label and stored value (no explicit `value` attribute at QuranPage.tsx:213, :292, :327), and the saved string becomes quranSessions.sessionType (confirmed by features/quran/__tests__/api/repository.test.ts:36,43 asserting sessionType 'memorization'). Renaming an option's visible text would therefore silently change the stored value for new rows and break the type filter against historical rows. Any label change MUST add an explicit `value` attribute preserving the exact existing string while only altering the displayed label/helper copy. Do not rename the stored values.

> ⚠️ **Clarifying questions — confirm before executing this workstream:**
> - Confirm the intended semantics: is 'Memorisation' meant for reviewing/strengthening an already-memorised surah, and 'New memorisation' for memorising a surah for the first time? The fix copy depends on this.
> - Preferred approach: (a) keep all seven labels and add inline helper/tooltip text clarifying the two memorisation types, or (b) relabel the visible text (e.g. 'Memorisation' → 'Memorisation review (already memorised)') while keeping the stored value identical via an explicit value attribute? Option (b) changes only display, not data.
> - Since this feedback is a user question rather than a defect report, do you want a code change at all, or is an in-app help answer / docs note sufficient?
- Test plan:
  - `NEW TEST: features/quran/__tests__/integration/QuranPage.test.tsx — 'session-type dropdown renders clarifying helper text distinguishing New memorisation from Memorisation review'`
  - `NEW TEST: features/quran/__tests__/integration/QuranPage.test.tsx — 'session-type option values still match the persisted SESSION_TYPES strings (no stored-value drift)'`
  - `RUN: npm test -- features/quran/__tests__/integration/QuranPage.test.tsx`

### UAT

### 80f04cd0-5893-4c85-9167-997a96229a46

- Context: Seeking clarification, is the 'memorization' option for when they've already memorized that surah? Because there's 'memorization' and 'new memorization.'
- Open the Render preview, sign in, and navigate to /quran.
- Select a child and click to open the 'Add session' form.
- Open the session 'Type' dropdown.
- Confirm both 'New memorisation' and 'Memorisation' options are present and now visually distinguishable, with clarifying helper text indicating which is for first-time memorising vs reviewing an already-memorised surah.
- Add a session using 'Memorisation', save it, and confirm the saved row in the list below still shows the type 'Memorisation' (stored value unchanged).
- Use the 'All types' filter at the top of the list, select 'Memorisation', and confirm previously-logged 'Memorisation' sessions still appear (no filtering regression).
