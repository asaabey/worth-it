# Worth It

Interactive wealth projection app for Australian users. Front-end only React + TypeScript app — no backend, no accounts, your data stays in your browser (localStorage).

## What it does

Takes your age, income, savings, super balance, investments and properties and projects your net worth year-by-year through to retirement. All inputs are sliders so you can see the impact of changes in real time.

### Currently models

- **Income** — gross salary, salary growth, AU 2024-25 resident tax brackets + 2% Medicare levy
- **Investments** — monthly contribution, current balance, expected return (defaults to S&P 500 long-run ~10% nominal)
- **Superannuation** — current balance, SG rate (11.5% default), 15% contributions tax, locked till preservation age 60
- **Property** — multiple properties (home + investment), city/suburb-based capital growth defaults, mortgage amortization, rental income, negative gearing flowing through to tax
- **Inflation** — toggle between today's dollars (real) and future dollars (nominal) for the chart and summary
- **Retirement drawdown** — withdrawals via the 4% rule (configurable), drawing from accessible buckets first

### Outputs

- Stacked area chart of Super / Investments / Property equity / Cash over time
- Net worth at retirement (real and nominal)
- Sustainable annual + monthly retirement income
- FIRE number and the age you reach it
- Whether your portfolio funds your projection horizon

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS
- Recharts
- Zustand (with localStorage persistence)

## Develop

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Disclaimer

Estimates only, not financial advice. Tax rules, super rates and contribution caps change — verify current values with the ATO before making decisions. Returns and capital growth are assumptions, not guarantees.
