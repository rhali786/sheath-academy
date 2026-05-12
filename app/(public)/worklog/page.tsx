'use client'

import { useEffect } from 'react'
import { Playfair_Display, IBM_Plex_Mono, DM_Sans } from 'next/font/google'
import s from './worklog.module.css'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], variable: '--font-playfair' })
const ibmMono  = IBM_Plex_Mono({  subsets: ['latin'], weight: ['400', '500'],                                variable: '--font-ibm-mono' })
const dmSans   = DM_Sans({        subsets: ['latin'], weight: ['300', '400', '500', '600'],                  variable: '--font-dm-sans' })

const sessions = [
  { date: 'Sun May 3',       width: '1%',   bg: '#4a6654',                   label: 'Started the project',                                 time: '—' },
  { date: 'Mon May 4 AM',    width: '17%',  bg: '#4a9ebe',                   label: 'First version of the app built',                      time: '1h 10m' },
  { date: 'Mon May 4 PM',    width: '50%',  bg: '#c0392b',                   label: 'Troubleshooting — software conflict, had to roll back', time: '3h 30m' },
  { date: 'Fri–Sat May 8–9', width: '100%', bg: '#1a5c3a',                   label: '★ Rebuilt everything on better tools — the real foundation', time: '6h 55m' },
  { date: 'Sat May 9',       width: '24%',  bg: '#4a9ebe', opacity: '0.75',  label: 'Cleaned up, tested, removed old files',               time: '1h 41m' },
  { date: 'Sun May 10 early',width: '18%',  bg: '#9b59b6',                   label: 'Redesigned the look — green & blue colour scheme',     time: '~solo' },
  { date: 'Sun May 10 mid',  width: '8%',   bg: '#c4963a',                   label: 'Wrote the roadmap, 35 features planned out',           time: '34m' },
  { date: 'Sun May 10 PM',   width: '22%',  bg: '#2d7a52',                   label: 'Built sign-in — email link, no password needed',       time: '1h 33m' },
  { date: 'Sun May 10 eve',  width: '30%',  bg: '#2d7a52',                   label: 'Merged sign-in, added About page, tidied navigation',  time: '2h 03m' },
]

export default function WorklogPage() {
  useEffect(() => {
    function scaleSlide() {
      const slide = document.getElementById('slide')
      if (!slide) return
      const scale = Math.min(window.innerWidth / 1100, window.innerHeight / 620)
      slide.style.transform = `scale(${scale})`
    }
    scaleSlide()
    window.addEventListener('resize', scaleSlide)
    return () => window.removeEventListener('resize', scaleSlide)
  }, [])

  return (
    <div className={`${playfair.variable} ${ibmMono.variable} ${dmSans.variable} ${s.body}`}>
      <div className={s.slide} id="slide">

        {/* LEFT */}
        <div className={s.left}>
          <div>
            <div className={s.eyebrow}>Week 1 · May 3–10, 2026</div>
            <div className={s.project}>
              Sheath<br />
              <em className={s.projectItalic}>Academy</em>
            </div>
            <div className={s.tagline}>
              A homeschool dashboard<br />built from scratch
            </div>
          </div>
          <div className={s.hoursBlock}>
            <div className={s.hoursNum}>17<span className={s.hoursUnit}>h</span></div>
            <div className={s.hoursLabel}>
              recorded across 9 work sessions<br />
              <strong className={s.hoursLabelStrong}>likely 20–25h</strong> of real effort
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className={s.right}>

          {/* OUTCOMES */}
          <div className={s.outcomes}>
            <div className={`${s.outcome} ${s.outcomeDone}`}>
              <div className={`${s.outcomeVal} ${s.green}`}>Working app</div>
              <div className={s.outcomeDesc}>Went from nothing to a live, deployed website in one week</div>
            </div>
            <div className={`${s.outcome} ${s.outcomeLost}`}>
              <div className={`${s.outcomeVal} ${s.red}`}>3½h lost</div>
              <div className={s.outcomeDesc}>Spent on a dead end — a software upgrade that kept crashing. Had to undo it all.</div>
            </div>
            <div className={`${s.outcome} ${s.outcomeBuilt}`}>
              <div className={`${s.outcomeVal} ${s.blue}`}>35 features planned</div>
              <div className={s.outcomeDesc}>Mapped out and ready to build. The first one — sign-in — is already done.</div>
            </div>
          </div>

          {/* TIMELINE */}
          <div className={s.timeline}>
            <div className={s.weekLabel}>What happened, session by session</div>
            {sessions.map((row) => (
              <div key={row.date} className={s.row}>
                <div className={s.rowDate}>{row.date}</div>
                <div className={s.rowBarTrack}>
                  <div
                    className={s.rowBar}
                    style={{ width: row.width, background: row.bg, opacity: row.opacity ? parseFloat(row.opacity) : 1 }}
                  >
                    <span className={s.rowBarText}>{row.label}</span>
                  </div>
                </div>
                <div className={s.rowTime}>{row.time}</div>
              </div>
            ))}
          </div>

          {/* TAKEAWAYS */}
          <div className={s.takeaways}>
            <div className={`${s.takeaway} ${s.takeawayRed}`}>
              <div className={s.takeawayHead}>The detour</div>
              <div className={s.takeawayBody}>3½ hours went to a software upgrade that didn’t work. Had to undo it all and go back to what was stable.</div>
            </div>
            <div className={`${s.takeaway} ${s.takeawayGreen}`}>
              <div className={s.takeawayHead}>The turning point</div>
              <div className={s.takeawayBody}>Friday night’s 7-hour session is when the real app came together. Switched to better tools and rebuilt from scratch.</div>
            </div>
            <div className={`${s.takeaway} ${s.takeawayBlue}`}>
              <div className={s.takeawayHead}>Where things stand</div>
              <div className={s.takeawayBody}>The app is live. Users can sign in. 35 features are planned. Week 2 is ready to go.</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
