import { render, screen } from '@testing-library/react'
import fs from 'fs'
import path from 'path'
import {
  SheathLogo,
  SHEATH_LOGO_SHIELD_PATH,
  SHEATH_LOGO_LEAF_PATH,
} from '@/features/layout/front/components/SheathLogo'

describe('SheathLogo', () => {
  test('renders shield and leaf paths', () => {
    render(<SheathLogo data-testid="sheath-logo" />)
    const svg = screen.getByTestId('sheath-logo')
    expect(svg.tagName.toLowerCase()).toBe('svg')
    expect(svg.querySelectorAll('path')).toHaveLength(3)
  })

  test('favicon.svg stays in sync with exported shield path', () => {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.svg')
    const favicon = fs.readFileSync(faviconPath, 'utf-8')
    expect(favicon).toContain(SHEATH_LOGO_SHIELD_PATH)
    expect(favicon).toContain(SHEATH_LOGO_LEAF_PATH)
    expect(favicon).toContain('SheathLogo.tsx')
  })
})
