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
    description: 'Parent account, household workspace, child profiles, subject setup, school year, dashboard shell.',
  },
  {
    label: '1B — Planning spine',
    description: "Weekly planner, lesson creation, lesson status states, recurring patterns, today's lessons card.",
  },
  {
    label: '1C — Records spine',
    description: 'Attendance by child and date, progress by subject, completed lesson history, dashboard cards.',
  },
  {
    label: '1D — Proof and export',
    description: 'Portfolio evidence, file and photo capture, records report, export, review checklist.',
  },
]

const changelog = [
  {
    version: '0.2.0',
    label: 'Planned — Wave 1B',
    detail: "Weekly planner, lesson creation, lesson status states, today's lessons card.",
  },
  {
    version: '0.1.x',
    label: 'Foundation (current)',
    detail: 'Project setup, Next.js stack, dashboard UI, design system, responsive nav, Wave 1 specs, parent sign-in, About page.',
  },
]

export function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

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
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Built in dependency order.</h2>
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
          <p className="text-sm text-slate-500 mb-6">Updated each time the minor version increments (0.1.x → 0.2.0).</p>
          <div className="space-y-2">
            {changelog.map((entry) => (
              <div key={entry.version} className="bg-white rounded-xl px-5 py-4 shadow-sm flex items-start gap-4">
                <span className="text-xs font-bold text-forest-900 tabular-nums mt-0.5 w-10 flex-shrink-0">{entry.version}</span>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© 2026 Sheath Academy</p>
          <div className="flex gap-4 text-xs">
            <Link href="/login" className="text-slate-400 hover:text-forest-900 transition-colors">Sign in</Link>
            <a href="https://sheathacademy.onrender.com" className="text-slate-400 hover:text-forest-900 transition-colors">Live site</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
