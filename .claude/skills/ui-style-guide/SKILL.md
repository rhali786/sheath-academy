---
name: ui-style-guide
description: Use before changing any user-facing UI in Sheath Academy. Defines the approved interaction patterns — editable record cards, action icons, destructive confirmation, page/layout classes, collapsible add-forms, app shell and width, Nivo charts — plus the UI audit checklist. Do not invent a new pattern when an approved one exists.
---

# UI style guide

Approved user-facing interaction patterns for Sheath Academy. Before changing any UI, identify which rules apply in the plan or audit. Goal: consistency across Dashboard, Attendance, Plan/Lessons, Quran, Portfolio, Records, Alerts, and future persistence-backed features. **Do not create a new visual or interaction pattern when an approved one already exists** — if you must, the plan states why no approved pattern fits.

---

## 1. Editable record cards

Quran sessions, attendance records, lesson cards, and portfolio evidence are **one class — editable educational records**. They share edit/expand, save, cancel, delete/void/archive, confirmation, loading/error, and empty-state treatment. Use the **Quran-style inline edit expansion** pattern for all of them (and similar future cards) unless the plan documents an approved exception.

1. The collapsed card shows the readable summary of the record.
2. Standard action icons (§2) are visible or predictably available.
3. Edit expands the card **inline** — not navigating away, not a bespoke modal.
4. Save and cancel actions remain inside the expanded editing area.
5. Cancel restores the previous read-only state without persisting.
6. Save persists through the owning feature service/API path and returns the card to read-only.
7. Destructive actions use the confirmation pattern in §3.

Do not make the whole card clickable for editing unless that is already the approved pattern for that exact component class. Any intentional deviation is stated in the audit or plan before implementation.

---

## 2. Standard action icons

Use consistent icons for the same intent across features. Icon-only buttons must have accessible labels — never rely on the visual alone.

| Intent | Preferred icon behavior |
|---|---|
| Edit | Pencil/edit icon opens inline edit expansion |
| Save | Save/check action persists changes |
| Cancel | X/close action exits edit mode without saving |
| Delete/remove | Trash/destructive icon opens confirmation |
| Archive/void | Archive/ban-style icon opens confirmation when destructive |
| View details/expand | Chevron/details icon expands read-only details |

---

## 3. Destructive confirmation

Use the app-styled confirmation, **not** `window.confirm` or any browser-native dialog, for destructive/irreversible actions (delete evidence, delete/void attendance, delete Quran sessions, remove lesson/session records, archive records that affect dashboard/report visibility).

1. Uses the app's styled dialog/panel pattern.
2. Copy names the affected record or action clearly.
3. The destructive action is visually distinct from cancel.
4. Cancel closes without mutation.
5. Confirm calls the owning feature API/service and updates UI state.
6. Tests prove both cancel and confirm paths.

---

## 4. Page titles and layout classes

Feature pages use shared CSS utility classes from `app/globals.css`.

```tsx
<h1 className="page-title">Attendance</h1>        // text-2xl font-bold text-slate-900 mb-2

// Heading row with actions — suppress bottom margin, use a flex row:
<div className="flex items-center justify-between">
  <h1 className="page-title mb-0">Attendance</h1>
  <button ...>Add record</button>
</div>

<h2 className="form-section-heading">Mark attendance</h2>  // text-lg font-bold text-slate-900 mb-4
<div className="add-form-card"> ... </div>                 // bg-white rounded-xl border border-slate-200 p-6 shadow-sm
```

All add forms on feature pages use the `add-form-card` wrapper.

---

## 5. Collapsible add-form pattern

All feature pages with an add-form use a collapsible toggle in the header (established in `ResourcesPage`; applied to Attendance, Lessons, Growth, Quran).

1. Header is a `flex items-center justify-between` row with the `<h1>` and the toggle.
2. Toggle styled `px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800`.
3. Label: `"Cancel"` when the form is visible, `"Add X"` when hidden.
4. Default `showForm = true` so the form is visible on arrival.
5. When visible, render `<h2 className="form-section-heading">` then `<div className="add-form-card">` — together, to avoid orphaned headings.

```tsx
const [showForm, setShowForm] = useState(true)

<div className="flex items-center justify-between">
  <h1 className="page-title mb-0">Lessons</h1>
  <button type="button" onClick={() => setShowForm(v => !v)}
    className="px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800">
    {showForm ? 'Cancel' : 'Add lesson'}
  </button>
</div>

{showForm && (
  <div>
    <h2 className="form-section-heading">Add lesson</h2>
    <div className="add-form-card"><LessonTaskForm ... /></div>
  </div>
)}
```

---

## 6. Page shell and width

Feature pages use the app shell and approved width unless intentionally a focused/auth/onboarding flow.

1. Pages needing the Header and household context live under `app/(shell)/`.
2. Auth/focused flows that must not show the Header live under `app/(auth)/`.
3. Feature page components under `features/*/front/pages/` do not import `Header` or `AppShell` directly.
4. Content width matches the established shell page width unless the plan documents a reason to differ.
5. Child-linked navigation preserves the selected child when moving between child-scoped pages.

---

## 7. Dashboard charts (Nivo)

Charts use Nivo consistently unless the plan documents an approved exception. Do not introduce a second charting library without an explicit architecture decision.

1. Prefer the existing Nivo chart patterns already in the app.
2. Pass explicit array props (`legends`, `layers`, `markers`, `defs`, `fill`) where applicable, so production does not depend on defaults that Jest mocks may hide.
3. Keep chart interactions accessible and predictable.
4. Include integration coverage for rendered chart containers and surrounding states.
5. Run or document a browser smoke check for chart-heavy changes — Jest mocks Nivo.

---

## 8. UI audit & tests

Before modifying UI, the plan or audit reports: which rules above apply; the closest approved component/pattern; the icons and confirmation pattern used; whether the page keeps the approved width and shell; for editable cards, whether it expands inline (or why not); which tests prove the pattern. (This is the UI half of the `plan-builder` audit.)

UI changes ship with integration tests under the owning feature's `__tests__` tree (boilerplate: `testing-patterns` skill) covering: read-only/collapsed, edit expansion, save, cancel, destructive-confirm cancel + confirm paths, empty/loading/error where applicable, and child-scoped behavior when the feature depends on the selected child. For cross-feature dashboard behavior, tests prove the dashboard reads from the owning feature's data path, not stale seed-only data.
