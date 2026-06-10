const PRINTING_CLASS = 'dashboard-printing'

/** Restricts browser print to `.dashboard-print-report` content on the dashboard. */
export function printDashboardReport(onAfterPrint?: () => void): void {
  document.body.classList.add(PRINTING_CLASS)

  const cleanup = () => {
    document.body.classList.remove(PRINTING_CLASS)
    window.removeEventListener('afterprint', cleanup)
    onAfterPrint?.()
  }

  window.addEventListener('afterprint', cleanup)
  window.print()
}
