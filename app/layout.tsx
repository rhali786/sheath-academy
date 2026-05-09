import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sheath Academy',
  description: 'Homeschool Dashboard',
  icons: {
    icon: '/favicon.svg',
  },
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
