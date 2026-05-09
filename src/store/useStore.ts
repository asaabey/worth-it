import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AU } from '../countries/australia';
import { type Property, makeDefaultProperty } from '../countries/au-property';
import type { PersonInputs, ProjectionInputs } from '../lib/projection';

export type DisplayMode = 'real' | 'nominal';
export type Theme = 'dark' | 'light';

interface AppState {
  country: 'AU' | null;
  setCountry: (c: 'AU' | null) => void;

  inputs: ProjectionInputs;
  setInput: <K extends keyof ProjectionInputs>(key: K, value: ProjectionInputs[K]) => void;
  setPersonField: (
    who: 'primary' | 'partner',
    key: keyof PersonInputs,
    value: number,
  ) => void;
  addPartner: () => void;
  removePartner: () => void;
  addProperty: (type: 'PPOR' | 'investment') => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  removeProperty: (id: string) => void;

  displayMode: DisplayMode;
  setDisplayMode: (m: DisplayMode) => void;

  theme: Theme;
  toggleTheme: () => void;

  reset: () => void;
}

const defaultPrimary: PersonInputs = {
  currentAge: 30,
  retirementAge: 65,
  annualIncome: 100000,
  salaryGrowth: AU.defaultSalaryGrowth,
  currentSuper: 50000,
  superRate: AU.superGuaranteeRate,
};

function makeDefaultPartner(primary: PersonInputs): PersonInputs {
  return {
    currentAge: primary.currentAge,
    retirementAge: primary.retirementAge,
    annualIncome: 80000,
    salaryGrowth: AU.defaultSalaryGrowth,
    currentSuper: 40000,
    superRate: AU.superGuaranteeRate,
  };
}

const defaultInputs: ProjectionInputs = {
  primary: defaultPrimary,
  partner: null,
  endAge: 90,
  monthlyInvestment: 1000,
  currentInvestments: 20000,
  currentCash: 10000,
  expectedReturn: 0.10,
  inflation: AU.defaultInflation,
  withdrawalRate: 0.04,
  properties: [],
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      country: null,
      setCountry: (c) => set({ country: c }),

      inputs: defaultInputs,
      setInput: (key, value) =>
        set((s) => ({ inputs: { ...s.inputs, [key]: value } })),

      setPersonField: (who, key, value) =>
        set((s) => {
          if (who === 'primary') {
            return {
              inputs: {
                ...s.inputs,
                primary: { ...s.inputs.primary, [key]: value },
              },
            };
          }
          if (!s.inputs.partner) return s;
          return {
            inputs: {
              ...s.inputs,
              partner: { ...s.inputs.partner, [key]: value },
            },
          };
        }),

      addPartner: () =>
        set((s) => ({
          inputs: { ...s.inputs, partner: makeDefaultPartner(s.inputs.primary) },
        })),
      removePartner: () =>
        set((s) => ({ inputs: { ...s.inputs, partner: null } })),

      addProperty: (type) =>
        set((s) => ({
          inputs: {
            ...s.inputs,
            properties: [...s.inputs.properties, makeDefaultProperty(type)],
          },
        })),
      updateProperty: (id, patch) =>
        set((s) => ({
          inputs: {
            ...s.inputs,
            properties: s.inputs.properties.map((p) =>
              p.id === id ? { ...p, ...patch } : p,
            ),
          },
        })),
      removeProperty: (id) =>
        set((s) => ({
          inputs: {
            ...s.inputs,
            properties: s.inputs.properties.filter((p) => p.id !== id),
          },
        })),

      displayMode: 'real',
      setDisplayMode: (m) => set({ displayMode: m }),

      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      reset: () => set({ inputs: defaultInputs, displayMode: 'real' }),
    }),
    {
      name: 'wealth-projection-app',
      version: 3,
      migrate: (persisted: unknown, fromVersion: number) => {
        const state = persisted as { inputs?: Record<string, unknown> } | undefined;
        if (!state?.inputs) return state as unknown as AppState;
        const inputs = state.inputs;

        // v1 → v2: ensure properties array exists
        if (fromVersion < 2 && !inputs.properties) {
          inputs.properties = [];
        }

        // v2 → v3: lift flat person fields into primary, add partner=null
        if (fromVersion < 3 && !('primary' in inputs)) {
          inputs.primary = {
            currentAge: inputs.currentAge ?? defaultPrimary.currentAge,
            retirementAge: inputs.retirementAge ?? defaultPrimary.retirementAge,
            annualIncome: inputs.annualIncome ?? defaultPrimary.annualIncome,
            salaryGrowth: inputs.salaryGrowth ?? defaultPrimary.salaryGrowth,
            currentSuper: inputs.currentSuper ?? defaultPrimary.currentSuper,
            superRate: inputs.superRate ?? defaultPrimary.superRate,
          };
          inputs.partner = null;
          delete inputs.currentAge;
          delete inputs.retirementAge;
          delete inputs.annualIncome;
          delete inputs.salaryGrowth;
          delete inputs.currentSuper;
          delete inputs.superRate;
        }

        return state as unknown as AppState;
      },
    },
  ),
);
