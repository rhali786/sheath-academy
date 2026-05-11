'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

interface HeaderProps {
  onTabChange?: (tab: string) => void
  selectedTab?: string
  householdName?: string
}

export function Header({ onTabChange, selectedTab = '', householdName }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()
  const tabs = ['Today', 'Weekly', 'Reports', 'Settings']

  function handleTabChange(tab: string) {
    onTabChange?.(tab)
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Brand row */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-900 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-base font-bold leading-none" aria-hidden="true">ش</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight">
                Sheath Academy{' '}
                <span className="text-xs font-normal text-slate-400">
                  v{process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'}
                </span>
              </h1>
              <p className="text-xs text-slate-400">{householdName || 'Home Education'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Hijri date — hidden on small screens */}
            <div className="hidden sm:block text-right">
              <div className="text-base font-bold text-forest-900 leading-tight" lang="ar" dir="rtl">
                ١٧ ذو القعدة
              </div>
              <div className="text-xs text-slate-400 mt-0.5">1447 AH · Sun, 10 May 2026</div>
            </div>

            {/* Auth controls */}
            {session ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-slate-500 max-w-[160px] truncate">{session.user?.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  aria-label="Sign out"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-forest-900 text-white hover:bg-forest-800 transition-colors"
              >
                Sign in
              </Link>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Desktop tab nav */}
        <div className="hidden md:flex gap-0.5 -mb-px">
          {tabs.map((tab) => (
            onTabChange ? (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                  selectedTab === tab
                    ? 'bg-forest-900 text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ) : (
              <Link
                key={tab}
                href="/"
                className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              >
                {tab}
              </Link>
            )
          ))}
          <Link
            href="/about"
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
              pathname === '/about'
                ? 'bg-forest-900 text-white'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            About
          </Link>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          {/* Hijri date on mobile */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-sm font-bold text-forest-900" lang="ar" dir="rtl">١٧ ذو القعدة</div>
            <div className="text-xs text-slate-400 mt-0.5">1447 AH · Sun, 10 May 2026</div>
          </div>
          <nav className="py-1">
            {tabs.map((tab) => (
              onTabChange ? (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                    selectedTab === tab
                      ? 'bg-forest-50 text-forest-900'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ) : (
                <Link
                  key={tab}
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  {tab}
                </Link>
              )
            ))}
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-colors ${
                pathname === '/about'
                  ? 'bg-forest-50 text-forest-900'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              About
            </Link>
          </nav>
          {/* Mobile auth controls */}
          <div className="px-4 py-3 border-t border-slate-100">
            {session ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 truncate max-w-[180px]">{session.user?.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  aria-label="Sign out"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-xs font-medium text-forest-900 hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
