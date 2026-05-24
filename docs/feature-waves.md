# Feature implementation waves

When implementing a complex feature, scope work into discrete waves to keep each session focused and prevent accidental scope creep.

---

## Wave structure

- **Wave 1 (internals):** All new files under `features/<feature>/` — types, server (repository/service/ids), API routes, front components, tests. No modifications to other features.
- **Wave 2+ (integration):** Surgical modifications to existing files to wire the new feature into the app (Header nav, API routing, context wiring, etc.).

---

## How to invoke a wave

Specify scope explicitly when starting each wave:

**Wave 1 example:**
```
Start Wave 1: Work only in `features/planner/`.
Create all new files from <plan section>.
Write failing tests first (TDD), then implement until green.
Do not modify any files outside `features/planner/`.
```

**Wave 2 example:**
```
Start Wave 2: Modify only these files:
- features/household/types.ts
- features/household/api/routes/household-profile.ts
- features/layout/front/components/Header.tsx
- app/api/[...slug]/route.ts

[Specific changes needed for each file]
```

---

## Scope is a hard boundary

Do not reach outside the specified directory or file list without explicit approval. This prevents accidental scope creep and keeps each wave focused on a reviewable diff.
