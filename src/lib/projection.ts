import { AU, calcIncomeTaxAU } from '../countries/australia';
import type { Property } from '../countries/au-property';

export interface ProjectionInputs {
  currentAge: number;
  retirementAge: number;
  endAge: number;
  annualIncome: number;
  salaryGrowth: number;
  monthlyInvestment: number;
  currentInvestments: number;
  currentSuper: number;
  currentCash: number;
  expectedReturn: number;
  inflation: number;
  superRate: number;
  withdrawalRate: number;
  properties: Property[];
}

export interface PropertyState {
  id: string;
  label: string;
  type: 'PPOR' | 'investment';
  value: number;
  mortgageBalance: number;
  equity: number;
}

export interface YearRow {
  age: number;
  year: number;
  grossIncome: number;
  netRental: number;
  taxableIncome: number;
  takeHome: number;
  superContrib: number;
  investContrib: number;
  superBalance: number;
  investBalance: number;
  cashBalance: number;
  propertyEquity: number;
  propertyValue: number;
  propertyDebt: number;
  properties: PropertyState[];
  netWorthNominal: number;
  netWorthReal: number;
}

interface MortgageState {
  balance: number;
  rate: number;
  yearsRemaining: number;
  annualPayment: number;
}

function annualMortgagePayment(balance: number, rate: number, years: number): number {
  if (balance <= 0 || years <= 0) return 0;
  if (rate === 0) return balance / years;
  // Standard amortization formula, annual periods
  return (balance * rate) / (1 - Math.pow(1 + rate, -years));
}

function amortizeOneYear(state: MortgageState): { interest: number; principal: number; newBalance: number } {
  if (state.balance <= 0 || state.yearsRemaining <= 0) {
    return { interest: 0, principal: 0, newBalance: 0 };
  }
  const interest = state.balance * state.rate;
  const principal = Math.min(state.annualPayment - interest, state.balance);
  const newBalance = Math.max(state.balance - principal, 0);
  return { interest, principal, newBalance };
}

export function project(inputs: ProjectionInputs): YearRow[] {
  const rows: YearRow[] = [];
  const startYear = new Date().getFullYear();

  let salary = inputs.annualIncome;
  let superBal = inputs.currentSuper;
  let investBal = inputs.currentInvestments;
  const cashBal = inputs.currentCash;
  let retirementPool = 0;

  // Initialize property runtime state
  const propStates = inputs.properties.map((p) => ({
    def: p,
    value: p.value,
    mortgage: {
      balance: p.mortgageBalance,
      rate: p.mortgageRate,
      yearsRemaining: p.mortgageYearsRemaining,
      annualPayment: annualMortgagePayment(p.mortgageBalance, p.mortgageRate, p.mortgageYearsRemaining),
    } as MortgageState,
    weeklyRent: p.weeklyRent,
  }));

  for (let age = inputs.currentAge; age <= inputs.endAge; age++) {
    const year = startYear + (age - inputs.currentAge);
    const isWorking = age < inputs.retirementAge;
    const r = inputs.expectedReturn;

    const grossIncome = isWorking ? salary : 0;
    const superContribGross = isWorking ? grossIncome * inputs.superRate : 0;
    const superContribNet = superContribGross * (1 - AU.superContributionsTax);

    // ----- Property: appreciation, amortization, rental P&L -----
    let netRentalCashFlow = 0;
    let totalPropertyTaxableIncome = 0;
    let totalPropertyValue = 0;
    let totalPropertyDebt = 0;
    const perPropertyState: PropertyState[] = [];

    for (const ps of propStates) {
      // Appreciation
      ps.value *= 1 + ps.def.growthRate;

      // Mortgage
      const am = amortizeOneYear(ps.mortgage);
      ps.mortgage.balance = am.newBalance;
      if (ps.mortgage.yearsRemaining > 0) ps.mortgage.yearsRemaining -= 1;

      // Rental + costs (only meaningful for investment)
      const annualRent = ps.weeklyRent * 52;
      const annualExpenses = ps.value * ps.def.expensesRate;

      if (ps.def.type === 'investment') {
        const cashFlow = annualRent - am.interest - annualExpenses - am.principal;
        netRentalCashFlow += cashFlow;
        // Negative gearing: rent − interest − expenses − depreciation (depreciation is paper-only)
        const depreciation = ps.value * ps.def.depreciationRate;
        const taxableRental = annualRent - am.interest - annualExpenses - depreciation;
        totalPropertyTaxableIncome += taxableRental;
        // Grow rent with inflation for next year
        ps.weeklyRent *= 1 + inputs.inflation;
      } else {
        // PPOR: mortgage payment + expenses are personal cash outflows (already in expenses elsewhere — keep separate)
        // We don't deduct from take-home because user's expense slider is implicit.
        // No tax effect.
      }

      totalPropertyValue += ps.value;
      totalPropertyDebt += ps.mortgage.balance;

      perPropertyState.push({
        id: ps.def.id,
        label: ps.def.label,
        type: ps.def.type,
        value: ps.value,
        mortgageBalance: ps.mortgage.balance,
        equity: ps.value - ps.mortgage.balance,
      });
    }

    // ----- Tax on combined taxable income (salary + net property taxable income) -----
    const taxableIncome = grossIncome + totalPropertyTaxableIncome;
    const tax = isWorking ? calcIncomeTaxAU(Math.max(taxableIncome, 0)) : 0;
    // If totalPropertyTaxableIncome is negative (negative gearing), tax is reduced — already handled by passing combined to bracket calc.
    const takeHome = grossIncome - tax + netRentalCashFlow;

    // ----- Investment contributions -----
    const investContrib = isWorking ? inputs.monthlyInvestment * 12 : 0;

    // ----- Compound super + investments -----
    superBal = superBal * (1 + r) + superContribNet * (1 + r / 2);
    investBal = investBal * (1 + r) + investContrib * (1 + r / 2);

    // ----- Retirement drawdown -----
    if (!isWorking) {
      if (age === inputs.retirementAge) {
        retirementPool = superBal + investBal;
      }
      const annualDraw = retirementPool * inputs.withdrawalRate
        * Math.pow(1 + inputs.inflation, age - inputs.retirementAge);

      let remaining = annualDraw;
      const drawInvest = Math.min(investBal, remaining);
      investBal -= drawInvest;
      remaining -= drawInvest;
      if (age >= AU.preservationAge && remaining > 0) {
        const drawSuper = Math.min(superBal, remaining);
        superBal -= drawSuper;
      }
    }

    const propertyEquity = totalPropertyValue - totalPropertyDebt;
    const netWorthNominal = superBal + investBal + cashBal + propertyEquity;
    const yearsFromStart = age - inputs.currentAge;
    const netWorthReal = netWorthNominal / Math.pow(1 + inputs.inflation, yearsFromStart);

    rows.push({
      age,
      year,
      grossIncome,
      netRental: netRentalCashFlow,
      taxableIncome,
      takeHome,
      superContrib: superContribGross,
      investContrib,
      superBalance: superBal,
      investBalance: investBal,
      cashBalance: cashBal,
      propertyEquity,
      propertyValue: totalPropertyValue,
      propertyDebt: totalPropertyDebt,
      properties: perPropertyState,
      netWorthNominal,
      netWorthReal,
    });

    if (isWorking) salary *= 1 + inputs.salaryGrowth;
  }

  return rows;
}

export interface Summary {
  retirementBalanceNominal: number;
  retirementBalanceReal: number;
  sustainableAnnualIncomeReal: number;
  sustainableMonthlyIncomeReal: number;
  fireAge: number | null;
  fireNumber: number;
  finalNetWorthReal: number;
  fundedToAge: number | null;
  retirementPropertyEquityReal: number;
}

export function summarize(rows: YearRow[], inputs: ProjectionInputs): Summary {
  const atRetirement = rows.find(r => r.age === inputs.retirementAge);
  const retirementBalanceNominal = atRetirement?.netWorthNominal ?? 0;
  const retirementBalanceReal = atRetirement?.netWorthReal ?? 0;
  const sustainableAnnualIncomeReal = retirementBalanceReal * inputs.withdrawalRate;
  const sustainableMonthlyIncomeReal = sustainableAnnualIncomeReal / 12;

  const firstRow = rows[0];
  const annualExpenses = Math.max(firstRow.takeHome - inputs.monthlyInvestment * 12, 1);
  const fireNumber = annualExpenses * 25;

  let fireAge: number | null = null;
  for (const row of rows) {
    if (row.netWorthReal >= fireNumber) {
      fireAge = row.age;
      break;
    }
  }

  let fundedToAge: number | null = null;
  for (const row of rows) {
    if (row.age > inputs.retirementAge && row.netWorthNominal <= 0) {
      fundedToAge = row.age;
      break;
    }
  }

  const retirementPropertyEquityReal = atRetirement
    ? atRetirement.propertyEquity / Math.pow(1 + inputs.inflation, atRetirement.age - inputs.currentAge)
    : 0;

  return {
    retirementBalanceNominal,
    retirementBalanceReal,
    sustainableAnnualIncomeReal,
    sustainableMonthlyIncomeReal,
    fireAge,
    fireNumber,
    finalNetWorthReal: rows[rows.length - 1]?.netWorthReal ?? 0,
    fundedToAge,
    retirementPropertyEquityReal,
  };
}
