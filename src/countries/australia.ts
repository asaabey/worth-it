// Australia 2024-25 financial year constants

export const AU = {
  code: 'AU',
  name: 'Australia',
  currency: 'AUD',
  currencySymbol: '$',
  // Resident tax brackets (2024-25, applies from 1 July 2024)
  taxBrackets: [
    { upTo: 18200, rate: 0 },
    { upTo: 45000, rate: 0.16 },
    { upTo: 135000, rate: 0.30 },
    { upTo: 190000, rate: 0.37 },
    { upTo: Infinity, rate: 0.45 },
  ],
  medicareLevy: 0.02,
  // Superannuation
  superGuaranteeRate: 0.115, // 11.5% for FY2024-25, 12% from 1 July 2025
  superContributionsTax: 0.15,
  concessionalCap: 30000, // 2024-25
  preservationAge: 60,
  // Defaults
  defaultInflation: 0.025,
  defaultSalaryGrowth: 0.03,
  // Index returns (long-run nominal, dividends reinvested)
  indexOptions: [
    { id: 'sp500', label: 'S&P 500 (~10%)', nominalReturn: 0.10 },
    { id: 'asx200', label: 'ASX 200 (~9.5%)', nominalReturn: 0.095 },
    { id: 'balanced', label: '60/40 Balanced (~7.5%)', nominalReturn: 0.075 },
    { id: 'conservative', label: 'Conservative (~5%)', nominalReturn: 0.05 },
  ],
};

export type Country = typeof AU;

export function calcIncomeTaxAU(taxableIncome: number): number {
  let tax = 0;
  let lower = 0;
  for (const b of AU.taxBrackets) {
    if (taxableIncome > b.upTo) {
      tax += (b.upTo - lower) * b.rate;
      lower = b.upTo;
    } else {
      tax += (taxableIncome - lower) * b.rate;
      return tax + taxableIncome * AU.medicareLevy;
    }
  }
  return tax + taxableIncome * AU.medicareLevy;
}
