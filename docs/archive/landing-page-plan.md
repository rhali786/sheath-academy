# Landing Page: "Seek Knowledge" — Content & Design Plan

**Concept:** Option C — Islamic Sky / Constellation
**Palette:** Deep indigo, burnished gold, silver-white, warm ivory. No light backgrounds until the CTA close.
**Feeling target:** *Sakinah* first, "wow" second — and the wow must come from depth and restraint, never from speed, brightness, or noise.

---

## Direction (read this first — it overrides anything below it)

The concept targets the right *feeling* but risks being the wrong *commercial vehicle*: a pure mood piece that moves people without converting them. The resolution:

- **Sakinah is the tone, not an excuse to withhold.** Keep the calm, the āyah, the restraint, the dark palette.
- **Demote the cinematic constellation from "the whole page" to one tasteful hero moment.** Below the hero, the page turns grounded and trustworthy.
- **Show, don't only tell.** Real screenshots of the actual Quran tracker and records report carry more weight than abstract geometry.
- **Make the commercial case explicitly.** The moat (vs. the 158 generic tools), privacy reassurance, who's behind it, and a soft secondary CTA for the not-yet-ready.
- **Earn trust visibly.** This audience runs on trust and word-of-mouth; build the scaffolding for it.

The three build versions should explore *how far* to lean cinematic vs. grounded — see the closing note.

---

## Governing design principles

The hard part: "wow" usually means *stimulation* (fast, bright, loud); *sakinah* means the opposite (slow, deep, quiet). The resolution is to make the awe come from **depth and restraint**, not motion and volume.

1. **Everything breathes slowly.** No animation under ~1.2s. Stars drift at the pace of a real night sky. Easing is always `ease-in-out` — never bouncy, never snappy. Speed reads as commercial; slowness reads as reverence.
2. **Darkness with depth, not flatness.** The indigo is never one flat color — it's a radial gradient from near-black edges to a faint warm glow at center, like the sky just after Maghrib. A soft vignette pulls the eye inward and calms the periphery.
3. **Light is the luxury.** Gold is used like gold leaf in a manuscript — sparingly, so each appearance feels precious. Glows are soft (blurred bloom), never sharp neon.
4. **Negative space is visual silence.** Each section gets close to a full viewport of room. The emptiness around the calligraphy is what makes it feel holy rather than crowded.
5. **A breath before beginning.** The page opens on a half-second of pure black with a single faint centered star before the sky fades in — a moment of stillness that makes the visitor quiet down before any content arrives.
6. **Respect `prefers-reduced-motion`.** Serve a gorgeous *static* version (finished constellation, pre-written calligraphy, no parallax) to anyone who needs it. Agitating a motion-sensitive visitor is the opposite of the goal — accessibility is part of sakinah.

---

## Section 1 — The Opening (Hero, full screen)

A half-second of black, one faint star, then a deep-indigo sky fades in with stars drifting slowly. Centered:

**Arabic calligraphy, large — a du'a from the Qur'an:**
> رَّبِّ زِدْنِي عِلْمًا

**Below it, small, elegant:**
> "My Lord, increase me in knowledge." — Qur'an 20:114

> **Why this verse, not the "even unto China" hadith:** the famous "seek knowledge even unto China" narration is widely classified as *da'if* (weak). For a knowledgeable Muslim audience, leading the page with a weak hadith quietly undermines trust. This āyah is Qur'an (above dispute), shorter and more beautiful to set, and — being a *du'a* — carries far more sakinah than an instruction.

Pause. Let it breathe. Then the headline fades in (and rises ~8px as it does — subtle upward motion reads as aspiration):

> **"The school they built at home. The record that proves it."**

One line of subtext:

> *Sheath Academy is a homeschool dashboard built from the ground up for Muslim families — Quran, Arabic, and an Islamic school year at its core. Not adapted. Built.*

**Actions:** Primary **"Create your household"** (→ signup — this is the action for a *new* visitor, who cannot "sign in" to nothing). Secondary, smaller: *"Already have an account? Sign in."* A soft scroll cue rests below.

### Motion craft
- Stars are **not** uniform dots — three depth layers parallax at different speeds (foreground sharp, background soft-blurred). This is the "wow": it reads as genuine 3D space.
- The calligraphy **draws itself** stroke by stroke (SVG path animation, ~3s), as if written by an unseen hand, a faint gold bloom trailing the stroke tip. This is the emotional centerpiece.
- Twinkle is restrained — one or two stars at a time, never a blinking field.

---

## Section 2 — The Constellation (Wordless transition)

Stars begin connecting — lines draw with a **point of gold light traveling along them**, slow, like a spark following a fuse. When the 8-pointed star (*khatam*) completes, it gives **one soft pulse of light outward, like an exhale.** That pulse is the "wow" beat.

Then it zooms in slowly, and the points of the star become the sections of the dashboard — which **assembles out of the geometry**: cards fading up from the star's points with a slight blur-to-focus. The product *emerges* from sacred geometry rather than interrupting it. No hard screenshot.

One line appears as the reveal completes:

> *"Every lesson. Every session. Every day. Visible."*

**A concrete glimpse (grounds the poetry in substance).** Immediately beneath the reveal, a single quiet line naming what the dashboard actually holds — so a visitor never leaves unsure what they *get*:

> *Today's lessons. Attendance and the days you missed. Each child's Quran progress — surah, ayah, and what's due for revision. A school year that already knows to pause for Ramadan.*

---

## Section 3 — The Scene (Narrative pain)

Dark card. One story, told in two voices — and the two voices carry two visual weights.

**The moment** (lighter serif italic, dimly lit — confusion):
> *"A Quran teacher asks how Adam is progressing with Al-Mulk. The parent opens a notes app with three bullet points and a feeling."*

**The response** (brighter, settled, confident — clarity):
> A Quran session is not a note. It has a surah, an ayah range, a session type — new memorisation, revision, recitation — and a last-reviewed date that determines what comes next. That structure cannot live in a notes field. We built the field it actually needs.

### Motion craft
- The dim→bright contrast mirrors the confusion→clarity arc.
- A faint *mashrabiya* (wooden lattice) shadow drifts almost imperceptibly across the card background — light through a carved screen.

---

## Section 4 — The Three Pillars (The Difference)

Three short, confident statements — not a feature list. They reveal **one at a time on scroll**, each with its own small *khatam* motif drawing itself in gold beside it. Never all three at once — the sequence creates rhythm, like dhikr.

- **"Quran is not a folder."** Surah, ayah range, session type, revision history. The data model knows the difference.
- **"Ramadan is on the calendar."** Your school year pauses when your family does. Not the other way around.
- **"Arabic is not a renamed subject."** Built as a first-class subject from the start. Not relabelled from someone else's gradebook.

### Motion craft
- On desktop hover, the gold motif rotates a few degrees, slowly. Alive, but calm.

---

## Section 5 — The Proof (The exhale the page is building toward)

This is the emotional climax — and it pays off the headline's promise ("…the record that proves it") and the About page's deepest pain: *"She knows the learning happened. She cannot prove it."*

> **"When the review comes, you open one page."**
>
> Attendance, progress by subject, completed lessons, portfolio evidence, your own reflections — gathered into a single records report, ready to print. The midnight-before-the-review scramble is simply over.

This section can let the dashboard's records view settle gently into focus behind the text — the relief made visible.

---

## Section 6 — The Commitment (Quiet and firm — total stillness)

The stillest section in the page. **No motion at all.** After sections of movement, sudden stillness is itself powerful — the heart settles. Near-black, ivory text, enormous breathing room. The absence of animation here *is* the design.

> *No streak counters for prayer. No virtue points. No leaderboards.*
>
> Quantifying spiritual practice creates comparison pressure and performative worship. This software does not do that. Not as an oversight — as a commitment.

---

## Section 7 — The Close (CTA + dawn)

The dawn transition is the payoff: indigo warms toward a soft rose-gold horizon glow rising from the bottom — *Fajr*, not harsh daylight. The starfield doesn't vanish; stars gently fade as light rises. Hope, not a hard cut.

> **"Built by a Muslim family. For yours."**

**An optional, honest founder note** (only if true — no marketing voice): one or two sentences on *why* this was built. For this audience, a genuine human reason lands harder than any feature claim. No fabricated testimonials — the honest tone is part of the moat.

**Primary CTA:** **"Create your household"** (→ signup). Ivory/gold, with a soft glow on hover that *breathes* (slow pulse), never a hard hover state.

**Secondary CTA for the not-yet-ready:** a soft, low-commitment path so curious-but-cautious visitors aren't lost — e.g. *"See how it works"* (a short demo / screenshot walkthrough) or a waitlist/notify capture. One paid signup button alone loses everyone who is interested but not ready today.

Below it, small:
> *Already have an account? Sign in. Want the full story? [Read about the project →](/about)*

**Trust scaffolding (near the close, grounded section — not over the starfield):**
- **Privacy reassurance.** Parents are entering children's data; a plain, prominent line on what is and isn't collected, and that spiritual practice is never tracked, matters more here than anywhere.
- **Who's behind it.** A real founder name/face and the honest reason it was built. This community moves on trust and word-of-mouth.
- **Proof.** Real screenshots of the Quran tracker and the records report. When testimonials exist, add them — never fabricate them.

> **Pricing note:** this is a **paid** product with **no listed price yet**. The page must therefore **not imply it is free.** Keep the CTA about *beginning* ("Create your household"), and let pricing be handled inside the signup/onboarding flow rather than asserted on the landing page. Revisit once a price or model (subscription / one-time / early-access) is decided — see Open questions.

---

## Mobile & performance (the wow must not break the sakinah)

A parallax starfield + SVG draw + canvas can mean a heavy payload and a hot battery on a mid-range phone — the exact opposite of tranquility. A slow *load* destroys sakinah before a single word is read.

- **Mobile-lite motion path:** fewer star layers, calligraphy pre-drawn (no per-stroke animation), reduced/disabled parallax, the constellation shown closer to its finished state. Lighter, but still beautiful.
- **Performance budget:** fast first paint is non-negotiable. Defer heavy canvas work until after the hero is legible; lazy-load below-the-fold sections; keep total animation JS lean.
- **Reduced motion:** as above — a complete, static, gorgeous fallback.
- **Sound (optional, off by default):** a single soft oud note or ambient desert-night tone behind a mute toggle can deepen sakinah — but it must **never** autoplay.

---

## Routing note

Dashboard moves to `/dashboard`. Root `/` is this page — public, no auth required. Middleware matcher excludes `/` (and the signup route) from the auth guard. Confirm `/signup` exists and is reachable as the primary-CTA destination.

---

## Risks & tensions (eyes open going in)

1. **Mood piece vs. paid product.** Sakinah and conversion pull opposite ways. A slow, withholding page moves people without converting them. Mitigated by the grounded second half (moat, proof, pricing-in-flow, secondary CTA) — but watch that the calm never becomes a reason to under-inform.
2. **The constellation is a near-cliché.** "Particles connect into a shape" is a decade-old hero trope; the originality here is the Islamic *skin*, not the *structure*. Demoting it to one hero moment limits the exposure. Execute it with unusual restraint or it reads as familiar.
3. **Heavy motion ages fast and can read as trying too hard.** Scroll-assembly and stroke-draws are a 2020–2023 house style. For a product selling calm reliability, an overwrought showreel undercuts credibility. Restraint is the brand.
4. **Heaven vs. homework — thematic gap.** The product is mundane and operational; the visuals are cosmic. Don't write an emotional check the dashboard can't cash. Keep the grounded sections honest about what the tool actually is.
5. **Animating a Qur'anic āyah is a respect + execution risk.** Some will find it beautiful; a conservative segment may not. And malformed Arabic (script, tashkīl, ligatures) in front of a knowledgeable audience is worse than no āyah. Get the calligraphy verified by someone qualified; consider a static, perfectly-set āyah over animation.
6. **Fear-selling contradicts the sakinah promise.** The pain narratives manufacture anxiety to sell calm. Keep them gentle and brief; lead with relief, not dread.
7. **SEO, accessibility, maintenance.** An all-canvas hero is poor for SEO and a contrast/readability trap (gold-on-indigo, ivory-on-black, small elegant type — older parents are in the audience). It is also expensive to build and maintain across mobile-lite and reduced-motion variants. Budget for it deliberately; meet WCAG contrast.
8. **The audience is not one aesthetic.** Arab, South Asian, West African, and convert communities carry different visual traditions. A single strong look that delights one segment may feel "not for me" to another. Lean on near-universal anchors (the Qur'an, geometry, restraint) over culturally specific ornament.

---

## The three build versions (next step)

Build three real, viewable versions that explore *how far* to lean cinematic vs. grounded, so the choice can be made by seeing rather than arguing:

- **Version A — Cinematic.** The full Section-C experience: starfield, self-drawing calligraphy, constellation assembly. Tests the maximal "wow." Highest risk on the critiques above.
- **Version B — Grounded (the synthesis).** One tasteful hero moment, then real screenshots, the moat made explicit, trust scaffolding, secondary CTA, accessible type. The recommended direction.
- **Version C — Still / minimal.** Near-static, near-black, the āyah set perfectly (not animated), enormous negative space, almost no motion. Sakinah taken to its quietest extreme — tests whether *less* is the actual wow.

All three: public `/`, signup-first CTA, `prefers-reduced-motion` fallback, no claim that the product is free.

---

## Open questions (confirm before / during build)

1. **Pricing & model** — paid, but subscription / one-time / invite-only / early-access? Determines what the CTA and onboarding can honestly say.
2. **Self-signup** — is `/signup` open to the public, or invite/waitlist only? If waitlisted, the primary CTA becomes "Request early access," not "Create your household."
3. **Audience beyond homeschool parents** — the About page hints at *tutor-led programs*. Should the landing page speak to tutors/programs too, or stay tightly on the homeschooling family?
4. **Founder note** — is there a true, shareable reason this was built that we can put in the visitor's hands?
