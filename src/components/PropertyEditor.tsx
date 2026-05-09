import { useStore } from '../store/useStore';
import {
  AU_CITIES,
  defaultGrowthFor,
  type Property,
} from '../countries/au-property';
import { Slider } from './Slider';
import { formatAUD, formatPercent } from '../lib/format';

export function PropertyEditor() {
  const properties = useStore((s) => s.inputs.properties);
  const addProperty = useStore((s) => s.addProperty);

  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-accent2">
          Property
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => addProperty('PPOR')}
            className="text-xs px-2 py-1 rounded-md bg-panel2 border border-border hover:border-accent"
          >
            + Home
          </button>
          <button
            onClick={() => addProperty('investment')}
            className="text-xs px-2 py-1 rounded-md bg-panel2 border border-border hover:border-accent"
          >
            + Investment
          </button>
        </div>
      </div>

      {properties.length === 0 ? (
        <p className="text-xs text-dim">
          No properties added. Click + Home or + Investment to model property in your projection.
        </p>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const updateProperty = useStore((s) => s.updateProperty);
  const removeProperty = useStore((s) => s.removeProperty);
  const city = AU_CITIES.find((c) => c.name === property.city);

  const onCityChange = (cityName: string) => {
    const newGrowth = defaultGrowthFor(cityName, '');
    updateProperty(property.id, { city: cityName, suburb: '', growthRate: newGrowth });
  };

  const onSuburbChange = (suburbName: string) => {
    const newGrowth = defaultGrowthFor(property.city, suburbName);
    updateProperty(property.id, { suburb: suburbName, growthRate: newGrowth });
  };

  const equity = property.value - property.mortgageBalance;

  return (
    <div className="bg-panel2 border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <input
          value={property.label}
          onChange={(e) => updateProperty(property.id, { label: e.target.value })}
          className="bg-transparent text-sm font-semibold text-text outline-none border-b border-transparent focus:border-accent w-40"
        />
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            property.type === 'PPOR'
              ? 'bg-accent2/20 text-accent2'
              : 'bg-accent/20 text-accent'
          }`}>
            {property.type === 'PPOR' ? 'Home' : 'Investment'}
          </span>
          <button
            onClick={() => removeProperty(property.id)}
            className="text-xs text-muted hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Select
          label="City"
          value={property.city}
          options={AU_CITIES.map((c) => ({ value: c.name, label: c.name }))}
          onChange={onCityChange}
        />
        <Select
          label="Suburb"
          value={property.suburb}
          options={[
            { value: '', label: '— City average —' },
            ...(city?.suburbs.map((s) => ({ value: s.name, label: s.name })) ?? []),
          ]}
          onChange={onSuburbChange}
        />
      </div>

      <Slider
        label="Current value"
        value={property.value}
        min={100000}
        max={5000000}
        step={10000}
        format={(v) => formatAUD(v, { compact: true })}
        onChange={(v) => updateProperty(property.id, { value: v })}
      />
      <Slider
        label="Mortgage balance"
        value={property.mortgageBalance}
        min={0}
        max={Math.max(property.value, 100000)}
        step={5000}
        format={(v) => formatAUD(v, { compact: true })}
        hint={`Equity: ${formatAUD(equity, { compact: true })}`}
        onChange={(v) => updateProperty(property.id, { mortgageBalance: v })}
      />
      <Slider
        label="Mortgage rate"
        value={property.mortgageRate}
        min={0.02}
        max={0.10}
        step={0.0025}
        format={(v) => formatPercent(v, 2)}
        onChange={(v) => updateProperty(property.id, { mortgageRate: v })}
      />
      <Slider
        label="Years remaining on loan"
        value={property.mortgageYearsRemaining}
        min={0}
        max={30}
        step={1}
        onChange={(v) => updateProperty(property.id, { mortgageYearsRemaining: v })}
      />
      <Slider
        label="Annual capital growth"
        value={property.growthRate}
        min={0}
        max={0.10}
        step={0.0025}
        format={(v) => formatPercent(v, 2)}
        hint={
          property.suburb
            ? `Default for ${property.suburb}: ${formatPercent(defaultGrowthFor(property.city, property.suburb), 2)}`
            : `Default for ${property.city}: ${formatPercent(defaultGrowthFor(property.city, ''), 2)}`
        }
        onChange={(v) => updateProperty(property.id, { growthRate: v })}
      />
      {property.type === 'investment' && (
        <>
          <Slider
            label="Weekly rent"
            value={property.weeklyRent}
            min={0}
            max={3000}
            step={10}
            format={(v) => `$${v}/wk`}
            hint={`Gross yield: ${formatPercent((property.weeklyRent * 52) / Math.max(property.value, 1), 2)}`}
            onChange={(v) => updateProperty(property.id, { weeklyRent: v })}
          />
          <Slider
            label="Annual costs (% of value)"
            value={property.expensesRate}
            min={0}
            max={0.04}
            step={0.0025}
            format={(v) => formatPercent(v, 2)}
            hint="Rates, maintenance, insurance, PM fees"
            onChange={(v) => updateProperty(property.id, { expensesRate: v })}
          />
        </>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg border border-border rounded-md px-2 py-1 text-sm text-text outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
