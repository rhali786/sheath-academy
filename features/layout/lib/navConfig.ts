export type NavSection = 'main' | 'footer'
export type NavModule = 'Home' | 'Planbook' | 'Records' | 'Compliance' | 'People' | 'Settings'
export type NavModuleGroup = { label: NavModule; items: NavItem[] }

export type NavItem = {
  id: string
  label: string
  href?: string
  section: NavSection
  /** Module group this item belongs to (main nav items only). */
  module?: NavModule
  /** When true, item is visible but not clickable (Messages, Finances). */
  disabled?: boolean
  /** Grayed badge next to label (Messages). */
  showDisabledBadge?: boolean
  /** Prefix paths that mark this item active (defaults to [href]). */
  activePrefixes?: string[]
  /** Only show when user is app admin (client checks session email via hook). */
  adminOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Home', href: '/dashboard', section: 'main', module: 'Home', activePrefixes: ['/dashboard'] },
  {
    id: 'calendar',
    label: 'Calendar',
    href: '/plan/schedule',
    section: 'main',
    module: 'Planbook',
    activePrefixes: ['/plan/schedule', '/calendar'],
  },
  {
    id: 'lesson-planner',
    label: 'Lesson Planner',
    href: '/plan',
    section: 'main',
    module: 'Planbook',
    activePrefixes: ['/plan'],
  },
  { id: 'courses', label: 'Courses', href: '/lessons', section: 'main', module: 'Planbook', activePrefixes: ['/lessons'] },
  { id: 'attendance', label: 'Attendance', href: '/attendance', section: 'main', module: 'Records' },
  {
    id: 'grades-progress',
    label: 'Growth & Reflection',
    href: '/growth',
    section: 'main',
    module: 'Records',
    activePrefixes: ['/growth', '/portfolio'],
  },
  {
    id: 'reports-records',
    label: 'Reports & Records',
    href: '/records',
    section: 'main',
    module: 'Records',
    activePrefixes: ['/records', '/reports'],
  },
  {
    id: 'people',
    label: 'People',
    href: '/settings?tab=children',
    section: 'main',
    module: 'People',
    activePrefixes: ['/settings'],
  },
  { id: 'resources', label: 'Resources', href: '/resources', section: 'main', module: 'Planbook' },
  { id: 'quran', label: 'Quran', href: '/quran', section: 'main', module: 'Planbook' },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    section: 'main',
    module: 'Planbook',
    activePrefixes: ['/messages'],
  },
  { id: 'finances', label: 'Finances', section: 'main', module: 'People', disabled: true },
  {
    id: 'compliance',
    label: 'Compliance',
    href: '/settings?tab=records-compliance',
    section: 'main',
    module: 'Compliance',
    activePrefixes: ['/settings'],
  },
  { id: 'my-feedback', label: 'My feedback', href: '/feedback', section: 'main', module: 'Settings', activePrefixes: ['/feedback'] },
  { id: 'settings', label: 'Settings', href: '/settings', section: 'footer' },
  { id: 'admin', label: 'Admin', href: '/admin/metrics', section: 'footer', adminOnly: true, activePrefixes: ['/admin'] },
  { id: 'feedback-queue', label: 'Feedback queue', href: '/admin/feedback', section: 'footer', adminOnly: true, activePrefixes: ['/admin/feedback'] },
  { id: 'about', label: 'About', href: '/about', section: 'footer' },
]

/** Module config IDs for the module-grouped sidebar (re-homed IA). */
export type NavModuleId = 'home' | 'planbook' | 'records' | 'progress' | 'people' | 'messages' | 'settings'

export type NavModuleConfig = {
  id: NavModuleId
  label: string
  defaultHref: string
  /** NAV_ITEMS ids belonging to this module's sub-nav, in display order. */
  itemIds: string[]
  section: NavSection
  adminOnly?: boolean
}

export const NAV_MODULES: NavModuleConfig[] = [
  { id: 'home', label: 'Home', defaultHref: '/dashboard', itemIds: [], section: 'main' },
  {
    id: 'planbook',
    label: 'Planbook',
    defaultHref: '/plan/schedule',
    itemIds: ['calendar', 'lesson-planner', 'courses', 'quran', 'resources'],
    section: 'main',
  },
  {
    id: 'records',
    label: 'Records & Compliance',
    defaultHref: '/attendance',
    itemIds: ['attendance', 'reports-records', 'compliance'],
    section: 'main',
  },
  {
    id: 'progress',
    label: 'Growth & Reflection',
    defaultHref: '/growth',
    itemIds: ['grades-progress'],
    section: 'main',
  },
  { id: 'people', label: 'People', defaultHref: '/people', itemIds: [], section: 'main' },
  { id: 'messages', label: 'Messages', defaultHref: '/messages', itemIds: [], section: 'main' },
  {
    id: 'settings',
    label: 'Settings',
    defaultHref: '/settings',
    itemIds: ['finances'],
    section: 'footer',
  },
]

export function getModuleItems(module: NavModuleConfig): NavItem[] {
  return module.itemIds
    .map((id) => NAV_ITEMS.find((item) => item.id === id))
    .filter((item): item is NavItem => item !== undefined)
}

export function isNavModuleActive(
  pathname: string,
  module: NavModuleConfig,
  settingsTab: string | null = null,
): boolean {
  if (getModuleItems(module).some((item) => isNavItemActive(pathname, item, settingsTab))) {
    return true
  }

  const defaultPath = module.defaultHref.split('?')[0]
  return pathname === defaultPath || pathname.startsWith(`${defaultPath}/`)
}

const MODULE_ORDER: NavModule[] = ['Home', 'Planbook', 'Records', 'Compliance', 'People', 'Settings']

export function getNavModules(): NavModuleGroup[] {
  const map = new Map<NavModule, NavItem[]>(MODULE_ORDER.map(m => [m, []]))
  for (const item of NAV_ITEMS) {
    if (item.section === 'main' && item.module) {
      map.get(item.module)?.push(item)
    }
  }
  return MODULE_ORDER.map(label => ({ label, items: map.get(label) ?? [] }))
}

export function getNavItemsBySection(section: NavSection): NavItem[] {
  return NAV_ITEMS.filter((item) => item.section === section)
}

export function isNavItemActive(
  pathname: string,
  item: NavItem,
  settingsTab: string | null = null,
): boolean {
  if (!item.href || item.disabled) return false

  const prefixes = item.activePrefixes ?? [item.href.split('?')[0]]

  if (item.id === 'dashboard') {
    return pathname === '/dashboard'
  }

  if (item.id === 'lesson-planner') {
    return pathname.startsWith('/plan') && !pathname.startsWith('/plan/schedule')
  }

  if (item.id === 'calendar') {
    return pathname.startsWith('/plan/schedule') || pathname.startsWith('/calendar')
  }

  if (pathname.startsWith('/settings')) {
    const tab = settingsTab ?? 'household'
    if (item.id === 'people') return tab === 'children'
    if (item.id === 'compliance') return tab === 'records-compliance'
    if (item.id === 'settings') {
      return tab !== 'children' && tab !== 'records-compliance'
    }
    return false
  }

  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function validateNavConfig(items: NavItem[] = NAV_ITEMS): void {
  for (const item of items) {
    if (item.disabled) continue
    if (!item.href?.trim()) {
      throw new Error(`Nav item "${item.id}" must have href or be disabled`)
    }
  }
}

validateNavConfig()
