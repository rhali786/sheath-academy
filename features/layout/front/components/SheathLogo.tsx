import type { SVGProps } from 'react'

interface SheathLogoProps extends SVGProps<SVGSVGElement> {
  size?: number
}

/** Shield + leaf mark from the Sheath product mockup. */
export function SheathLogo({ className = '', size = 32, ...props }: SheathLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M16 3L6 7.5V15.5C6 21.35 10.05 26.75 16 28.5C21.95 26.75 26 21.35 26 15.5V7.5L16 3Z"
        className="fill-forest-900"
      />
      <path
        d="M16 9.5C13.5 12 12 14.2 12 16.5C12 18.5 13.2 20.2 15 20.8V23.5C15 24.05 15.45 24.5 16 24.5C16.55 24.5 17 24.05 17 23.5V20.8C18.8 20.2 20 18.5 20 16.5C20 14.2 18.5 12 16 9.5Z"
        className="fill-white"
      />
      <path
        d="M16 11.5C17.8 13.2 18.5 14.6 18.5 16.2C18.5 17.4 17.7 18.4 16.5 18.8"
        className="stroke-white/70"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
