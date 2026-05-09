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
import { project } from '../lib/projection';
import { formatAUD } from '../lib/format';

export function Chart() {
  const inputs = useStore((s) => s.inputs);
  const displayMode = useStore((s) => s.displayMode);
  const rows = useMemo(() => project(inputs), [inputs]);

  const data = rows.map((r) => {
    const factor = displayMode === 'real'
      ? 1 / Math.pow(1 + inputs.inflation, r.age - inputs.currentAge)
      : 1;
    return {
      age: r.age,
      Super: Math.round(r.superBalance * factor),
      Investments: Math.round(r.investBalance * factor),
      Cash: Math.round(r.cashBalance * factor),
      Property: Math.round(r.propertyEquity * factor),
    };
  });

  return (
    <div className="bg-panel border border-border rounded-xl p-4 h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="g-super" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="g-invest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#7c5cff" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="g-cash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="g-prop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#252b48" strokeDasharray="3 3" />
          <XAxis dataKey="age" stroke="#8a93b8" tick={{ fontSize: 12 }} />
          <YAxis
            stroke="#8a93b8"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => formatAUD(v, { compact: true })}
          />
          <Tooltip
            contentStyle={{ background: '#151a2e', border: '1px solid #252b48', borderRadius: 8 }}
            formatter={(value) => formatAUD(Number(value))}
            labelFormatter={(age) => `Age ${age}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            x={inputs.retirementAge}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{ value: 'Retirement', position: 'top', fill: '#f59e0b', fontSize: 11 }}
          />
          <Area type="monotone" dataKey="Cash" stackId="1" stroke="#22c55e" fill="url(#g-cash)" />
          <Area type="monotone" dataKey="Property" stackId="1" stroke="#f59e0b" fill="url(#g-prop)" />
          <Area type="monotone" dataKey="Investments" stackId="1" stroke="#7c5cff" fill="url(#g-invest)" />
          <Area type="monotone" dataKey="Super" stackId="1" stroke="#22d3ee" fill="url(#g-super)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
