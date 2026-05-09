import { useStore } from '../store/useStore';
import { Inputs } from './Inputs';
import { Chart } from './Chart';
import { Summary } from './Summary';
import { RetirementCashFlow } from './RetirementCashFlow';
import { ThemeToggle } from './ThemeToggle';

export function Dashboard() {
  const setCountry = useStore((s) => s.setCountry);
  const reset = useStore((s) => s.reset);

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <header className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🇦🇺</span>
          <div>
            <h1 className="text-xl font-bold text-text">Worth It</h1>
            <p className="text-xs text-muted">Australia — 2024-25 tax year</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 rounded-lg bg-panel border border-border hover:bg-panel2"
          >
            Reset
          </button>
          <button
            onClick={() => setCountry(null)}
            className="text-xs px-3 py-1.5 rounded-lg bg-panel border border-border hover:bg-panel2"
          >
            Change country
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[400px_1fr] gap-6">
        <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
          <Inputs />
        </div>
        <div className="space-y-6">
          <Summary />
          <Chart />
          <RetirementCashFlow />
        </div>
      </div>

      <footer className="text-xs text-dim text-center mt-8 max-w-2xl mx-auto">
        Estimates only. Uses 2024-25 AU resident tax brackets, 2% Medicare levy and 15% super contributions tax.
        Returns and inflation are assumptions, not guarantees. Not financial advice.
      </footer>
    </div>
  );
}
