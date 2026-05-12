import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { SessionProviderWrapper } from '@/features/auth/front/components/SessionProviderWrapper'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sheath Academy',
  description: 'Homeschool Dashboard',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  )
}
