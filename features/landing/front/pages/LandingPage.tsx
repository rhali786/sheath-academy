'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Amiri, Cormorant_Garamond } from 'next/font/google'

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.2 }
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function HeroStars() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let raf: number
    let stars: { x: number; y: number; r: number; sp: number; a: number; tw: number }[] = []
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function seed() {
      c!.width = c!.offsetWidth
      c!.height = c!.offsetHeight
      const { width: w, height: h } = c!
      stars = Array.from({ length: 70 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3,
        sp: Math.random() * 0.02 + 0.005,
        a: Math.random() * 0.6 + 0.2,
        tw: Math.random() * 6,
      }))
    }

    seed()
    window.addEventListener('resize', seed)
    let t = 0

    function draw() {
      const { width: w, height: h } = c!
      t += 0.01
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        if (!reduce) {
          s.y += s.sp
          if (s.y > h) s.y = 0
        }
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, 7)
        ctx.fillStyle = `rgba(232,232,240,${s.a * (0.7 + 0.3 * Math.sin(t + s.tw))})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', seed)
    }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />
}

function Window({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 text-xs text-slate-400">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function TodayView() {
  const rows: [string, string, 'done' | 'todo'][] = [
    ["Qur'an — Al-Mulk", 'Adam', 'done'],
    ['Arabic — Lesson 14', 'Adam', 'done'],
    ['Math — Fractions', 'Maryam', 'todo'],
    ['Science — The water cycle', 'Maryam', 'todo'],
  ]
  return (
    <Window title="Today · /dashboard">
      <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-3">Today — Thursday</p>
      <div className="space-y-2">
        {rows.map(([label, who, status], i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
            <span
              className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                status === 'done' ? 'bg-emerald-500 text-white' : 'border border-slate-300'
              }`}
            >
              {status === 'done' ? '✓' : ''}
            </span>
            <span className={`text-sm flex-1 ${status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
              {label}
            </span>
            <span className="text-[11px] text-slate-400">{who}</span>
          </div>
        ))}
      </div>
    </Window>
  )
}

function QuranView() {
  return (
    <Window title="Quran · Adam">
      <div className="flex items-baseline justify-between mb-3">
        <p
          className={`${amiri.className} text-2xl text-[#1b3a2f]`}
          dir="rtl"
          lang="ar"
        >
          سورة الملك
        </p>
        <span className="text-[11px] text-slate-400">last reviewed 3 days ago</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        {(
          [
            ['New', 'ayah 12–18'],
            ['Revision', 'ayah 1–11'],
            ['Recitation', 'full surah'],
          ] as [string, string][]
        ).map(([k, v], i) => (
          <div key={i} className="rounded-lg bg-[#1b3a2f]/5 px-2 py-3">
            <p className="text-[10px] uppercase tracking-wide text-[#1b3a2f]/70">{k}</p>
            <p className="text-xs text-slate-700 mt-1">{v}</p>
          </div>
        ))}
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-[#1b3a2f]" style={{ width: '64%' }} />
      </div>
      <p className="text-[11px] text-slate-400 mt-2">Due for revision: ayah 1–11 (revision overdue)</p>
    </Window>
  )
}

function RecordsView() {
  const stats: [string, string][] = [
    ['Attendance', '168 / 170 days'],
    ['Subjects', '6 active'],
    ['Lessons completed', '412'],
    ['Evidence items', '57'],
  ]
  const subjects: [string, number][] = [
    ["Qur'an", 82],
    ['Arabic', 74],
    ['Math', 91],
    ['Science', 68],
  ]
  return (
    <Window title="Records report · ready to print">
      <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-3">
        School year 2025–26 · Maryam
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map(([k, v], i) => (
          <div key={i} className="rounded-lg border border-slate-100 px-3 py-2.5">
            <p className="text-[11px] text-slate-400">{k}</p>
            <p className="text-sm font-medium text-slate-700">{v}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {subjects.map(([subject, pct], i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-16">{subject}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#1b3a2f]" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-slate-400 w-8 text-right">{pct}%</span>
          </div>
        ))}
      </div>
    </Window>
  )
}

const trustCards = [
  {
    heading: "Your family's data stays yours",
    body: "We store what runs the school day — lessons, attendance, evidence. Spiritual practice is never tracked, scored, or shared.",
    tag: undefined,
  },
  {
    heading: 'Built by a Muslim family',
    body: 'Made by people who homeschool with Quran at the centre, for the review days and Tuesday mornings we live ourselves.',
    tag: 'founder' as const,
  },
  {
    heading: 'Proof, not promises',
    body: 'Real records you can print and hand to an advisor or reviewer — evidence the learning happened.',
    tag: undefined,
  },
]

export default function LandingPage() {
  useReveal()

  return (
    <div className={`${amiri.variable} ${cormorant.variable} bg-[#f7f4ec] text-[#1a2030] overflow-x-hidden`}>
      {/* HERO */}
      <section
        className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-6 text-[#f4efe3] overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 35%, #16224a 0%, #0c1430 50%, #070b1f 100%)' }}
      >
        <HeroStars />
        <div className="relative z-10 max-w-3xl">
          <p
            className={`${amiri.className} text-5xl sm:text-6xl text-[#d4af37] mb-3`}
            dir="rtl"
            lang="ar"
            style={{ animation: 'riseIn 1.4s ease-out both', textShadow: '0 0 24px rgba(212,175,55,0.3)' }}
          >
            رَّبِّ زِدْنِي عِلْمًا
          </p>
          <p
            className="text-xs text-[#c3cbde] italic mb-12"
            style={{ animation: 'riseIn 1.4s ease-out 0.3s both' }}
          >
            "My Lord, increase me in knowledge." — Qur'an 20:114
          </p>
          <h1
            className={`${cormorant.className} text-4xl sm:text-6xl leading-tight mb-5`}
            style={{ animation: 'riseIn 1.4s ease-out 0.5s both' }}
          >
            The school they built at home.
            <br />
            The record that proves it.
          </h1>
          <p
            className="text-[#c3cbde] max-w-xl mx-auto leading-relaxed mb-9"
            style={{ animation: 'riseIn 1.4s ease-out 0.7s both' }}
          >
            A homeschool dashboard built from the ground up for Muslim families — Quran, Arabic, and an
            Islamic school year at its core. Not adapted. Built.
          </p>
          <div
            className="flex flex-col items-center gap-3"
            style={{ animation: 'riseIn 1.4s ease-out 0.9s both' }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-3.5 rounded-full bg-[#d4af37] text-[#0c1430] font-medium hover:bg-[#e6c25a] transition-colors no-underline"
            >
              Set up your household
            </Link>
            <a href="#what" className="text-sm text-[#c3cbde] hover:text-white no-underline">
              See how it works ↓
            </a>
          </div>
        </div>
      </section>

      {/* WHAT IT HOLDS */}
      <section id="what" className="max-w-5xl mx-auto px-6 py-24">
        <div className="reveal text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs uppercase tracking-widest text-[#1b3a2f]/60 mb-3">What it holds</p>
          <h2 className={`${cormorant.className} text-3xl sm:text-4xl mb-4`}>
            Every lesson. Every session. Every day. Visible.
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Today's lessons, attendance and the days you missed, and each child's Quran progress — surah,
            ayah, and what's due for revision.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="reveal">
            <TodayView />
          </div>
          <div className="reveal" style={{ transitionDelay: '0.15s' }}>
            <QuranView />
          </div>
        </div>
      </section>

      {/* THE MOAT */}
      <section className="bg-white py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-widest text-[#1b3a2f]/60 mb-3">
              Why not one of the other 158 tools
            </p>
            <h2 className={`${cormorant.className} text-3xl sm:text-4xl`}>
              Every other tool treats Quran, Arabic, and Islamic Studies as renamed folders in a generic
              gradebook.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="reveal rounded-2xl border border-slate-200 p-7">
              <p className="text-sm font-semibold text-slate-400 mb-4">Generic homeschool tools</p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li>✕ Quran is a subject folder with a grade</li>
                <li>✕ Arabic is a relabelled "language" slot</li>
                <li>✕ The school year ignores Ramadan</li>
                <li>✕ Hifz progress lives in a notes field</li>
              </ul>
            </div>
            <div
              className="reveal rounded-2xl border-2 border-[#1b3a2f] p-7"
              style={{ transitionDelay: '0.15s' }}
            >
              <p className="text-sm font-semibold text-[#1b3a2f] mb-4">Sheath Academy</p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li>✓ Surah, ayah range, session type, revision date</li>
                <li>✓ Arabic as a first-class subject from the start</li>
                <li>✓ A year that pauses for Ramadan automatically</li>
                <li>✓ A data model that knows what a Quran session is</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROOF */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="reveal">
            <p className="text-xs uppercase tracking-widest text-[#1b3a2f]/60 mb-3">The proof</p>
            <h2 className={`${cormorant.className} text-3xl sm:text-4xl mb-4`}>
              When the review comes, you open one page.
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Attendance, progress by subject, completed lessons, portfolio evidence, and your own
              reflections — gathered into a single records report, ready to print. The midnight-before-the-review
              scramble is simply over.
            </p>
          </div>
          <div className="reveal" style={{ transitionDelay: '0.15s' }}>
            <RecordsView />
          </div>
        </div>
      </section>

      {/* COMMITMENT */}
      <section className="bg-[#0c1430] text-[#f4efe3] py-28">
        <div className="reveal max-w-xl mx-auto px-6 text-center">
          <p className={`${cormorant.className} text-2xl sm:text-3xl leading-relaxed mb-5`}>
            No streak counters for prayer. No virtue points. No leaderboards.
          </p>
          <p className="text-[#9aa3c0] leading-relaxed">
            Quantifying spiritual practice creates comparison pressure and performative worship. This
            software does not do that. Not as an oversight — as a commitment.
          </p>
        </div>
      </section>

      {/* TRUST */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="grid sm:grid-cols-3 gap-6">
          {trustCards.map(({ heading, body, tag }, i) => (
            <div
              key={i}
              className="reveal rounded-2xl bg-white ring-1 ring-black/5 p-6"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              {tag === 'founder' && (
                <div className="w-10 h-10 rounded-full bg-[#1b3a2f]/10 mb-3 flex items-center justify-center text-[#1b3a2f] text-sm font-semibold">
                  SA
                </div>
              )}
              <p className="font-semibold text-slate-800 mb-2">{heading}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CLOSE / CTA */}
      <section
        className="relative text-center px-6 py-28 overflow-hidden text-[#f4efe3]"
        style={{ background: 'linear-gradient(to top, #d6a078 0%, #6b5a8c 45%, #16224a 100%)' }}
      >
        <div className="reveal relative z-10 max-w-2xl mx-auto">
          <h2 className={`${cormorant.className} text-4xl sm:text-5xl mb-8`}>
            Built by a Muslim family. For yours.
          </h2>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-3.5 rounded-full bg-white text-[#1b3a2f] font-medium hover:bg-[#f4efe3] transition-colors no-underline"
            >
              Set up your household
            </Link>
            <Link href="/login" className="text-sm text-[#f4efe3]/80 hover:text-white no-underline">
              Already have an account? Sign in
            </Link>
          </div>
          <p className="text-xs text-[#f4efe3]/70 mt-8">
            Want the full story?{' '}
            <Link href="/about" className="underline text-[#f4efe3]/70 hover:text-white">
              Read about the project →
            </Link>
          </p>
        </div>
      </section>

      <footer className="bg-[#0c1430] text-center text-xs text-[#6b7390] py-8">
        © 2026 Sheath Academy
      </footer>
    </div>
  )
}
