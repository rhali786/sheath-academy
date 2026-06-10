import React from 'react'
import { render, screen } from '@testing-library/react'
import { CompliancePage } from '@/features/settings/front/pages/CompliancePage'

describe('CompliancePage', () => {
  test('renders RecordsComplianceTab panel', () => {
    render(<CompliancePage />)
    expect(screen.getByTestId('settings-panel-records-compliance')).toBeInTheDocument()
    expect(screen.getByText('Records & Compliance')).toBeInTheDocument()
  })
})
