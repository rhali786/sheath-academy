// Chart design tokens for the Quran feature — duplicated from
// features/dashboard/front/theme.ts (cross-feature imports are not allowed).

export const FOREST_LINE = '#1a5c3a'
export const FOREST_FILL_FROM = 'rgba(26, 92, 58, 0.25)'
export const FOREST_FILL_TO = 'rgba(26, 92, 58, 0)'

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
