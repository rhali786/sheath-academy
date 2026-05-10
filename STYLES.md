# Sheath Academy — Style Guide

Design language: clean, Notion-inspired. White surfaces, forest green brand, slate neutrals. No decorative borders unless structurally needed.

---

## Colors

### Brand (Forest Green)
| Token | Hex | Use |
|---|---|---|
| `forest-950` | `#0a2d1a` | Deep backgrounds (rare) |
| `forest-900` | `#1a5c3a` | Primary brand — active tabs, CTAs, key numerals, logo bg |
| `forest-800` | `#1e6b45` | Hover state for primary buttons |
| `forest-700` | `#237a4e` | Progress bar fill |
| `forest-600` | `#2d9862` | Mid-weight accents |
| `forest-200` | `#a8d5bb` | Spinner track |
| `forest-100` | `#dcf0e5` | Badge bg, button bg (ghost variant) |
| `forest-50`  | `#f0f9f4` | Subtle hover bg |

### Secondary (Sky Blue)
| Token | Use |
|---|---|
| `sky-700` | Secondary text on sky badges |
| `sky-600` | Links, Arabic subject badge text |
| `sky-500` | Status bar accent |
| `sky-100` | Arabic subject badge bg |
| `sky-50`  | Secondary button bg |

### Neutrals
| Token | Use |
|---|---|
| `slate-900` | Primary text, headings |
| `slate-700` | Body text |
| `slate-600` | Secondary labels, input text |
| `slate-500` | Inactive nav tabs, muted text |
| `slate-400` | Captions, timestamps, subtitles |
| `slate-200` | Input/select borders |
| `slate-100` | Dividers, card borders, progress bar track |
| `slate-50`  | Page background, hover bg |
| `white`     | Card surfaces, header bg |

### Status
| Status | Text | Background |
|---|---|---|
| Success / green | `forest-900` | `forest-100` |
| Warning / amber | `amber-800` or `amber-700` | `amber-100` |
| Error / red | `red-800` or `red-600` | `red-100` |
| Info / blue | `sky-700` or `sky-600` | `sky-100` |
| Neutral / gray | `slate-600` or `slate-500` | `slate-100` |

### Subject Badge Colors
| Subject | Classes |
|---|---|
| QURAN | `bg-forest-100 text-forest-900` |
| ARABIC | `bg-sky-100 text-sky-700` |
| MATH | `bg-orange-100 text-orange-800` |
| READING | `bg-emerald-100 text-emerald-800` |
| SCIENCE | `bg-indigo-100 text-indigo-800` |
| ISLAMIC STUDIES | `bg-violet-100 text-violet-800` |
| ENGLISH | `bg-cyan-100 text-cyan-800` |
| HISTORY | `bg-amber-100 text-amber-800` |

---

## Typography

Font: **Inter** via `--font-inter` CSS variable, loaded in `app/layout.tsx`.

| Role | Classes |
|---|---|
| Brand name (header h1) | `text-base font-bold text-slate-900 leading-tight tracking-tight` |
| Section heading (h2) | `text-xl font-bold text-slate-900` |
| Page heading (placeholder pages h2) | `text-2xl font-bold text-slate-900` |
| Card/group heading (h3) | `text-sm font-semibold text-slate-900` |
| Large numeral (metric) | `text-4xl font-bold leading-none tabular-nums` |
| Body text | `text-sm text-slate-700 leading-snug` |
| Label / eyebrow | `text-xs font-semibold text-slate-400 uppercase tracking-widest` |
| Caption / metadata | `text-xs text-slate-400` |
| Arabic / RTL text | `lang="ar" dir="rtl" text-base font-bold text-forest-900` |

---

## Spacing

### Page Layout
| Token | Value |
|---|---|
| Max content width | `max-w-7xl mx-auto` |
| Horizontal padding | `px-4 sm:px-6 lg:px-8` |
| Vertical section padding | `py-10` |

### Component Internals
| Context | Value |
|---|---|
| Card padding (default) | `p-4` |
| Card padding (metric) | `p-5` |
| Card padding (task group) | `p-6` |
| Card padding (placeholder) | `p-8` |
| Section gap (grid) | `gap-8` |
| Stacked item gap | `space-y-2` |
| Dense item gap | `space-y-0.5` |
| Section title bottom margin | `mb-5` |
| Card header bottom margin | `mb-3` |

---

## Border Radius

| Context | Value |
|---|---|
| Cards, logo mark | `rounded-xl` |
| Buttons, inputs, task rows | `rounded-lg` |
| Nav tabs (top only) | `rounded-t-lg` |
| Badges, progress bars, spinner | `rounded-full` |

---

## Shadows

| Context | Value |
|---|---|
| Cards (default) | `shadow-sm` |
| Cards (hover) | `hover:shadow-md` |
| Header | `shadow-sm` |

---

## Components

### Cards
Defined as global utility classes in `app/globals.css`:
```
.card    → rounded-xl bg-white p-4 shadow-sm
.card-lg → rounded-xl bg-white p-6 shadow-sm
```
Use inline Tailwind for non-standard padding (e.g. `p-5`, `p-8`).

### Badges
```
.badge         → inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
.badge-green   → bg-forest-100 text-forest-900
.badge-amber   → bg-amber-100 text-amber-800
.badge-red     → bg-red-100 text-red-800
.badge-blue    → bg-sky-100 text-sky-700
.badge-gray    → bg-slate-100 text-slate-600
```
Subject badges use inline color classes — see Subject Badge Colors table above.

### Buttons

**Primary:**
```
px-5 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium
hover:bg-forest-800 transition-colors
```

**Ghost (colored):**
```
px-3 py-2 bg-[color]-50 text-[color]-[weight] rounded-lg font-medium text-xs
hover:bg-[color]-100 transition-colors
```
Colors in use: `forest`, `sky`, `slate`.

### Inputs / Selects
```
border border-slate-200 rounded-lg bg-white text-slate-600 text-xs font-medium
px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-900
```

### Progress Bar
```
track:  bg-slate-100 rounded-full h-1
fill:   bg-forest-900 h-1 rounded-full transition-all duration-500
```

### Loading Spinner
```
w-10 h-10 rounded-full border-4 border-forest-100 border-t-forest-900 animate-spin
```

### Navigation Tabs
```
active:   px-4 py-2.5 text-sm font-medium rounded-t-lg bg-forest-900 text-white
inactive: px-4 py-2.5 text-sm font-medium rounded-t-lg text-slate-500
          hover:text-slate-900 hover:bg-slate-50 transition-all
```

### Header
Sticky white bar with `border-b border-slate-100 shadow-sm`. Logo mark is `w-9 h-9 rounded-xl bg-forest-900` containing white Arabic ش.

---

## Transitions

| Context | Value |
|---|---|
| Buttons (color) | `transition-colors duration-200` |
| Cards (shadow) | `transition-shadow duration-200` |
| Progress bar (width) | `transition-all duration-500` |
| Nav tabs | `transition-all` |

---

## Do / Don't

- **Do** use `slate-*` for all neutral text and surfaces — not `gray-*` or `zinc-*`
- **Do** use `forest-900` for any primary interactive element
- **Do** keep cards borderless — rely on `shadow-sm` for separation
- **Don't** add decorative borders between items — use whitespace and hover states instead
- **Don't** mix radius values within one component (e.g. a card's children should not use `rounded-2xl`)
- **Don't** add a second `@tailwind` entrypoint in feature CSS files
