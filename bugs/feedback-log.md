# Feedback log

Use this file to capture usability/UX/content feedback and ideas.

## How to add feedback
Copy/paste the template below and fill it in. Keep each entry short and scannable.

### Template
- **ID**: FB-001
- **Status**: New | Under review | Accepted | Rejected | Implemented
- **Date/time**: YYYY-MM-DD HH:MM (America/Detroit)
- **Area/URL**: 
- **Feedback summary**: 
- **Details / suggested change**: 
- **Reasoning (why)**: 
- **Priority**: P3 | P2 | P1 (highest)
- **Notes**: 
- **Attachments**: (screenshot link, if any)

---

## Feedback entries

- **ID**: FB-001
- **Status**: New
- **Date/time**: 2026-05-12 21:00 (America/Detroit)
- **Area/URL**: Dashboard top navigation / https://sheathacademy.onrender.com/
- **Feedback summary**: Update primary dashboard tabs to match family-facing workflows.
- **Details / suggested change**: Use the following top-level tabs for now: Today, Plan, Records, Growth, Resources, Settings, About.
- **Reasoning (why)**: These labels are clearer for families than exposing the full internal product taxonomy. The 10 platform categories can remain useful for feature organization, but the dashboard navigation should stay workflow-oriented and simple. Keep About in the top navigation during the build phase for easy access, with the expectation that it may later move to a footer/help/settings area.
- **Priority**: P2
- **Notes**: Current navigation shows Today, Reports, Weekly, Settings, About. Suggested changes include renaming Weekly to Plan and Reports to Records, while adding Growth and Resources.
- **Attachments**: 

---

- **ID**: FB-002
- **Status**: New
- **Date/time**: 2026-05-12 21:35 (America/Detroit)
- **Area/URL**: Settings → Children / Add Child form / https://sheathacademy.onrender.com/settings?tab=children
- **Feedback summary**: Refine Add Child form structure for transcript-safe learner records and cleaner onboarding.
- **Details / suggested change**:
  - Replace “Child's name” with separate required fields:
    - First name*
    - Last name*
  - Add helper text beneath name fields:
    - “Names entered here may appear on reports, transcripts, and exported records.”
  - Change “Grade/Level” from free text to dropdown:
    - PK
    - K
    - Grade 1–12
    - Other/custom
  - Keep Date of Birth optional.
  - Add helper text beneath DOB field:
    - “Used for age-based planning and school records.”
  - Remove “Teacher/Instructor name” from Add Child flow.
  - Instructor assignment should occur at the subject/enrollment level instead of the learner profile level.
  - Add toggle:
    - “Allow learner to sign in”
  - Only show Username and Password fields if learner sign-in is enabled.
- **Reasoning (why)**: Formal first and last names are needed for transcripts, report cards, and exported educational records. Separating learner identity from authentication keeps onboarding cleaner and preserves flexibility for homeschool, tutor, co-op, and school workflows. Instructor assignment at the subject level better reflects real-world educational structures.
- **Priority**: P1
- **Notes**: This feedback specifically applies to the Settings → Children → Add Child workflow and should remain separate from broader navigation/dashboard feedback.
- **Attachments**:

---

- **ID**: FB-003
- **Status**: New
- **Date/time**: 2026-05-13 07:10 (America/Detroit)
- **Area/URL**: Settings → Subjects / https://sheathacademy.onrender.com/settings?tab=subjects
- **Feedback summary**: Refine Subjects setup flow to support learner enrollments, shared family courses, instructor assignment, and transcript-ready course structure.
- **Details / suggested change**:
  - Rename “Subject name” to:
    - “Course / Subject name”
  - Add optional Instructor/Teacher field to subject setup.
  - Associate courses/subjects with a School Year / Academic Year.
  - Clean up category formatting:
    - Example: “IslamicStudies” should display as “Islamic Studies”.
  - Add optional Level / Grade field separate from the course name.
    - Examples:
      - Grade 5
      - Algebra I
      - Arabic Level 2
      - Quran Revision
  - Add support for assigning a course/subject to multiple learners simultaneously.
    - Example:
      - Shared PE
      - Shared Art
      - Shared Islamic Studies
      - Shared Science
  - Add learner multi-select with optional “Select all” behavior.
  - Clarify page language so users understand they are assigning courses to learners.
  - Consider future starter templates/default subject bundles for homeschool onboarding.
  - Preserve separation between:
    - Course/Subject Name
    - Category
  - Example:
    - Course Name: “Saxon Math 6/5”
    - Category: “Math”
- **Reasoning (why)**: Homeschool families often combine learners into shared courses while still needing individualized tracking and transcript-ready records. Separating course names, levels, categories, instructors, and learner assignments creates a stronger long-term enrollment model that supports homeschool, tutor, co-op, and school workflows.
- **Priority**: P1
- **Notes**: The emerging architecture here is closer to learner enrollments than simple student-subject relationships. This is a strong direction for long-term scalability and reporting.
- **Attachments**:

---
