interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  hint?: string;
  onChange: (v: number) => void;
}

export function Slider({ label, value, min, max, step = 1, format, hint, onChange }: SliderProps) {
  const display = format ? format(value) : value.toString();

  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-sm text-muted">{label}</label>
        <span className="text-sm font-mono text-text">{display}</span>
      </div>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <div className="text-xs text-dim mt-1">{hint}</div>}
    </div>
  );
}
