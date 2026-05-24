import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecordsProof } from '@/features/dashboard/front/components/RecordsProof'

const mockRecords = [
  { id: 'record_attendance', title: 'Attendance', count: 10, icon: 'CheckCircle', viewButton: 'View records' },
]

describe('RecordsProof — BUG-008 export modal', () => {
  beforeEach(() => {
    window.print = jest.fn()
  })

  it('clicking Attendance Report does not show "being prepared" text', () => {
    render(<RecordsProof records={mockRecords} />)

    fireEvent.click(screen.getByRole('button', { name: /attendance report/i }))

    expect(screen.queryByText(/being prepared/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/check your downloads/i)).not.toBeInTheDocument()
  })

  it('clicking Attendance Report shows a Print button in the modal', () => {
    render(<RecordsProof records={mockRecords} />)

    fireEvent.click(screen.getByRole('button', { name: /attendance report/i }))

    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
  })

  it('clicking the Print button calls window.print()', () => {
    render(<RecordsProof records={mockRecords} />)

    fireEvent.click(screen.getByRole('button', { name: /attendance report/i }))
    fireEvent.click(screen.getByRole('button', { name: /print/i }))

    expect(window.print).toHaveBeenCalledTimes(1)
  })

  it('modal has a Close button that dismisses the modal', () => {
    render(<RecordsProof records={mockRecords} />)

    fireEvent.click(screen.getByRole('button', { name: /attendance report/i }))
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('button', { name: /print/i })).not.toBeInTheDocument()
  })
})
