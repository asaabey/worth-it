import { useStore } from '../store/useStore';

export interface ChartTheme {
  isDark: boolean;
  gridStroke: string;
  axisColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  legendText: string;
  // Series colours — line/stroke + label fills
  superColor: string;
  investColor: string;
  cashColor: string;
  propertyColor: string;
  drawdownColor: string;
  rentalColor: string;
  warnLabel: string;
  accent2Label: string;
}

export function useChartTheme(): ChartTheme {
  const theme = useStore((s) => s.theme);
  const isDark = theme === 'dark';
  return {
    isDark,
    gridStroke: isDark ? '#252b48' : '#e5e7eb',
    axisColor: isDark ? '#8a93b8' : '#6b7280',
    tooltipBg: isDark ? '#151a2e' : '#ffffff',
    tooltipBorder: isDark ? '#252b48' : '#d9deeb',
    tooltipText: isDark ? '#e6e9f2' : '#0b1020',
    legendText: isDark ? '#e6e9f2' : '#0b1020',
    superColor: isDark ? '#22d3ee' : '#0891b2',
    investColor: isDark ? '#7c5cff' : '#6d4dff',
    cashColor: isDark ? '#22c55e' : '#15803d',
    propertyColor: isDark ? '#f59e0b' : '#b45309',
    drawdownColor: isDark ? '#7c5cff' : '#6d4dff',
    rentalColor: isDark ? '#f59e0b' : '#b45309',
    warnLabel: isDark ? '#f59e0b' : '#b45309',
    accent2Label: isDark ? '#22d3ee' : '#0e7490',
  };
}
