'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  getNavItemsBySection,
  isNavItemActive,
  type NavItem,
} from '@/features/layout/lib/navConfig'
import { getNavIcon } from '@/features/layout/lib/navIcons'
import { formatHeaderDates, type HeaderDateDisplay } from '@/features/layout/lib/formatHeaderDates'
import { SheathLogo } from './SheathLogo'

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

function NavIcon({ itemId, active }: { itemId: string; active: boolean }) {
  const Icon = getNavIcon(itemId)
  if (!Icon) return null

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        active ? 'bg-forest-200/80 text-forest-900' : 'bg-white text-slate-500 shadow-sm'
      }`}
      data-testid={`nav-icon-${itemId}`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
    </span>
  )
}

function NavRow({
  item,
  pathname,
  settingsTab,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  settingsTab: string | null
  onNavigate?: () => void
}) {
  const active = isNavItemActive(pathname, item, settingsTab)

  const baseClass =
    'flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors'
  const activeClass = active
    ? 'bg-forest-100 text-forest-900 shadow-sm'
    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'

  const labelRow = (
    <span className="flex items-center gap-3 min-w-0">
      <NavIcon itemId={item.id} active={active} />
      <span className="truncate">{item.label}</span>
    </span>
  )

  if (item.disabled) {
    return (
      <div
        className={`${baseClass} text-slate-300 cursor-not-allowed`}
        aria-disabled="true"
        data-testid={`nav-disabled-${item.id}`}
      >
        <span className="flex items-center gap-3 min-w-0 opacity-60">
          <NavIcon itemId={item.id} active={false} />
          <span className="truncate">{item.label}</span>
        </span>
        {item.showDisabledBadge && (
          <span
            data-testid="nav-badge-messages"
            className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-400 opacity-40"
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
      {labelRow}
    </Link>
  )
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const settingsTab = pathname.startsWith('/settings') ? searchParams.get('tab') : null
  const [headerDates, setHeaderDates] = useState<HeaderDateDisplay | null>(null)
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
  const session = useSession()
  const isAdmin = session.data?.user?.isAdmin === true

  useEffect(() => {
    setHeaderDates(formatHeaderDates(new Date()))
  }, [])

  const filterByRole = (items: NavItem[]) => items.filter(item => !item.adminOnly || isAdmin)

  const mainItems = filterByRole(getNavItemsBySection('main'))
  const footerItems = filterByRole(getNavItemsBySection('footer'))

  const panel = (
    <aside
      className="flex flex-col h-full w-60 bg-slate-50 border-r border-slate-200/80"
      data-testid="sidebar"
      aria-label="Main navigation"
    >
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <Link href="/dashboard" className="block hover:opacity-80 transition-opacity" onClick={onClose}>
          <div className="flex items-center gap-2.5 mb-1">
            <SheathLogo size={34} data-testid="sheath-logo" />
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
          <NavRow key={item.id} item={item} pathname={pathname} settingsTab={settingsTab} onNavigate={onClose} />
        ))}
      </nav>

      <nav className="px-3 py-4 border-t border-slate-100 space-y-0.5">
        {footerItems.map((item) => (
          <NavRow key={item.id} item={item} pathname={pathname} settingsTab={settingsTab} onNavigate={onClose} />
        ))}
      </nav>
      {appVersion && (
        <div className="px-5 pb-4 text-[11px] text-slate-300" data-testid="sidebar-version">
          v{appVersion}
        </div>
      )}
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
