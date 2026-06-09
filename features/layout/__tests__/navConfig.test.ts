import {
  NAV_ITEMS,
  NAV_MODULES,
  getNavItemsBySection,
  getNavModules,
  getModuleItems,
  isNavItemActive,
  isNavModuleActive,
  validateNavConfig,
} from '@/features/layout/lib/navConfig'

describe('navConfig', () => {
  test('every item has href or is disabled', () => {
    expect(() => validateNavConfig()).not.toThrow()
    for (const item of NAV_ITEMS) {
      if (item.disabled) {
        expect(item.href).toBeUndefined()
      } else {
        expect(item.href).toBeTruthy()
      }
    }
  })

  test('main and footer sections include expected labels', () => {
    const mainLabels = getNavItemsBySection('main').map((i) => i.label)
    expect(mainLabels).toContain('Home')
    expect(mainLabels).toContain('Lesson Planner')
    expect(mainLabels).toContain('Messages')

    const footerLabels = getNavItemsBySection('footer').map((i) => i.label)
    expect(footerLabels).toContain('Settings')
    expect(footerLabels).toContain('Admin')
    expect(footerLabels).toContain('About')
    expect(footerLabels).toContain('Feedback queue')
  })

  test('disabled items include Finances only (messages is now enabled)', () => {
    const disabled = NAV_ITEMS.filter((i) => i.disabled)
    expect(disabled.map((i) => i.id)).toEqual(['finances'])
  })

  test('Messages does not show a disabled badge flag', () => {
    const messages = NAV_ITEMS.find((i) => i.id === 'messages')
    expect(messages?.showDisabledBadge).toBeUndefined()
  })

  test('dashboard nav item has label "Home", href "/dashboard", and is active on /dashboard', () => {
    const dashboard = NAV_ITEMS.find((i) => i.id === 'dashboard')!
    expect(dashboard.label).toBe('Home')
    expect(dashboard.href).toBe('/dashboard')
    expect(isNavItemActive('/dashboard', dashboard)).toBe(true)
    expect(isNavItemActive('/plan', dashboard)).toBe(false)
  })

  test('Messages nav item is enabled with href /messages and activePrefixes', () => {
    const messages = NAV_ITEMS.find((i) => i.id === 'messages')!
    expect(messages.disabled).toBeUndefined()
    expect(messages.href).toBe('/messages')
    expect(messages.activePrefixes).toContain('/messages')
  })

  test('lesson planner is active on /plan but not /plan/schedule', () => {
    const planner = NAV_ITEMS.find((i) => i.id === 'lesson-planner')!
    expect(isNavItemActive('/plan', planner)).toBe(true)
    expect(isNavItemActive('/plan/schedule', planner)).toBe(false)
  })

  test('calendar is active on /plan/schedule', () => {
    const calendar = NAV_ITEMS.find((i) => i.id === 'calendar')!
    expect(isNavItemActive('/plan/schedule', calendar)).toBe(true)
  })

  test('grades and progress is active on /growth and /portfolio', () => {
    const grades = NAV_ITEMS.find((i) => i.id === 'grades-progress')!
    expect(isNavItemActive('/growth', grades)).toBe(true)
    expect(isNavItemActive('/portfolio', grades)).toBe(true)
  })

  test('people is active on /settings with tab=children', () => {
    const people = NAV_ITEMS.find((i) => i.id === 'people')!
    expect(isNavItemActive('/settings', people, 'children')).toBe(true)
    expect(isNavItemActive('/settings', people, 'household')).toBe(false)
  })

  test('compliance is active on /settings with tab=records-compliance', () => {
    const compliance = NAV_ITEMS.find((i) => i.id === 'compliance')!
    expect(isNavItemActive('/settings', compliance, 'records-compliance')).toBe(true)
    expect(isNavItemActive('/settings', compliance, 'children')).toBe(false)
  })

  test('footer settings is active on default household tab only', () => {
    const settings = NAV_ITEMS.find((i) => i.id === 'settings')!
    expect(isNavItemActive('/settings', settings, 'household')).toBe(true)
    expect(isNavItemActive('/settings', settings, 'children')).toBe(false)
    expect(isNavItemActive('/settings', settings, 'records-compliance')).toBe(false)
  })
})

describe('Module grouping', () => {
  test('every main NavItem declares a module field', () => {
    const mainItems = getNavItemsBySection('main')
    for (const item of mainItems) {
      expect(item.module).toBeTruthy()
    }
  })

  test('getNavModules returns 6 modules with expected labels', () => {
    const modules = getNavModules()
    const labels = modules.map(m => m.label)
    expect(labels).toEqual(['Home', 'Planbook', 'Records', 'Compliance', 'People', 'Settings'])
  })

  test('getNavModules groups items correctly — Planbook includes Calendar, Lesson Planner, Courses', () => {
    const modules = getNavModules()
    const planbook = modules.find(m => m.label === 'Planbook')!
    const planbookIds = planbook.items.map(i => i.id)
    expect(planbookIds).toContain('calendar')
    expect(planbookIds).toContain('lesson-planner')
    expect(planbookIds).toContain('courses')
  })
})

describe('NAV_MODULES (module config)', () => {
  test('isNavModuleActive: planbook module active on /plan/schedule, not on /attendance', () => {
    const planbook = NAV_MODULES.find(m => m.id === 'planbook')!
    expect(isNavModuleActive('/plan/schedule', planbook)).toBe(true)
    expect(isNavModuleActive('/attendance', planbook)).toBe(false)
  })

  test('getModuleItems(records) returns attendance, reports-records, compliance in order', () => {
    const records = NAV_MODULES.find(m => m.id === 'records')!
    const ids = getModuleItems(records).map(i => i.id)
    expect(ids).toEqual(['attendance', 'reports-records', 'compliance'])
  })

  test('quran and resources are members of the planbook module', () => {
    const planbook = NAV_MODULES.find(m => m.id === 'planbook')!
    expect(planbook.itemIds).toContain('quran')
    expect(planbook.itemIds).toContain('resources')
  })

  test('finances is a member of the settings module and remains disabled with no href', () => {
    const settings = NAV_MODULES.find(m => m.id === 'settings')!
    expect(settings.itemIds).toContain('finances')
    const finances = NAV_ITEMS.find(i => i.id === 'finances')!
    expect(finances.disabled).toBe(true)
    expect(finances.href).toBeUndefined()
  })

  test('leaf hrefs unchanged for known nav items', () => {
    const expectedHrefs: Record<string, string> = {
      dashboard: '/dashboard',
      'lesson-planner': '/plan',
      calendar: '/plan/schedule',
      courses: '/lessons',
      quran: '/quran',
      resources: '/resources',
      attendance: '/attendance',
      'reports-records': '/records',
      'grades-progress': '/growth',
      messages: '/messages',
    }
    for (const [id, href] of Object.entries(expectedHrefs)) {
      expect(NAV_ITEMS.find(i => i.id === id)?.href).toBe(href)
    }
  })
})

describe('Grade-discoverability nav label', () => {
  test('grades-progress item label does not contain the word Grades', () => {
    const item = NAV_ITEMS.find(i => i.id === 'grades-progress')!
    expect(item.label).not.toMatch(/grades/i)
  })

  test('grades-progress href and activePrefixes are unchanged', () => {
    const item = NAV_ITEMS.find(i => i.id === 'grades-progress')!
    expect(item.href).toBe('/growth')
    expect(item.activePrefixes).toEqual(['/growth', '/portfolio'])
  })
})
