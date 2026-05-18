# Sheath Academy UI Style Guide

This guide defines the approved user-facing interaction patterns for Sheath Academy. Before changing any UI, read this file and identify which rules apply in the implementation plan or audit.

The goal is consistency across Dashboard, Attendance, Plan/Lessons, Quran, Portfolio, Records, Alerts, and future persistence-backed features. Do not create a new visual or interaction pattern when an approved one already exists.

---

## 1. Default record-card interaction

Editable record cards should use the Quran-style inline edit expansion pattern unless the implementation plan explicitly documents an approved exception.

This applies to:

- Quran sessions
- Attendance records
- Lesson cards
- Portfolio evidence
- Similar future record cards

Approved behavior:

1. The collapsed card shows the readable summary of the record.
2. Standard action icons are visible or predictably available.
3. Selecting edit expands the card inline instead of navigating away or opening a bespoke modal.
4. Save and cancel actions remain inside the expanded editing area.
5. Cancel restores the previous read-only state without persisting changes.
6. Save persists the change through the owning feature service/API path and returns the card to read-only state.
7. Delete, void, archive, or destructive actions use the approved destructive confirmation pattern.

Do not make the whole card clickable for editing unless that is already the approved pattern for that exact component class.

---

## 2. Standard action icons

Use consistent action icons for the same intent across features.

Approved intent mapping:

| Intent | Preferred icon behavior |
|---|---|
| Edit | Pencil/edit icon opens inline edit expansion |
| Save | Save/check action persists changes |
| Cancel | X/close action exits edit mode without saving |
| Delete/remove | Trash/destructive icon opens confirmation |
| Archive/void | Archive/ban-style icon opens confirmation when destructive |
| View details/expand | Chevron/details icon expands read-only details |

Icon-only buttons must have accessible labels. Do not rely on visual icons alone.

---

## 3. Destructive confirmation

Use app-styled destructive confirmation, not browser-native confirmation dialogs, for destructive or irreversible actions.

Destructive actions include:

- Delete portfolio evidence
- Delete or void attendance records
- Delete Quran sessions
- Remove lesson/session records
- Archive records when the result affects dashboard/report visibility

Approved confirmation behavior:

1. The confirmation uses the app’s styled dialog/panel pattern.
2. The copy names the affected record or action clearly.
3. The destructive action is visually distinct from cancel.
4. Cancel closes the confirmation without mutation.
5. Confirm calls the owning feature API/service and updates the UI state.
6. Tests prove both cancel and confirm paths.

Do not use `window.confirm` for these flows.

---

## 4. Shared class of editable educational records

Quran sessions, attendance records, lesson cards, and portfolio evidence are the same class of interaction: editable educational records.

They should share the same:

- Edit/expand behavior
- Save behavior
- Cancel behavior
- Delete/void/archive behavior
- Confirmation pattern
- Loading and error treatment
- Empty-state treatment where practical

Any intentional deviation must be stated in the audit or plan before implementation.

---

## 5. Page shell and width

Feature pages should use the app shell and approved page-width pattern unless the page is intentionally a focused/auth/onboarding flow.

Approved behavior:

1. Pages that need the Header and household context live under `app/(shell)/`.
2. Auth or focused flows that must not show the Header live under `app/(auth)/`.
3. Feature page components under `features/*/front/pages/` do not import `Header` or `AppShell` directly.
4. Content width should match the established shell page width unless the plan documents a reason to differ.
5. Child-linked navigation should preserve the selected child when moving between child-scoped pages.

---

## 6. Dashboard charts and visualizations

Dashboard charts and similar visualizations should use Nivo consistently unless the plan documents an approved exception.

Approved behavior:

1. Prefer the existing Nivo chart patterns already used in the app.
2. Pass explicit array props required by Nivo, including `legends`, `layers`, `markers`, `defs`, and `fill` where applicable, so production does not depend on defaults that Jest mocks may hide.
3. Keep chart interactions accessible and predictable.
4. Include integration coverage for rendered chart containers and surrounding states.
5. Run or document a browser smoke check for chart-heavy changes, because Jest mocks Nivo.

Do not introduce a second charting library without an explicit architecture decision.

---

## 7. UI audit requirement

Before modifying user-facing UI, the audit or implementation plan must report:

1. Which UI style-guide rules apply.
2. Which existing component is the closest approved pattern.
3. Which icons and confirmation pattern will be used.
4. Whether the changed page keeps the approved page width and shell behavior.
5. Which tests prove the pattern was followed.

If the implementation needs a new card, modal, confirmation, chart, icon, page-width, or edit interaction pattern, the plan must state why an existing approved pattern does not fit.

---

## 8. Testing expectations for UI consistency

UI changes must include integration tests under the owning feature’s `__tests__` tree.

At minimum, tests should cover:

- Read-only/collapsed state
- Edit expansion
- Save path
- Cancel path
- Destructive confirmation cancel path
- Destructive confirmation confirm path
- Empty, loading, and error states when applicable
- Child-scoped behavior when the feature depends on selected child

For cross-feature dashboard behavior, tests must prove the dashboard reads from the owning feature’s data path rather than stale seed-only data.
