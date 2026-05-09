import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import { AU } from '../countries/australia';
import { useChartTheme } from '../lib/chartTheme';

export function RetirementCashFlow() {
  const inputs = useStore((s) => s.inputs);
  const displayMode = useStore((s) => s.displayMode);
  const t = useChartTheme();
  const { rows, summary } = useMemo(() => {
    const rows = project(inputs);
    return { rows, summary: summarize(rows, inputs) };
  }, [inputs]);

  const retirementRows = rows.filter((r) => r.householdRetired);

  const data = retirementRows.map((r) => {
    const factor = displayMode === 'real'
      ? 1 / Math.pow(1 + inputs.inflation, r.age - inputs.primary.currentAge)
      : 1;
    const drawdown = (r.drawdownInvest + r.drawdownSuper) * factor;
    const netRentalAfterTax = (r.netRental - r.tax) * factor;
    return {
      age: r.age,
      Drawdown: Math.round(drawdown / 12),
      'Net rental': Math.round(netRentalAfterTax / 12),
      total: Math.round((drawdown + netRentalAfterTax) / 12),
    };
  });

  const monthlyValues = data.map((d) => d.total);
  const avg = monthlyValues.length
    ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
    : 0;
  const min = monthlyValues.length ? Math.min(...monthlyValues) : 0;
  const max = monthlyValues.length ? Math.max(...monthlyValues) : 0;
  const minAge = data.find((d) => d.total === min)?.age;
  const maxAge = data.find((d) => d.total === max)?.age;

  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-accent2">
          Retirement cash flow
        </h3>
        <span className="text-xs text-muted">
          Ages {summary.householdRetirementAge}–{inputs.endAge} · {displayMode === 'real' ? "Today's $" : 'Nominal $'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Average / month" value={formatAUD(avg)} tone="accent" />
        <Stat
          label="Lowest month"
          value={formatAUD(min)}
          sub={minAge != null ? `at age ${minAge}` : undefined}
          tone="warn"
        />
        <Stat
          label="Highest month"
          value={formatAUD(max)}
          sub={maxAge != null ? `at age ${maxAge}` : undefined}
          tone="good"
        />
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              cursor={{ fill: t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
              formatter={(value) => formatAUD(Number(value))}
              labelFormatter={(age) => `Age ${age} · monthly`}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: t.legendText }} />
            {summary.householdRetirementAge < AU.preservationAge && (
              <ReferenceLine
                x={AU.preservationAge}
                stroke={t.accent2Label}
                strokeDasharray="3 3"
                label={{ value: 'Super unlocks', position: 'top', fill: t.accent2Label, fontSize: 11 }}
              />
            )}
            <Bar dataKey="Drawdown" stackId="cf" fill={t.drawdownColor} />
            <Bar dataKey="Net rental" stackId="cf" fill={t.rentalColor} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-dim mt-3">
        Drawdown = withdrawals from investments + super (super only after age {AU.preservationAge}).
        Net rental shown after tax. Drawdowns assumed tax-free (CGT not modelled).
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = 'accent',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'accent' | 'good' | 'warn';
}) {
  const toneClass = tone === 'good' ? 'text-good' : tone === 'warn' ? 'text-warn' : 'text-accent';
  return (
    <div className="bg-panel2 rounded-lg p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className={`text-xl font-bold mt-1 ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-dim mt-1">{sub}</div>}
    </div>
  );
}
