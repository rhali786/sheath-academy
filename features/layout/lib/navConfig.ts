export type NavSection = 'main' | 'footer'

export type NavItem = {
  id: string
  label: string
  href?: string
  section: NavSection
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
  { id: 'dashboard', label: 'Dashboard', href: '/', section: 'main', activePrefixes: ['/'] },
  {
    id: 'calendar',
    label: 'Calendar',
    href: '/plan/schedule',
    section: 'main',
    activePrefixes: ['/plan/schedule', '/calendar'],
  },
  {
    id: 'lesson-planner',
    label: 'Lesson Planner',
    href: '/plan',
    section: 'main',
    activePrefixes: ['/plan'],
  },
  { id: 'courses', label: 'Courses', href: '/lessons', section: 'main', activePrefixes: ['/lessons'] },
  { id: 'attendance', label: 'Attendance', href: '/attendance', section: 'main' },
  {
    id: 'grades-progress',
    label: 'Grades & Progress',
    href: '/growth',
    section: 'main',
    activePrefixes: ['/growth', '/portfolio'],
  },
  {
    id: 'reports-records',
    label: 'Reports & Records',
    href: '/records',
    section: 'main',
    activePrefixes: ['/records', '/reports'],
  },
  {
    id: 'people',
    label: 'People',
    href: '/settings?tab=children',
    section: 'main',
    activePrefixes: ['/settings'],
  },
  { id: 'resources', label: 'Resources', href: '/resources', section: 'main' },
  { id: 'quran', label: 'Quran', href: '/quran', section: 'main' },
  {
    id: 'messages',
    label: 'Messages',
    section: 'main',
    disabled: true,
    showDisabledBadge: true,
  },
  { id: 'finances', label: 'Finances', section: 'main', disabled: true },
  {
    id: 'compliance',
    label: 'Compliance',
    href: '/settings?tab=records-compliance',
    section: 'main',
    activePrefixes: ['/settings'],
  },
  { id: 'settings', label: 'Settings', href: '/settings', section: 'footer' },
  { id: 'admin', label: 'Admin', href: '/admin/metrics', section: 'footer', activePrefixes: ['/admin'] },
  { id: 'about', label: 'About', href: '/about', section: 'footer' },
]

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
    return pathname === '/'
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
