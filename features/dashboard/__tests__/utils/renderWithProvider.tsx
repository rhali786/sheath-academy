import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { DashboardProvider } from '@/features/dashboard/front/context'
import { LearnerProvider } from '@/features/layout/front/context/LearnerContext'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <LearnerProvider>
      <DashboardProvider>{children}</DashboardProvider>
    </LearnerProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
