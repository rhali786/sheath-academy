import Link from 'next/link'

const pains = [
  {
    quote: 'A mother is up at midnight the night before her annual homeschool review. She opens three apps, a spreadsheet, and a notebook. She cannot account for three weeks in February. She knows the learning happened. She cannot prove it.',
    body: 'Records scattered across systems create a low-grade anxiety that sits underneath every school week. Sheath Academy makes that moment impossible.',
  },
  {
    quote: "Sunday evening. The plan for the week has to be rebuilt from memory because last week's plan didn't survive contact with Tuesday.",
    body: 'Subject rhythms, recurring lessons, and weekly structures should persist without manual rebuilding. Repair should take two decisions, not twenty.',
  },
  {
    quote: 'A father realizes his son has been quietly behind in math for six weeks. Nothing flagged it.',
    body: "Progress slippage in homeschool is invisible by default. The system surfaces slippage when it's small, not after it compounds.",
  },
  {
    quote: 'A Quran teacher asks how Adam is progressing with Al-Mulk. The parent opens a notes app with three bullet points and a feeling.',
    body: 'A generic notes field loses the session structure that makes hifz progress legible. The system stores what actually matters.',
  },
  {
    quote: 'A parent downloads a well-reviewed homeschool app. It has streak counters for prayer, virtue points for good behavior, and a leaderboard for Quran memorization. She closes it and does not return.',
    body: 'Quantifying spiritual practice creates comparison pressure and performative worship. This software does not do that. Not as an oversight — as a commitment.',
  },
]

const wave1 = [
  {
    label: '1A — Foundation',
    description: 'Magic-link sign-in, household workspace, child profiles, subject setup, school year config, dashboard shell.',
  },
  {
    label: '1B — Planning spine',
    description: "Weekly planner, per-child lesson scheduling, drag-to-reschedule, lesson status states, today's lessons card.",
  },
  {
    label: '1C — Records spine',
    description: 'Attendance by child and date, missing-day detection, progress by subject, completed lesson history, dashboard cards.',
  },
  {
    label: '1D — Proof and records',
    description: 'Portfolio evidence (text notes, URL links), parent reflections, records report, browser print, advisory review checklist.',
  },
]

const changelog = [
  {
    version: '0.35.0',
    label: 'Portfolio completion + Reports spine (current)',
    detail: 'F31–F35: Parent reflection on evidence. Portfolio filters by child, subject, type, and date range. Separate /reports page with sectioned records summary, print-optimised output, and advisory records review checklist. No PDF generation — browser print only.',
  },
  {
    version: '0.30.0',
    label: 'Portfolio evidence',
    detail: 'F27–F30a: Evidence data model, API, and UI. Parents can capture text note and URL evidence linked to a child, subject, and lesson. Evidence appears in a dedicated Portfolio tab. http/https-only URL validation.',
  },
  {
    version: '0.26.0',
    label: 'Records spine',
    detail: 'F24–F26: Progress by subject with per-subject completion rates. Completed lesson history per child and subject. Records dashboard cards surface progress and history at a glance.',
  },
  {
    version: '0.23.0',
    label: 'Attendance tracking',
    detail: 'F20–F23: Daily attendance records by child. Attendance dashboard card. Missing-day detection flags weekdays inside the active school year without a record.',
  },
  {
    version: '0.10.20',
    label: 'Planner stabilisation',
    detail: 'WeekGrid date formula corrected. Today section refreshes on lesson mutations. DoToday auto-select fixed. Lesson cards gain drag-to-reschedule and click-to-edit. F14: Today section wired into the /lessons page.',
  },
  {
    version: '0.10.0',
    label: 'Weekly planner',
    detail: 'F11: Per-child lesson scheduling across the week. WeekNavigator, WeekGrid, and weekly lesson list. Linked child/subject filters. Week start day preference in household settings.',
  },
  {
    version: '0.5.1',
    label: 'Subjects, settings, and setup wizard',
    detail: 'F5–F10: Subject/Course data model and admin UI. Unified settings page. Progressive household setup cards. Child selector. Header Hijri date display. Per-feature data stores replace the shared dataStore.',
  },
  {
    version: '0.4.0',
    label: 'Child profiles',
    detail: 'F4: Child data model, API routes, and management UI. Parents can add, edit, and remove children. Child list drives per-child progress and Quran tracking.',
  },
  {
    version: '0.3.4',
    label: 'Shell stabilisation',
    detail: 'AppShell owns Header — removed duplicate rendering from Dashboard. Household settings restored to full rename form. Worklog linked from About. Pre-commit hook keeps package.json version in sync.',
  },
  {
    version: '0.1.17',
    label: 'Shell and navigation',
    detail: 'AppShell architecture — header and household context in one shell shared by all pages. NavigationContext keeps tab state in sync. Tab buttons navigate back to dashboard from any page.',
  },
  {
    version: '0.1.10',
    label: 'Household workspace',
    detail: 'F2–F3: Workspace and household profile API. First-login setup flow names the household before the dashboard loads. Family name in the header. Household settings tab to rename at any time.',
  },
  {
    version: '0.1.4',
    label: 'Parent sign-in',
    detail: 'F1: Magic-link email authentication via Resend. NextAuth session management. Middleware route protection. Dev bypass for local testing.',
  },
  {
    version: '0.1.1',
    label: 'Next.js stack',
    detail: 'Migrated from Python/FastAPI prototype to Next.js 15 App Router. All business logic moved into features/. TypeScript types, mock data, API routes, Jest suite, GitHub Actions CI, and Render deploy config established.',
  },
  {
    version: '0.1.0',
    label: 'Foundation',
    detail: 'Modular features/ architecture. Dashboard shell with four tab panels. In-memory data store. 35 Wave 1 feature specs scaffolded. About page and CLAUDE.md development guide.',
  },
]

export function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen">

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* Hero */}
        <section>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight tracking-tight mb-4">
            Built for this family.<br />Not adapted for it.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
            There are over 158 homeschool management tools. None of them were built for a Muslim family
            homeschooling with Quran at the centre, Arabic as a real subject, and a school rhythm that
            pauses for Ramadan. Sheath Academy is.
          </p>
        </section>

        {/* North Star */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">North Star</p>
          <blockquote className="border-l-4 border-forest-900 pl-6">
            <p className="text-xl font-bold text-slate-900 leading-snug">
              Reduce the invisible operational burden on the parent so they can actually be present for the learning.
            </p>
          </blockquote>
          <p className="text-slate-600 mt-4 leading-relaxed">
            The hardest part of homeschooling is not teaching — it is running a school. Sheath Academy
            carries that weight so the parent does not have to. The measure of success is not feature
            count. It is whether a parent ends the school week calmer and more confident than they started it.
          </p>
        </section>

        {/* The moat */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">The moat</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Every other tool treats Quran, Arabic, and Islamic Studies as renamed folders in a generic gradebook.
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            A Quran session is not a homework assignment. It has a surah, an ayah range, a session
            type — new memorisation, revision, recitation — and a last-reviewed date that determines
            what should happen next. That logic cannot live in a notes field.
          </p>
          <p className="text-slate-600 leading-relaxed">
            No competitor has built this. Most never will, because their user base does not need it
            and retrofitting it would require rethinking the data model from scratch. We started from scratch.
          </p>
        </section>

        {/* Pain points */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">What hurts — the pains this was built to relieve</p>
          <div className="space-y-4">
            {pains.map((pain, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-900 leading-snug mb-3 italic">
                  &ldquo;{pain.quote}&rdquo;
                </p>
                <p className="text-sm text-slate-500 leading-relaxed">{pain.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Wave 1 features */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Wave 1 — Homeschool MVP</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Complete. All 35 features shipped.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wave1.map((w) => (
              <div key={w.label} className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-forest-900 uppercase tracking-widest mb-2">{w.label}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{w.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What this is not */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">What this is not</p>
          <div className="space-y-3">
            {[
              ['Not a chore tracker', 'Household tasks and school records should not share a system. The software ends at the school day.'],
              ['Not a piety scoreboard', 'Formation, adab, and spiritual growth are not metrics. They are not tracked, scored, compared, or displayed.'],
              ['Not an AI-first planner', 'AI may support planning eventually — as a bounded, parent-approved assistant. Not as an autonomous scheduler.'],
              ['Not a generic tool with Islamic labels', 'The data model has room for Muslim subjects at its core. This is an architectural decision made at the start.'],
            ].map(([heading, body]) => (
              <div key={heading} className="flex gap-4 bg-white rounded-xl p-5 shadow-sm">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-forest-900 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{heading}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Changelog */}
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Changelog</p>
          <p className="text-sm text-slate-500 mb-6">One entry per meaningful milestone. Version shown is where that milestone landed.</p>
          <div className="space-y-2">
            {changelog.map((entry) => (
              <div key={entry.version} className="bg-white rounded-xl px-5 py-4 shadow-sm flex items-start gap-4">
                <span className="text-xs font-bold text-forest-900 tabular-nums mt-0.5 w-16 flex-shrink-0">{entry.version}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{entry.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-100 mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© 2026 Sheath Academy</p>
          <div className="flex gap-4 text-xs">
            <Link href="/login" className="text-slate-400 hover:text-forest-900 transition-colors">Sign in</Link>
            <a href="https://sheathacademy.onrender.com" className="text-slate-400 hover:text-forest-900 transition-colors">Live site</a>
            <Link href="/worklog" className="text-slate-400 hover:text-forest-900 transition-colors">Worklog</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
