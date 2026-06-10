'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  NAV_MODULES,
  NAV_ITEMS,
  getNavItemsBySection,
  getModuleItems,
  isNavItemActive,
  isNavModuleActive,
  type NavItem,
  type NavModuleConfig,
} from '@/features/layout/lib/navConfig'
import { getNavIcon, getModuleIcon } from '@/features/layout/lib/navIcons'
import { formatHeaderDates, type HeaderDateDisplay } from '@/features/layout/lib/formatHeaderDates'
import { useUnreadMessages } from '@/features/messaging/front/hooks/useUnreadMessages'
import { useModuleLastDestination } from '@/features/layout/front/hooks/useModuleLastDestination'
import { SheathLogo } from './SheathLogo'

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

function SquishedPanelIcon({ direction }: { direction: 'collapse' | 'expand' }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      {direction === 'collapse' ? (
        <line x1="5" y1="1" x2="5" y2="15" stroke="currentColor" strokeWidth="1.5" />
      ) : (
        <line x1="11" y1="1" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" />
      )}
    </svg>
  )
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

function ModuleIcon({ moduleId, active }: { moduleId: string; active: boolean }) {
  const Icon = getModuleIcon(moduleId) ?? getNavIcon(moduleId)
  if (!Icon) return null

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        active ? 'bg-forest-200/80 text-forest-900' : 'bg-white text-slate-500 shadow-sm'
      }`}
      data-testid={`nav-module-icon-${moduleId}`}
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
  unreadCount = 0,
  onSubNavClick,
}: {
  item: NavItem
  pathname: string
  settingsTab: string | null
  onNavigate?: () => void
  unreadCount?: number
  onSubNavClick?: (href: string) => void
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
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      onClick={() => {
        onSubNavClick?.(item.href!)
        onNavigate?.()
      }}
      className={`${baseClass} ${activeClass}`}
      aria-current={active ? 'page' : undefined}
      data-testid={`nav-item-${item.id}`}
    >
      {labelRow}
      {unreadCount > 0 && (
        <span
          data-testid="nav-badge-messages"
          className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700"
        >
          {unreadCount}
        </span>
      )}
    </Link>
  )
}

function ModuleNavGroup({
  module,
  pathname,
  settingsTab,
  onNavigate,
  inlineSubNav,
  unreadMessages,
}: {
  module: NavModuleConfig
  pathname: string
  settingsTab: string | null
  onNavigate?: () => void
  inlineSubNav: boolean
  unreadMessages: number
}) {
  const [lastHref, setDestination] = useModuleLastDestination(module.id)
  const items = getModuleItems(module)
  const moduleActive = isNavModuleActive(pathname, module, settingsTab)
  const headerHref = lastHref ?? module.defaultHref

  const baseClass =
    'flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors w-full'
  const activeClass = moduleActive
    ? 'bg-forest-100 text-forest-900 shadow-sm'
    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'

  const subNav = items.length > 0 && (
    <div
      className={
        inlineSubNav
          ? 'mt-0.5 ml-3 space-y-0.5 border-l border-slate-200 pl-2'
          : 'hidden group-hover:block group-focus-within:block absolute left-full top-0 ml-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-20'
      }
      data-testid={`nav-module-subnav-${module.id}`}
    >
      {items.map((item) => (
        <NavRow
          key={item.id}
          item={item}
          pathname={pathname}
          settingsTab={settingsTab}
          onNavigate={onNavigate}
          unreadCount={item.id === 'messages' ? unreadMessages : 0}
          onSubNavClick={setDestination}
        />
      ))}
    </div>
  )

  return (
    <div className={`relative ${items.length > 0 && !inlineSubNav ? 'group' : ''}`} data-testid={`nav-module-${module.id}`}>
      <Link
        href={headerHref}
        onClick={onNavigate}
        className={`${baseClass} ${activeClass}`}
        aria-current={moduleActive && items.length === 0 ? 'page' : undefined}
        data-testid={`nav-module-link-${module.id}`}
      >
        <ModuleIcon moduleId={module.id} active={moduleActive} />
        <span className="truncate">{module.label}</span>
        {module.id === 'messages' && unreadMessages > 0 && (
          <span
            data-testid="nav-badge-messages"
            className="ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700"
          >
            {unreadMessages}
          </span>
        )}
      </Link>
      {subNav}
    </div>
  )
}

function CollapsedModuleFlyout({
  module,
  pathname,
  settingsTab,
  onNavigate,
  unreadMessages,
}: {
  module: NavModuleConfig
  pathname: string
  settingsTab: string | null
  onNavigate?: () => void
  unreadMessages: number
}) {
  const [lastHref, setDestination] = useModuleLastDestination(module.id)
  const items = getModuleItems(module)
  const moduleActive = isNavModuleActive(pathname, module, settingsTab)
  const headerHref = lastHref ?? module.defaultHref

  return (
    <div className="relative group" data-testid={`nav-module-collapsed-${module.id}`}>
      <Link
        href={headerHref}
        onClick={onNavigate}
        className="flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors"
        aria-label={module.label}
        data-testid={`nav-module-collapsed-link-${module.id}`}
      >
        <ModuleIcon moduleId={module.id} active={moduleActive} />
      </Link>
      {items.length > 0 && (
        <div
          className="hidden group-hover:block group-focus-within:block absolute left-full top-0 ml-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50"
          data-testid={`nav-module-subnav-${module.id}`}
        >
          {items.map((item) => (
            <NavRow
              key={item.id}
              item={item}
              pathname={pathname}
              settingsTab={settingsTab}
              onNavigate={onNavigate}
              unreadCount={item.id === 'messages' ? unreadMessages : 0}
              onSubNavClick={setDestination}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const settingsTab = pathname.startsWith('/settings') ? searchParams.get('tab') : null
  const [headerDates, setHeaderDates] = useState<HeaderDateDisplay | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
  const session = useSession()
  const isAdmin = session.data?.user?.isAdmin === true
  const { count: unreadMessages } = useUnreadMessages()

  useEffect(() => {
    setHeaderDates(formatHeaderDates(new Date()))
  }, [])

  const filterByRole = (items: NavItem[]) => items.filter((item) => !item.adminOnly || isAdmin)

  const mainModules = NAV_MODULES.filter((m) => m.section === 'main').filter(
    (m) => !m.adminOnly || isAdmin,
  )
  const footerItems = filterByRole(getNavItemsBySection('footer'))
  const standaloneMainItems = filterByRole(
    NAV_ITEMS.filter((item) => item.section === 'main' && item.id === 'my-feedback'),
  )

  const handleCollapse = useCallback(() => setCollapsed(true), [])
  const handleExpand = useCallback(() => setCollapsed(false), [])

  const panel = (
    <aside
      className="flex flex-col h-full w-60 bg-slate-50 border-r border-slate-200/80"
      data-testid="sidebar"
      aria-label="Main navigation"
    >
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-1">
          <Link href="/dashboard" className="block hover:opacity-80 transition-opacity" onClick={onClose}>
            <div className="flex items-center gap-2.5 mb-1">
              <SheathLogo size={34} data-testid="sheath-logo" />
              <span className="text-lg font-bold text-slate-900 tracking-tight">Sheath</span>
            </div>
            <p className="text-xs text-slate-400 pl-[2.625rem] whitespace-nowrap">Faith. Learning. Purpose.</p>
          </Link>
          <button
            type="button"
            onClick={handleCollapse}
            data-testid="sidebar-collapse-toggle"
            aria-label="Collapse navigation"
            className="mt-1 p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <SquishedPanelIcon direction="collapse" />
          </button>
        </div>
        <div className="mt-3 text-center" data-testid="sidebar-hijri-date">
          <div className="text-sm font-bold text-forest-900 leading-tight" lang="ar" dir="rtl">
            {headerDates?.hijriDayMonthAr ?? '\u2014'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {headerDates?.hijriYearAndGregorian ?? '\u2014'}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainModules.map((module) => (
          <ModuleNavGroup
            key={module.id}
            module={module}
            pathname={pathname}
            settingsTab={settingsTab}
            onNavigate={onClose}
            inlineSubNav
            unreadMessages={unreadMessages}
          />
        ))}
        {standaloneMainItems.map((item) => (
          <NavRow
            key={item.id}
            item={item}
            pathname={pathname}
            settingsTab={settingsTab}
            onNavigate={onClose}
          />
        ))}
      </nav>

      <nav className="px-3 py-4 border-t border-slate-100 space-y-0.5">
        {footerItems.map((item) => (
          <NavRow key={item.id} item={item} pathname={pathname} settingsTab={settingsTab} onNavigate={onClose} />
        ))}
      </nav>
      {appVersion && (
        <div className="pb-4 text-[11px] text-slate-300 text-center" data-testid="sidebar-version">
          v{appVersion}
        </div>
      )}
    </aside>
  )

  const collapsedRail = (
    <aside
      className="flex flex-col h-full w-12 bg-slate-50 border-r border-slate-200/80 items-center py-4 gap-1"
      aria-label="Navigation (collapsed)"
      data-testid="sidebar-collapsed-rail"
    >
      <button
        type="button"
        onClick={handleExpand}
        data-testid="sidebar-collapse-toggle"
        aria-label="Expand navigation"
        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mb-2"
      >
        <SquishedPanelIcon direction="expand" />
      </button>
      {mainModules.map((module) => (
        <CollapsedModuleFlyout
          key={module.id}
          module={module}
          pathname={pathname}
          settingsTab={settingsTab}
          onNavigate={onClose}
          unreadMessages={unreadMessages}
        />
      ))}
    </aside>
  )

  return (
    <>
      <div className="hidden md:flex md:flex-shrink-0 md:sticky md:top-0 md:h-screen md:z-30">
        {collapsed ? collapsedRail : panel}
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
