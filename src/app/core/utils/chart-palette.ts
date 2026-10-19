/**
 * Chart colours aligned with the QuantumCart admin design tokens. Kept in one
 * place so every dependency-free SVG chart stays visually consistent.
 */
export const CHART_COLORS = {
  primary: '#2563eb',
  cyan: '#0891b2',
  violet: '#7c3aed',
  indigo: '#4f46e5',
  success: '#15803d',
  warning: '#b45309',
  error: '#dc2626',
  neutral: '#94a3b8',
  grid: '#e3e8f1',
  axisText: '#64748b',
} as const;

export type ChartColor = (typeof CHART_COLORS)[keyof typeof CHART_COLORS];
