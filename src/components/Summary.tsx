import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { project, summarize } from '../lib/projection';
import { formatAUD } from '../lib/format';

export function Summary() {
  const inputs = useStore((s) => s.inputs);
  const displayMode = useStore((s) => s.displayMode);
  const setDisplayMode = useStore((s) => s.setDisplayMode);

  const { rows, summary } = useMemo(() => {
    const rows = project(inputs);
    return { rows, summary: summarize(rows, inputs) };
  }, [inputs]);

  const retirementBalance = displayMode === 'real'
    ? summary.retirementBalanceReal
    : summary.retirementBalanceNominal;

  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-accent2">
          Projection summary
        </h3>
        <div className="flex bg-panel2 rounded-lg p-0.5 text-xs">
          <button
            className={`px-3 py-1 rounded-md ${displayMode === 'real' ? 'bg-accent text-white' : 'text-muted'}`}
            onClick={() => setDisplayMode('real')}
          >
            Today's $
          </button>
          <button
            className={`px-3 py-1 rounded-md ${displayMode === 'nominal' ? 'bg-accent text-white' : 'text-muted'}`}
            onClick={() => setDisplayMode('nominal')}
          >
            Nominal $
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label={`Net worth at age ${inputs.retirementAge}`}
          value={formatAUD(retirementBalance, { compact: true })}
          tone="accent"
        />
        <Stat
          label="Sustainable income (real)"
          value={formatAUD(summary.sustainableAnnualIncomeReal, { compact: true })}
          sub={`${formatAUD(summary.sustainableMonthlyIncomeReal)} / month`}
          tone="good"
        />
        <Stat
          label="FIRE number"
          value={formatAUD(summary.fireNumber, { compact: true })}
          sub={summary.fireAge ? `Reached at age ${summary.fireAge}` : 'Not reached in projection'}
          tone={summary.fireAge ? 'good' : 'warn'}
        />
        <Stat
          label={`Net worth at age ${rows[rows.length - 1]?.age ?? '-'}`}
          value={formatAUD(summary.finalNetWorthReal, { compact: true })}
          sub={summary.fundedToAge ? `Runs out at ${summary.fundedToAge}` : 'Funded for full horizon'}
          tone={summary.fundedToAge ? 'warn' : 'good'}
        />
      </div>
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
      <div className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-dim mt-1">{sub}</div>}
    </div>
  );
}
