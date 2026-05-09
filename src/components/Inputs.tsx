import { useStore } from '../store/useStore';
import { Slider } from './Slider';
import { formatAUD, formatPercent } from '../lib/format';
import { AU } from '../countries/australia';
import { PropertyEditor } from './PropertyEditor';

export function Inputs() {
  const inputs = useStore((s) => s.inputs);
  const setInput = useStore((s) => s.setInput);

  return (
    <div className="space-y-6">
      <Section title="You">
        <Slider
          label="Current age"
          value={inputs.currentAge}
          min={18}
          max={70}
          onChange={(v) => setInput('currentAge', v)}
        />
        <Slider
          label="Retirement age"
          value={inputs.retirementAge}
          min={Math.max(inputs.currentAge + 1, 50)}
          max={75}
          onChange={(v) => setInput('retirementAge', v)}
        />
        <Slider
          label="Project until age"
          value={inputs.endAge}
          min={inputs.retirementAge + 1}
          max={100}
          onChange={(v) => setInput('endAge', v)}
        />
      </Section>

      <Section title="Income">
        <Slider
          label="Annual income (gross)"
          value={inputs.annualIncome}
          min={30000}
          max={500000}
          step={1000}
          format={(v) => formatAUD(v)}
          hint="Tax & Medicare levy applied automatically"
          onChange={(v) => setInput('annualIncome', v)}
        />
        <Slider
          label="Annual salary growth"
          value={inputs.salaryGrowth}
          min={0}
          max={0.10}
          step={0.005}
          format={(v) => formatPercent(v)}
          onChange={(v) => setInput('salaryGrowth', v)}
        />
      </Section>

      <Section title="Investments">
        <Slider
          label="Monthly investment contribution"
          value={inputs.monthlyInvestment}
          min={0}
          max={10000}
          step={50}
          format={(v) => formatAUD(v)}
          hint="Outside super — into ETFs / shares"
          onChange={(v) => setInput('monthlyInvestment', v)}
        />
        <Slider
          label="Current investment balance"
          value={inputs.currentInvestments}
          min={0}
          max={2000000}
          step={1000}
          format={(v) => formatAUD(v, { compact: true })}
          onChange={(v) => setInput('currentInvestments', v)}
        />
        <Slider
          label="Expected return (nominal)"
          value={inputs.expectedReturn}
          min={0.03}
          max={0.12}
          step={0.005}
          format={(v) => formatPercent(v)}
          hint="S&P 500 long-run average is ~10% nominal"
          onChange={(v) => setInput('expectedReturn', v)}
        />
      </Section>

      <Section title="Superannuation">
        <Slider
          label="Current super balance"
          value={inputs.currentSuper}
          min={0}
          max={2000000}
          step={1000}
          format={(v) => formatAUD(v, { compact: true })}
          onChange={(v) => setInput('currentSuper', v)}
        />
        <Slider
          label="Super contribution rate"
          value={inputs.superRate}
          min={0.115}
          max={0.25}
          step={0.005}
          format={(v) => formatPercent(v)}
          hint={`SG minimum ${formatPercent(AU.superGuaranteeRate)} — increase via salary sacrifice`}
          onChange={(v) => setInput('superRate', v)}
        />
      </Section>

      <PropertyEditor />

      <Section title="Cash & Assumptions">
        <Slider
          label="Cash savings"
          value={inputs.currentCash}
          min={0}
          max={500000}
          step={1000}
          format={(v) => formatAUD(v, { compact: true })}
          onChange={(v) => setInput('currentCash', v)}
        />
        <Slider
          label="Inflation"
          value={inputs.inflation}
          min={0}
          max={0.06}
          step={0.0025}
          format={(v) => formatPercent(v)}
          onChange={(v) => setInput('inflation', v)}
        />
        <Slider
          label="Retirement withdrawal rate"
          value={inputs.withdrawalRate}
          min={0.025}
          max={0.06}
          step={0.0025}
          format={(v) => formatPercent(v)}
          hint="The '4% rule' suggests 4% is sustainable for 30 years"
          onChange={(v) => setInput('withdrawalRate', v)}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-accent2 mb-3">{title}</h3>
      {children}
    </div>
  );
}
