import { useStore } from '../store/useStore';

const countries = [
  { code: 'AU', name: 'Australia', flag: '🇦🇺', enabled: true },
  { code: 'US', name: 'United States', flag: '🇺🇸', enabled: false },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', enabled: false },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', enabled: false },
];

export function CountrySelect() {
  const setCountry = useStore((s) => s.setCountry);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-2 text-white">Wealth Projection</h1>
        <p className="text-gray-400 mb-8">
          See how your savings, investments and superannuation grow over time. Pick your country to start.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {countries.map((c) => (
            <button
              key={c.code}
              disabled={!c.enabled}
              onClick={() => c.enabled && setCountry(c.code as 'AU')}
              className={`
                p-6 rounded-xl border text-left transition
                ${c.enabled
                  ? 'bg-panel border-border hover:border-accent hover:bg-panel2 cursor-pointer'
                  : 'bg-panel/40 border-border/40 cursor-not-allowed opacity-50'}
              `}
            >
              <div className="text-3xl mb-2">{c.flag}</div>
              <div className="text-lg font-semibold text-white">{c.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {c.enabled ? 'Available' : 'Coming soon'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
