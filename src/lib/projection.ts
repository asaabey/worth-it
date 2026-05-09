import { AU, calcIncomeTaxAU } from '../countries/australia';
import type { Property } from '../countries/au-property';

export interface PersonInputs {
  currentAge: number;
  retirementAge: number;
  annualIncome: number;
  salaryGrowth: number;
  currentSuper: number;
  superRate: number;
}

export interface ProjectionInputs {
  primary: PersonInputs;
  partner: PersonInputs | null;
  endAge: number;
  monthlyInvestment: number;
  currentInvestments: number;
  currentCash: number;
  expectedReturn: number;
  inflation: number;
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
  age: number; // primary's age — projection clock
  partnerAge: number | null;
  year: number;
  primaryWorking: boolean;
  partnerWorking: boolean;
  householdRetired: boolean;

  grossIncome: number; // household total
  netRental: number;
  taxableIncome: number;
  tax: number;
  takeHome: number;
  superContrib: number; // household total
  investContrib: number;
  superBalance: number; // household total
  investBalance: number;
  cashBalance: number;
  propertyEquity: number;
  propertyValue: number;
  propertyDebt: number;
  properties: PropertyState[];
  netWorthNominal: number;
  netWorthReal: number;

  drawdownInvest: number;
  drawdownSuper: number;
  retirementCashFlowNominal: number;
  retirementCashFlowReal: number;
}

interface MortgageState {
  balance: number;
  rate: number;
  yearsRemaining: number;
  annualPayment: number;
}

interface PersonState {
  def: PersonInputs;
  salary: number;
  superBal: number;
}

function annualMortgagePayment(balance: number, rate: number, years: number): number {
  if (balance <= 0 || years <= 0) return 0;
  if (rate === 0) return balance / years;
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

  const persons: PersonState[] = [
    { def: inputs.primary, salary: inputs.primary.annualIncome, superBal: inputs.primary.currentSuper },
    ...(inputs.partner
      ? [{ def: inputs.partner, salary: inputs.partner.annualIncome, superBal: inputs.partner.currentSuper }]
      : []),
  ];

  let investBal = inputs.currentInvestments;
  const cashBal = inputs.currentCash;
  let retirementPool = 0;
  let wasHouseholdRetired = false;

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

  const horizonYears = inputs.endAge - inputs.primary.currentAge;

  for (let offset = 0; offset <= horizonYears; offset++) {
    const primaryAge = inputs.primary.currentAge + offset;
    const partnerAge = inputs.partner ? inputs.partner.currentAge + offset : null;
    const year = startYear + offset;
    const r = inputs.expectedReturn;

    const personAges = persons.map((p) => p.def.currentAge + offset);
    const personWorking = persons.map((p, i) => personAges[i] < p.def.retirementAge);
    const householdRetired = personWorking.every((w) => !w);

    // ----- Property: appreciation, amortization, rental P&L -----
    let netRentalCashFlow = 0;
    let totalPropertyTaxableIncome = 0;
    let totalPropertyValue = 0;
    let totalPropertyDebt = 0;
    const perPropertyState: PropertyState[] = [];

    for (const ps of propStates) {
      ps.value *= 1 + ps.def.growthRate;

      const am = amortizeOneYear(ps.mortgage);
      ps.mortgage.balance = am.newBalance;
      if (ps.mortgage.yearsRemaining > 0) ps.mortgage.yearsRemaining -= 1;

      const annualRent = ps.weeklyRent * 52;
      const annualExpenses = ps.value * ps.def.expensesRate;

      if (ps.def.type === 'investment') {
        const cashFlow = annualRent - am.interest - annualExpenses - am.principal;
        netRentalCashFlow += cashFlow;
        const depreciation = ps.value * ps.def.depreciationRate;
        const taxableRental = annualRent - am.interest - annualExpenses - depreciation;
        totalPropertyTaxableIncome += taxableRental;
        ps.weeklyRent *= 1 + inputs.inflation;
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

    // Property taxable income split equally across persons (joint ownership simplification)
    const propertyShare = totalPropertyTaxableIncome / persons.length;

    // ----- Per-person: income, tax, super -----
    let totalGrossIncome = 0;
    let totalSuperContrib = 0;
    let totalSuperContribNet = 0;
    let totalTax = 0;
    let combinedTaxableIncome = 0;

    for (let i = 0; i < persons.length; i++) {
      const ps = persons[i];
      const isWorking = personWorking[i];
      const grossIncome = isWorking ? ps.salary : 0;
      const superContribGross = isWorking ? grossIncome * ps.def.superRate : 0;
      const superContribNet = superContribGross * (1 - AU.superContributionsTax);

      // Tax: salary + their share of property taxable income (negative = negative gearing offset)
      // In retirement: only positive rental share is taxed (drawdowns assumed tax-free in v1)
      const personTaxable = isWorking
        ? grossIncome + propertyShare
        : Math.max(propertyShare, 0);
      const personTax = calcIncomeTaxAU(Math.max(personTaxable, 0));

      totalGrossIncome += grossIncome;
      totalSuperContrib += superContribGross;
      totalSuperContribNet += superContribNet;
      totalTax += personTax;
      combinedTaxableIncome += personTaxable;
    }

    const takeHome = totalGrossIncome - totalTax + netRentalCashFlow;

    // ----- Investment contributions (household) -----
    const anyWorking = personWorking.some((w) => w);
    const investContrib = anyWorking ? inputs.monthlyInvestment * 12 : 0;

    // ----- Compound super (per person) + investments -----
    for (let i = 0; i < persons.length; i++) {
      const ps = persons[i];
      const isWorking = personWorking[i];
      const personContribNet = isWorking ? ps.salary * ps.def.superRate * (1 - AU.superContributionsTax) : 0;
      ps.superBal = ps.superBal * (1 + r) + personContribNet * (1 + r / 2);
    }
    investBal = investBal * (1 + r) + investContrib * (1 + r / 2);

    const totalSuperBalance = persons.reduce((sum, p) => sum + p.superBal, 0);

    // ----- Retirement drawdown (household — only when nobody is working) -----
    let drawdownInvest = 0;
    let drawdownSuper = 0;
    if (householdRetired) {
      if (!wasHouseholdRetired) {
        retirementPool = totalSuperBalance + investBal;
      }
      const yearsSinceRetired = persons.reduce(
        (max, p, i) => Math.max(max, personAges[i] - p.def.retirementAge),
        0,
      );
      const annualDraw = retirementPool * inputs.withdrawalRate
        * Math.pow(1 + inputs.inflation, yearsSinceRetired);

      let remaining = annualDraw;
      drawdownInvest = Math.min(investBal, remaining);
      investBal -= drawdownInvest;
      remaining -= drawdownInvest;

      // Super drawdown — pull from each person's super if they're past preservation age
      if (remaining > 0) {
        for (let i = 0; i < persons.length && remaining > 0; i++) {
          if (personAges[i] >= AU.preservationAge) {
            const ps = persons[i];
            const drawFromThis = Math.min(ps.superBal, remaining);
            ps.superBal -= drawFromThis;
            drawdownSuper += drawFromThis;
            remaining -= drawFromThis;
          }
        }
      }
    }
    wasHouseholdRetired = householdRetired;

    const retirementCashFlowNominal = householdRetired
      ? drawdownInvest + drawdownSuper + netRentalCashFlow - totalTax
      : 0;
    const inflationFactor = Math.pow(1 + inputs.inflation, offset);
    const retirementCashFlowReal = retirementCashFlowNominal / inflationFactor;

    const propertyEquity = totalPropertyValue - totalPropertyDebt;
    // Recompute total super after drawdown
    const totalSuperAfterDraw = persons.reduce((sum, p) => sum + p.superBal, 0);
    const netWorthNominal = totalSuperAfterDraw + investBal + cashBal + propertyEquity;
    const netWorthReal = netWorthNominal / inflationFactor;

    rows.push({
      age: primaryAge,
      partnerAge,
      year,
      primaryWorking: personWorking[0],
      partnerWorking: persons.length > 1 ? personWorking[1] : false,
      householdRetired,

      grossIncome: totalGrossIncome,
      netRental: netRentalCashFlow,
      taxableIncome: combinedTaxableIncome,
      tax: totalTax,
      takeHome,
      superContrib: totalSuperContrib,
      investContrib,
      superBalance: totalSuperAfterDraw,
      investBalance: investBal,
      cashBalance: cashBal,
      propertyEquity,
      propertyValue: totalPropertyValue,
      propertyDebt: totalPropertyDebt,
      properties: perPropertyState,
      netWorthNominal,
      netWorthReal,
      drawdownInvest,
      drawdownSuper,
      retirementCashFlowNominal,
      retirementCashFlowReal,
    });

    // Salary growth at end of year for each working person
    for (let i = 0; i < persons.length; i++) {
      if (personWorking[i]) persons[i].salary *= 1 + persons[i].def.salaryGrowth;
    }
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
  householdRetirementAge: number; // primary's age when household becomes fully retired
}

export function summarize(rows: YearRow[], inputs: ProjectionInputs): Summary {
  // First row where household is retired
  const retirementRow = rows.find((r) => r.householdRetired) ?? rows[rows.length - 1];
  const householdRetirementAge = retirementRow.age;

  const retirementBalanceNominal = retirementRow.netWorthNominal;
  const retirementBalanceReal = retirementRow.netWorthReal;
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
    if (row.householdRetired && row.netWorthNominal <= 0) {
      fundedToAge = row.age;
      break;
    }
  }

  const retirementPropertyEquityReal = retirementRow
    ? retirementRow.propertyEquity / Math.pow(1 + inputs.inflation, retirementRow.age - inputs.primary.currentAge)
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
    householdRetirementAge,
  };
}
