/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { NextSetupStrip } from '@/features/setup/front/components/NextSetupStrip'

describe('NextSetupStrip', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('does not render when nextStep is null', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { nextStep: null, completed: [] },
        message: '',
        timestamp: '',
      }),
    })
    render(<NextSetupStrip />)
    await waitFor(() => {
      expect(screen.queryByTestId('next-setup-strip')).not.toBeInTheDocument()
    })
  })

  it('renders strip with firstSubject prompt when nextStep is firstSubject', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          nextStep: 'firstSubject',
          completed: ['household', 'firstChild'],
        },
        message: '',
        timestamp: '',
      }),
    })
    render(<NextSetupStrip />)
    await waitFor(() => {
      expect(screen.getByTestId('next-setup-strip')).toBeInTheDocument()
    })
    expect(screen.getByText(/Add a subject/i)).toBeInTheDocument()
  })

  it('renders stub step as disabled when nextStep is firstLesson', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          nextStep: 'firstLesson',
          completed: ['household', 'firstChild', 'firstSubject'],
        },
        message: '',
        timestamp: '',
      }),
    })
    render(<NextSetupStrip />)
    await waitFor(() => {
      expect(screen.getAllByText(/Coming soon/i).length).toBeGreaterThan(0)
    })
  })
})
