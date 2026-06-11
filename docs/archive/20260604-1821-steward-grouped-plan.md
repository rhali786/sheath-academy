# Feedback Steward Grouped Plan

Generated at: 2026-06-04T18:21:00Z

## Feedback IDs

- ad71a81f-6bc8-4463-9d1a-0f8f3c11951e
- 533ecbb1-bc49-4795-b8fe-3d579fc96076
- 1831c99f-8e92-43be-8274-6d1189d8bbe5
- 103eaba1-67d8-4fde-addc-86228a3860e0
- 3dc815ad-a973-4672-a4ee-39553008f324
- a2a7a0b6-9751-4967-91f8-8daf9e8a5955

Auto-eligible: ad71a81f-6bc8-4463-9d1a-0f8f3c11951e, 533ecbb1-bc49-4795-b8fe-3d579fc96076, 1831c99f-8e92-43be-8274-6d1189d8bbe5, 103eaba1-67d8-4fde-addc-86228a3860e0, 3dc815ad-a973-4672-a4ee-39553008f324, a2a7a0b6-9751-4967-91f8-8daf9e8a5955
Approved: none

## Workstream 1: Add reject action button to feedback admin workflow and update status labels to include 'Reviewed' and 'Implemented' states

- Feature area: feedback
- Allowed files: features/feedback/front/components/**, features/feedback/front/pages/**, features/feedback/server/repository.ts, features/feedback/server/service.ts, features/feedback/lib/**
- Test plan:
  - `npm test -- features/feedback/__tests__/api/repository.test.ts`
  - `npm test -- features/feedback/__tests__/api/service.test.ts`
  - `npm test -- features/feedback/__tests__/integration/ (add admin workflow tests)`

### UAT

### ad71a81f-6bc8-4463-9d1a-0f8f3c11951e

- Context: Add a reject planning button for admin on the feedback page. Perhaps also the labels should be reviewed, Thanks for your Feedback, and Implemented
- Navigate to /admin/feedback in Render preview
- Verify reject button appears in feedback row actions
- Click reject button on a feedback item
- Verify feedback status changes to rejected in the table

### 533ecbb1-bc49-4795-b8fe-3d579fc96076

- Context: Change the clarification or status of feedback from classified to reviews once it has been processed by the daily process. Reviewed makes more since to users than clarified
- Navigate to /admin/feedback in Render preview
- Verify status column shows 'Reviewed' option in dropdown
- Verify status column shows 'Implemented' option in dropdown
- Process feedback through daily workflow
- Verify status updates to 'Reviewed' after processing
## Workstream 2: Update header greeting with rotating Arabic translations and user name, center version number in sidebar, and add collapsible sidebar toggle

- Feature area: layout
- Allowed files: features/layout/front/components/Header.tsx, features/layout/front/components/AppShell.tsx, app/globals.css
- Test plan:
  - `npm test -- features/layout/__tests__/ (add Header Arabic greeting rotation tests)`
  - `npm test -- features/layout/__tests__/ (add AppShell sidebar collapse/expand tests)`
  - `npm run build && npm run smoke (verify no layout regressions)`

### UAT

### a2a7a0b6-9751-4967-91f8-8daf9e8a5955

- Context: On the header it shows me by my email address. I would like for it to greet me in arabic, say my name, and have my email in grey in parantehses under the greeting of my name. So like Marhaban Rasheed (rhali786@gmail.com). And it should have 5-8 different greetings so it doesn't get stale.
- Load dashboard home page in Render preview
- Verify header displays Arabic greeting (e.g., 'Marhaban Rasheed') with user name
- Verify user email appears in grey parentheses below the name
- Refresh page multiple times
- Verify greeting alternates between 5-8 different Arabic greetings

### 103eaba1-67d8-4fde-addc-86228a3860e0

- Context: Center the version number in the navigation Side bar
- View sidebar in both collapsed and expanded states in Render preview
- Verify version number in sidebar footer is centered

### 1831c99f-8e92-43be-8274-6d1189d8bbe5

- Context: Allow the sidebar to collapse. Like how AI screens have the square with the partial square inside of it so you can expand and collapse that panel.
- Navigate to dashboard in Render preview
- Locate collapse/expand toggle icon in sidebar header
- Click collapse icon
- Verify sidebar collapses and content area expands
- Click expand icon
- Verify sidebar expands back to full width
## Workstream 3: Center-align Hijri calendar display under Faith.Learning.Purpose tagline

- Feature area: settings
- Allowed files: features/settings/front/components/**, features/settings/**/*.css
- Test plan:
  - `npm test -- features/settings/__tests__/integration/ (add Hijri calendar centering tests)`
  - `npm run build && npm run smoke (verify settings page renders correctly)`

### UAT

### 3dc815ad-a973-4672-a4ee-39553008f324

- Context: Center the Arabic Hijri calendar under where it says Faith.Learnig. Purpose.
- Navigate to /settings in Render preview
- Locate Hijri calendar under 'Faith.Learning.Purpose' tagline
- Verify calendar is center-aligned horizontally
- Resize viewport to tablet width (768px)
- Verify calendar remains centered
- Resize viewport to mobile width (375px)
- Verify calendar remains centered at mobile breakpoint
