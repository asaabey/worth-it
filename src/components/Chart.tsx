import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useStore } from '../store/useStore';
import { project, summarize } from '../lib/projection';
import { formatAUD } from '../lib/format';
import { useChartTheme } from '../lib/chartTheme';

export function Chart() {
  const inputs = useStore((s) => s.inputs);
  const displayMode = useStore((s) => s.displayMode);
  const t = useChartTheme();
  const { rows, summary } = useMemo(() => {
    const rows = project(inputs);
    return { rows, summary: summarize(rows, inputs) };
  }, [inputs]);

  const data = rows.map((r) => {
    const factor = displayMode === 'real'
      ? 1 / Math.pow(1 + inputs.inflation, r.age - inputs.primary.currentAge)
      : 1;
    return {
      age: r.age,
      Super: Math.round(r.superBalance * factor),
      Investments: Math.round(r.investBalance * factor),
      Cash: Math.round(r.cashBalance * factor),
      Property: Math.round(r.propertyEquity * factor),
    };
  });

  const fadeOpacity = t.isDark ? 0.05 : 0.15;

  return (
    <div className="bg-panel border border-border rounded-xl p-4 h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="g-super" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={t.superColor} stopOpacity={0.7} />
              <stop offset="95%" stopColor={t.superColor} stopOpacity={fadeOpacity} />
            </linearGradient>
            <linearGradient id="g-invest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={t.investColor} stopOpacity={0.7} />
              <stop offset="95%" stopColor={t.investColor} stopOpacity={fadeOpacity} />
            </linearGradient>
            <linearGradient id="g-cash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={t.cashColor} stopOpacity={0.7} />
              <stop offset="95%" stopColor={t.cashColor} stopOpacity={fadeOpacity} />
            </linearGradient>
            <linearGradient id="g-prop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={t.propertyColor} stopOpacity={0.7} />
              <stop offset="95%" stopColor={t.propertyColor} stopOpacity={fadeOpacity} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={t.gridStroke} strokeDasharray="3 3" />
          <XAxis dataKey="age" stroke={t.axisColor} tick={{ fontSize: 12, fill: t.axisColor }} />
          <YAxis
            stroke={t.axisColor}
            tick={{ fontSize: 12, fill: t.axisColor }}
            tickFormatter={(v) => formatAUD(v, { compact: true })}
          />
          <Tooltip
            contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, color: t.tooltipText }}
            labelStyle={{ color: t.tooltipText }}
            itemStyle={{ color: t.tooltipText }}
            formatter={(value) => formatAUD(Number(value))}
            labelFormatter={(age) => `Age ${age}`}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: t.legendText }} />
          <ReferenceLine
            x={summary.householdRetirementAge}
            stroke={t.warnLabel}
            strokeDasharray="3 3"
            label={{
              value: inputs.partner ? 'Both retired' : 'Retirement',
              position: 'top',
              fill: t.warnLabel,
              fontSize: 11,
            }}
          />
          <Area type="monotone" dataKey="Cash" stackId="1" stroke={t.cashColor} fill="url(#g-cash)" />
          <Area type="monotone" dataKey="Property" stackId="1" stroke={t.propertyColor} fill="url(#g-prop)" />
          <Area type="monotone" dataKey="Investments" stackId="1" stroke={t.investColor} fill="url(#g-invest)" />
          <Area type="monotone" dataKey="Super" stackId="1" stroke={t.superColor} fill="url(#g-super)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
