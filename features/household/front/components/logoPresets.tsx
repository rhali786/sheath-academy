import { LOGO_PRESET_KEYS, type LogoPresetKey } from '@/features/lib/types'

/** Human-readable label for each preset key, e.g. in the picker's aria-label. */
export const LOGO_PRESET_NAMES: Record<LogoPresetKey, string> = {
  crescent: 'Crescent',
  star: 'Star',
  book: 'Book',
  lantern: 'Lantern',
  compass: 'Compass',
}

/** The default mark used whenever a household has not chosen a preset, or an unrecognized value is stored. */
export const DEFAULT_LOGO_PRESET: LogoPresetKey = LOGO_PRESET_KEYS[0]

export function isLogoPresetKey(value: string | undefined | null): value is LogoPresetKey {
  return value != null && (LOGO_PRESET_KEYS as readonly string[]).includes(value)
}

const MARK_PATHS: Record<LogoPresetKey, React.ReactNode> = {
  // Lucide "moon" crescent. The previous path (`a8.5 8.5 … a7 7 …`) was geometrically
  // invalid — the inner arc asked for radius 7 across a 17-unit span (needs ≥8.5), so SVG
  // silently rescaled it to the outer radius and the crescent collapsed to zero visible
  // area (a blank badge). Since crescent is the DEFAULT preset, every household without a
  // chosen mark rendered an empty circle. This path's endpoints are ~13.85 units apart, so
  // both the r=9 and r=7 arcs are valid and it renders a solid crescent.
  crescent: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" stroke="none" />,
  star: (
    <path
      d="M12 2.5l2.4 6.2 6.6.4-5.1 4.3 1.7 6.4L12 16.2l-5.6 3.6 1.7-6.4L3 8.1l6.6-.4L12 2.5z"
      fill="currentColor"
      stroke="none"
    />
  ),
  book: (
    <>
      <path d="M4 4.5h6.5a2 2 0 0 1 2 2V20a1.5 1.5 0 0 0-1.5-1.5H4z" />
      <path d="M20 4.5h-6.5a2 2 0 0 0-2 2V20a1.5 1.5 0 0 1 1.5-1.5H20z" />
    </>
  ),
  lantern: (
    <>
      <rect x="8" y="6" width="8" height="11" rx="2" />
      <path d="M12 2.5v3.5M12 17.5V21M9 21h6M6.5 9h11M6.5 14h11" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 5-5 2 2-5 5-2z" fill="currentColor" stroke="none" />
    </>
  ),
}

interface LogoMarkProps {
  /** The household's chosen preset key. Falls back to the default mark for undefined/null/unrecognized values. */
  preset?: string | null
  className?: string
  strokeWidth?: number
}

/**
 * Renders the inline SVG mark for a household logo preset key. Never crashes and never
 * renders a broken image for an unset or unrecognized preset — falls back to the default mark.
 */
export function LogoMark({ preset, className = 'w-6 h-6', strokeWidth = 1.75 }: LogoMarkProps) {
  const key: LogoPresetKey = isLogoPresetKey(preset) ? preset : DEFAULT_LOGO_PRESET
  return (
    <svg
      data-testid="household-logo-mark"
      data-preset={key}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {MARK_PATHS[key]}
    </svg>
  )
}
