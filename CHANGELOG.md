# Changelog

Version increments follow `package.json`. This file is updated when the **minor** version bumps (e.g. `0.1.x → 0.2.0`).

---

## [0.1.x] — In progress (current)

### Added
- **Project foundation** — modular `features/` architecture; Next.js 15 App Router, TypeScript, Tailwind CSS, Jest
- **Dashboard UI** — full homeschool dashboard: today's lessons, task lists, per-child progress, Quran studies, needs-attention alerts, records proof
- **Design system** — Madinah green + sky blue palette (`forest-*`), Notion-style borderless cards, responsive layout; documented in `STYLES.md`
- **Responsive navigation** — hamburger menu on mobile, tab bar on desktop; sticky header with brand mark and Hijri date
- **Wave 1 specification** — 35 feature specs scaffolded in `features/feature-XX-*_todo/`; full `docs/WAVE1-SPECIFICATION.md`
- **Feature 01 — Parent sign-in** — magic-link email auth via NextAuth v5 + Resend; dev bypass for local development; in-memory session adapter; middleware protecting all routes
- **About page** — public-facing page with product vision, pain points, Wave 1 roadmap, and changelog
- **CI / deploy** — GitHub Actions pipeline (`npm ci → build → test → smoke`); Render config; pre-commit hook with version bump script

### Changed
- Migrated from Python / FastAPI prototype to Next.js full-stack
- Moved all business logic out of `app/` into `features/`; `app/` is now a thin routing layer
- Favicon updated to custom SVG

### Patches (internal reference)
- `0.1.0` — Initial modular project structure
- `0.1.1` — Next.js stack, TypeScript types, API routes, Jest suite
- `0.1.2` — Dashboard redesign, STYLES.md, responsive nav, favicon
- `0.1.3` — Wave 1 feature specs and documentation
- `0.1.4` — Feature 01 parent sign-in (magic link, dev bypass, version header)
- `0.1.5–0.1.7` — About page, CHANGELOG.md, version bump fix, changelog correction

---

## [0.2.0] — Planned

Wave 1B planning spine: weekly planner, lesson creation, lesson status states, today's lessons card.
