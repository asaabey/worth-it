import { useStore } from '../store/useStore';
import { Slider } from './Slider';
import { formatAUD, formatPercent } from '../lib/format';
import { AU } from '../countries/australia';
import { PropertyEditor } from './PropertyEditor';
import type { PersonInputs } from '../lib/projection';

export function Inputs() {
  const inputs = useStore((s) => s.inputs);
  const setInput = useStore((s) => s.setInput);
  const addPartner = useStore((s) => s.addPartner);
  const removePartner = useStore((s) => s.removePartner);

  return (
    <div className="space-y-6">
      <Section title="Horizon">
        <Slider
          label="Project until age"
          value={inputs.endAge}
          min={Math.max(inputs.primary.retirementAge + 1, (inputs.partner?.retirementAge ?? 0) + 1)}
          max={100}
          hint="Primary's age — chart axis"
          onChange={(v) => setInput('endAge', v)}
        />
      </Section>

      <PersonSection
        title="You"
        person={inputs.primary}
        who="primary"
        rightSlot={
          inputs.partner == null ? (
            <button
              onClick={addPartner}
              className="text-xs px-2 py-1 rounded-md bg-panel2 border border-border hover:border-accent"
            >
              + Add partner
            </button>
          ) : null
        }
      />

      {inputs.partner && (
        <PersonSection
          title="Partner"
          person={inputs.partner}
          who="partner"
          rightSlot={
            <button
              onClick={removePartner}
              className="text-xs px-2 py-1 rounded-md text-muted hover:text-red-500"
            >
              ✕ Remove
            </button>
          }
        />
      )}

      <Section title="Investments (household)">
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

function PersonSection({
  title,
  person,
  who,
  rightSlot,
}: {
  title: string;
  person: PersonInputs;
  who: 'primary' | 'partner';
  rightSlot?: React.ReactNode;
}) {
  const setPersonField = useStore((s) => s.setPersonField);

  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-accent2">{title}</h3>
        {rightSlot}
      </div>
      <Slider
        label="Current age"
        value={person.currentAge}
        min={18}
        max={70}
        onChange={(v) => setPersonField(who, 'currentAge', v)}
      />
      <Slider
        label="Retirement age"
        value={person.retirementAge}
        min={Math.max(person.currentAge + 1, 50)}
        max={75}
        onChange={(v) => setPersonField(who, 'retirementAge', v)}
      />
      <Slider
        label="Annual income (gross)"
        value={person.annualIncome}
        min={0}
        max={500000}
        step={1000}
        format={(v) => formatAUD(v)}
        hint="Tax & Medicare levy applied automatically"
        onChange={(v) => setPersonField(who, 'annualIncome', v)}
      />
      <Slider
        label="Annual salary growth"
        value={person.salaryGrowth}
        min={0}
        max={0.10}
        step={0.005}
        format={(v) => formatPercent(v)}
        onChange={(v) => setPersonField(who, 'salaryGrowth', v)}
      />
      <Slider
        label="Current super balance"
        value={person.currentSuper}
        min={0}
        max={2000000}
        step={1000}
        format={(v) => formatAUD(v, { compact: true })}
        onChange={(v) => setPersonField(who, 'currentSuper', v)}
      />
      <Slider
        label="Super contribution rate"
        value={person.superRate}
        min={0.115}
        max={0.25}
        step={0.005}
        format={(v) => formatPercent(v)}
        hint={`SG minimum ${formatPercent(AU.superGuaranteeRate)} — increase via salary sacrifice`}
        onChange={(v) => setPersonField(who, 'superRate', v)}
      />
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
