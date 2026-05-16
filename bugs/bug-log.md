# Bug log

Use this file to log bugs found while using the site.

## How to add a new bug
Copy/paste the template below and fill it in.

### Template
- **ID**: BUG-001
- **Status**: Open | In progress | Resolved | Won't fix
- **Date/time**: YYYY-MM-DD HH:MM (America/Detroit)
- **Environment**: (browser/device)
- **URL/path**:
- **Steps to reproduce**:
- **Expected result**:
- **Actual result**:
- **Attachments**: (screenshot link, if any)

---

## Bug entries

- **ID**: BUG-001
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today page
- **URL/path**: https://sheathacademy.onrender.com/
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Confirm that Today’s State shows lessons planned.
  3. Confirm that Do Today shows at least one lesson.
  4. Look at the setup strip near the top of the dashboard.
- **Expected result**: Once lessons exist, the setup prompt should move past “Plan your first lesson” and advance to the next missing setup step.
- **Actual result**: The setup strip still says “Plan your first lesson” and “Lesson planning is coming soon,” even though lessons already exist.
- **Notes**: Likely caused by setup status hardcoding `hasLessons: false`, `hasAttendance: false`, and `hasPortfolio: false` instead of reading real service data.
- **Attachments**:

---

- **ID**: BUG-002
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today page
- **URL/path**: https://sheathacademy.onrender.com/
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Use the top child selector and choose Adam.
  3. Scroll through Today’s State, Do Today, Needs Attention, Per-Child Progress, Quran Logging, and Records & Proof.
- **Expected result**: Dashboard sections should consistently respect the selected child, or clearly label which sections are household-wide.
- **Actual result**: Only some data is filtered. Quran Logging still shows all children, Per-Child Progress uses its own child selector, Records & Proof remains global, and top metrics remain global or hardcoded.
- **Notes**: The child selector is supposed to support All Children vs one selected child during the session. Filtering currently appears partial.
- **Attachments**:

---

- **ID**: BUG-003
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today page
- **URL/path**: https://sheathacademy.onrender.com/
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Look at the Needs Attention section.
  3. Find the Quran revision alert.
- **Expected result**: Child-specific alerts should display the learner’s name.
- **Actual result**: The alert displays the raw internal ID `student_seed_adam_001`.
- **Notes**: Likely caused by stale hardcoded child ID mapping in the alert item component.
- **Attachments**:

---

- **ID**: BUG-004
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today page
- **URL/path**: https://sheathacademy.onrender.com/
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. In Needs Attention, change the sort dropdown from “By Priority” to “By Date.”
  3. Observe the order of alert cards.
- **Expected result**: “By Date” should sort alerts by date, or the option should be hidden/disabled until date sorting exists.
- **Actual result**: “By Date” does not change sorting behavior.
- **Notes**: Current alert data does not appear to include a date field, so this option is exposed before the behavior exists.
- **Attachments**:

---

- **ID**: BUG-005
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Quran Logging click-through
- **URL/path**: https://sheathacademy.onrender.com/
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. In Quran Logging, click Adam’s “Log Session.”
  3. Change the session details, such as Surah to “Al-Fatiha.”
  4. Save the session.
  5. Look at Adam’s Quran Logging card again.
- **Expected result**: Adam’s card should show the newly saved/latest Quran session.
- **Actual result**: Adam’s card continues to show the older seed session, such as Al-Mulk 1–5, Revision, Last: 2 days ago.
- **Notes**: Confirmed by click-through. Likely caused by displaying the first matching session instead of the newest session after appending a new one.
- **Attachments**:

---

- **ID**: BUG-006
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Quran Weekly Sessions
- **URL/path**: https://sheathacademy.onrender.com/
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Note the Weekly Sessions chart in the Quran, Arabic & Islamic Studies section.
  3. Log a new Quran session.
  4. Re-check the chart.
- **Expected result**: The chart should reflect actual Quran sessions, especially after a new session is saved.
- **Actual result**: The chart appears to use hardcoded/default chart data rather than the API-generated chart data.
- **Notes**: Dashboard loads session data but does not appear to pass API chart data into the chart component.
- **Attachments**:

---

- **ID**: BUG-007
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Today metrics
- **URL/path**: https://sheathacademy.onrender.com/
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Compare Today’s State metrics against visible page sections.
  3. Compare Needs Attention count, attendance count, Quran count, and records/proof data.
- **Expected result**: Summary metrics should be computed from the same live data used by the page sections, or clearly marked as placeholders.
- **Actual result**: Several metrics appear hardcoded or mismatched. For example, Need Attention can show 2 while more visible attention cards are shown, and Attendance Ready can differ from Records & Proof attendance.
- **Notes**: The lessons planned metric was made dynamic, but several other summary fields appear to remain hardcoded.
- **Attachments**:

---

- **ID**: BUG-008
- **Status**: Open
- **Date/time**: 2026-05-15 22:31 (America/Detroit)
- **Environment**: Live Render site, Dashboard / Records & Proof click-through
- **URL/path**: https://sheathacademy.onrender.com/
- **Steps to reproduce**:
  1. Open the Dashboard / Today page.
  2. Scroll to Records & Proof.
  3. Click “Attendance Report.”
  4. Observe the modal and browser/download behavior.
- **Expected result**: Either a real export/download/print flow should begin, or the button should clearly say the feature is coming soon.
- **Actual result**: The modal says the report is being prepared and tells the user to check downloads, but no download/export occurs.
- **Notes**: Confirmed by click-through. Current behavior overstates what the button actually does.
- **Attachments**:

---
