'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  getNavItemsBySection,
  isNavItemActive,
  type NavItem,
} from '@/features/layout/lib/navConfig'
import { formatHeaderDates, type HeaderDateDisplay } from '@/features/layout/lib/formatHeaderDates'

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

function NavRow({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const active = isNavItemActive(pathname, item)

  const baseClass =
    'flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors'
  const activeClass = active
    ? 'bg-forest-900 text-white'
    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'

  if (item.disabled) {
    return (
      <div
        className={`${baseClass} text-slate-300 cursor-not-allowed`}
        aria-disabled="true"
        data-testid={`nav-disabled-${item.id}`}
      >
        <span>{item.label}</span>
        {item.showDisabledBadge && (
          <span
            data-testid="nav-badge-messages"
            className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 opacity-40"
            aria-hidden="true"
          >
            3
          </span>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      className={`${baseClass} ${activeClass}`}
      aria-current={active ? 'page' : undefined}
    >
      <span>{item.label}</span>
    </Link>
  )
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [headerDates, setHeaderDates] = useState<HeaderDateDisplay | null>(null)

  useEffect(() => {
    setHeaderDates(formatHeaderDates(new Date()))
  }, [])

  const mainItems = getNavItemsBySection('main')
  const footerItems = getNavItemsBySection('footer')

  const panel = (
    <aside
      className="flex flex-col h-full w-60 bg-white border-r border-slate-100"
      data-testid="sidebar"
      aria-label="Main navigation"
    >
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <Link href="/" className="block hover:opacity-80 transition-opacity" onClick={onClose}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold leading-none" aria-hidden="true">
                ش
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Sheath</span>
          </div>
          <p className="text-xs text-slate-400 pl-[2.625rem]">Faith. Learning. Purpose.</p>
        </Link>
        <div className="mt-3 pl-[2.625rem]" data-testid="sidebar-hijri-date">
          <div className="text-sm font-bold text-forest-900 leading-tight" lang="ar" dir="rtl">
            {headerDates?.hijriDayMonthAr ?? '\u2014'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {headerDates?.hijriYearAndGregorian ?? '\u2014'}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {mainItems.map((item) => (
          <NavRow key={item.id} item={item} pathname={pathname} onNavigate={onClose} />
        ))}
      </nav>

      <nav className="px-3 py-4 border-t border-slate-100 space-y-0.5">
        {footerItems.map((item) => (
          <NavRow key={item.id} item={item} pathname={pathname} onNavigate={onClose} />
        ))}
      </nav>
    </aside>
  )

  return (
    <>
      <div className="hidden md:flex md:flex-shrink-0 md:sticky md:top-0 md:h-screen">
        {panel}
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" data-testid="sidebar-mobile-drawer">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close navigation menu"
            data-testid="sidebar-backdrop"
            onClick={onClose}
          />
          <div className="relative z-10 h-full shadow-xl">{panel}</div>
        </div>
      )}
    </>
  )
}
