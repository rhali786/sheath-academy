# Feedback Steward Grouped Plan

Generated at: 2026-06-04T17:34:15.348Z

## Feedback IDs

- ad71a81f-6bc8-4463-9d1a-0f8f3c11951e
- 533ecbb1-bc49-4795-b8fe-3d579fc96076
- 1831c99f-8e92-43be-8274-6d1189d8bbe5
- 103eaba1-67d8-4fde-addc-86228a3860e0
- 3dc815ad-a973-4672-a4ee-39553008f324
- a2a7a0b6-9751-4967-91f8-8daf9e8a5955

Auto-eligible: ad71a81f-6bc8-4463-9d1a-0f8f3c11951e, 533ecbb1-bc49-4795-b8fe-3d579fc96076, 1831c99f-8e92-43be-8274-6d1189d8bbe5, 103eaba1-67d8-4fde-addc-86228a3860e0, 3dc815ad-a973-4672-a4ee-39553008f324, a2a7a0b6-9751-4967-91f8-8daf9e8a5955
Approved: none

## Workstream 1: Admin feedback page improvements: add a 'Reject planning' action so admins can decline a classified item, and rename status labels for clarity ('classified' → 'reviewed'; review user-facing 'Thanks for your Feedback' and 'Implemented' wording).

- Feature area: admin-feedback
- Allowed files: features/feedback/**, app/admin/feedback/**, app/api/[...slug]/route.ts
- Test plan:
  - `npm test -- features/feedback`
  - `npm run build`

### UAT

### ad71a81f-6bc8-4463-9d1a-0f8f3c11951e

- Context: Add a reject planning button for admin on the feedback page. Perhaps also the labels should be reviewed, Thanks for your Feedback, and Implemented
- Open the Render preview URL and sign in via dev bypass on /login.
- Navigate to /admin/feedback.
- Locate a feedback row whose status is 'reviewed' (formerly classified).
- Click the new 'Reject planning' button on that row.
- Confirm the row's status updates to a rejected state and the button is no longer offered.
- Reload the page and confirm the rejected state persists.

### 533ecbb1-bc49-4795-b8fe-3d579fc96076

- Context: Change the clarification or status of feedback from classified to reviews once it has been processed by the daily process. Reviewed makes more since to users than clarified
- On the Render preview, sign in and navigate to /admin/feedback.
- Verify the status column shows 'Reviewed' for items previously labeled 'Classified'.
- Hover any other status pill (e.g. 'Thanks for your Feedback', 'Implemented') and confirm the wording matches the updated copy in the PR description.
- Refresh and confirm the renamed status survives reload.
## Workstream 2: Add a collapse/expand toggle to the app sidebar (AppShell) using a square-with-inset-square icon, and center the version number within the sidebar footer.

- Feature area: layout-sidebar
- Allowed files: features/layout/**, app/(shell)/layout.tsx, app/globals.css
- Test plan:
  - `npm test -- features/layout`
  - `npm run build`

### UAT

### 1831c99f-8e92-43be-8274-6d1189d8bbe5

- Context: Allow the sidebar to collapse. Like how AI screens have the square with the partial square inside of it so you can expand and collapse that panel.
- Open the Render preview, sign in via dev bypass.
- Navigate to /about (or any shell page).
- Locate the new collapse icon (square-with-inset-square) at the top of the sidebar.
- Click it and confirm the sidebar collapses to an icon-only rail.
- Click it again and confirm the sidebar expands back to its full width.
- Reload the page and confirm the collapsed/expanded state is preserved.

### 103eaba1-67d8-4fde-addc-86228a3860e0

- Context: Center the version number in the navigation Side bar
- On the Render preview, navigate to /settings.
- Look at the sidebar footer where the app version is rendered.
- Confirm the version number is horizontally centered within the sidebar (not left- or right-aligned).
- Collapse the sidebar and confirm the version is still centered (or hidden) appropriately.
## Workstream 3: Center the Arabic Hijri calendar block under the 'Faith. Learning. Purpose.' tagline on the settings page.

- Feature area: settings-page
- Allowed files: features/settings/**, app/(shell)/settings/**
- Test plan:
  - `npm test -- features/settings`
  - `npm run build`

### UAT

### 3dc815ad-a973-4672-a4ee-39553008f324

- Context: Center the Arabic Hijri calendar under where it says Faith.Learnig. Purpose.
- Open the Render preview and sign in.
- Navigate to /settings.
- Confirm the 'Faith. Learning. Purpose.' tagline is visible.
- Confirm the Arabic Hijri calendar element directly below the tagline is horizontally centered within its container.
- Resize the browser window narrower and wider and confirm the calendar remains centered at all widths.
## Workstream 4: Replace the email-only header greeting with a rotating Arabic greeting plus the user's name, with their email rendered in grey parentheses underneath. Include 5–8 greeting variants that rotate so it does not get stale.

- Feature area: dashboard-header-greeting
- Allowed files: features/layout/front/components/Header.tsx, features/layout/**, features/dashboard/**
- Test plan:
  - `npm test -- features/layout features/dashboard`
  - `npm run build`

### UAT

### a2a7a0b6-9751-4967-91f8-8daf9e8a5955

- Context: On the header it shows me by my email address. I would like for it to greet me in arabic, say my name, and have my email in grey in parantehses under the greeting of my name. So like Marhaban Rasheed (rhali786@gmail.com). And it should have 5-8 different greetings so it doesn't get stale.
- Open the Render preview and sign in as a user whose display name is known (e.g. Rasheed).
- Navigate to / (dashboard).
- Confirm the header now shows an Arabic greeting followed by the user's first name (e.g. 'Marhaban Rasheed').
- Confirm the user's email appears directly underneath in grey text inside parentheses (e.g. '(rhali786@gmail.com)').
- Refresh the page several times (or navigate away and back) and confirm at least 3 different greetings appear across reloads, drawn from the 5–8 variants.
- Sign out and back in and confirm the greeting still personalizes correctly.
