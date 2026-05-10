// Design tokens for Sheath Academy dashboard.
// Import nivoTheme into chart components; import childColors for per-child data series.

export const palette = {
  forest: {
    950: '#0a2d1a',
    900: '#1a5c3a',
    800: '#1e6b45',
    700: '#237a4e',
    100: '#dcf0e5',
    50:  '#f0f9f4',
  },
  sky: {
    700: '#0369a1',
    600: '#0284c7',
    500: '#0ea5e9',
    100: '#e0f2fe',
    50:  '#f0f9ff',
  },
  slate: {
    900: '#0f172a',
    700: '#334155',
    500: '#64748b',
    400: '#94a3b8',
    200: '#e2e8f0',
    100: '#f1f5f9',
    50:  '#f8fafc',
  },
  amber: {
    700: '#b45309',
    500: '#f59e0b',
    100: '#fef3c7',
  },
}

// One color per child — forest green, sky blue, warm amber
export const childColors = ['#1a5c3a', '#0284c7', '#b45309']

export const nivoTheme = {
  background: 'transparent',
  textColor: '#64748b',
  fontSize: 12,
  axis: {
    domain: { line: { stroke: '#e2e8f0', strokeWidth: 1 } },
    legend: { text: { fontSize: 11, fill: '#94a3b8', fontWeight: 500 } },
    ticks: {
      line: { stroke: '#e2e8f0', strokeWidth: 1 },
      text: { fontSize: 11, fill: '#64748b' },
    },
  },
  grid: {
    line: { stroke: '#f1f5f9', strokeWidth: 1 },
  },
  legends: {
    text: { fill: '#64748b', fontSize: 12 },
  },
  tooltip: {
    container: {
      background: '#ffffff',
      color: '#0f172a',
      fontSize: 12,
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)',
      padding: '8px 12px',
    },
  },
}
