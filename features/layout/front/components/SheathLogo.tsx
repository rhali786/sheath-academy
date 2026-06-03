import type { SVGProps } from 'react'

/**
 * Canonical Sheath brand mark (shield + leaf).
 *
 * All product UI must import `SheathLogo` from this file — do not duplicate SVG paths
 * or use the legacy Arabic "ش" mark elsewhere.
 *
 * Static assets: keep `public/favicon.svg` in sync (same geometry; solid fills for favicon).
 * Design reference: `docs/design/dashboard-mockup-20260524.png`
 */

export const SHEATH_LOGO_VIEWBOX = '0 0 32 32'

/** Matches tailwind `forest-900` — used when SVG cannot use CSS classes (favicon). */
export const SHEATH_LOGO_SHIELD_FILL = '#1a5c3a'

/** Rounded shield from the dashboard mockup. */
export const SHEATH_LOGO_SHIELD_PATH =
  'M16 2.75L7.25 6.75V14.25C7.25 20.5 11.15 26.1 16 28.25C20.85 26.1 24.75 20.5 24.75 14.25V6.75L16 2.75Z'

/** Leaf silhouette (not flame) — wider at top, stem toward shield point. */
export const SHEATH_LOGO_LEAF_PATH =
  'M16 9.25C13.4 10.85 12.35 13.35 12.6 16.1C12.85 18.35 14.25 20.75 16 22.35C17.75 20.75 19.15 18.35 19.4 16.1C19.65 13.35 18.6 10.85 16 9.25Z'

export const SHEATH_LOGO_LEAF_VEIN_PATH = 'M16 10.5V21.5'

interface SheathLogoProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function SheathLogo({ className = '', size = 32, ...props }: SheathLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={SHEATH_LOGO_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    >
      <path d={SHEATH_LOGO_SHIELD_PATH} className="fill-forest-900" />
      <path d={SHEATH_LOGO_LEAF_PATH} className="fill-white" />
      <path
        d={SHEATH_LOGO_LEAF_VEIN_PATH}
        className="stroke-white/75"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  )
}
