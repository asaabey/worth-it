import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AU } from '../countries/australia';
import { type Property, makeDefaultProperty } from '../countries/au-property';
import type { ProjectionInputs } from '../lib/projection';

export type DisplayMode = 'real' | 'nominal';

interface AppState {
  country: 'AU' | null;
  setCountry: (c: 'AU' | null) => void;

  inputs: ProjectionInputs;
  setInput: <K extends keyof ProjectionInputs>(key: K, value: ProjectionInputs[K]) => void;
  addProperty: (type: 'PPOR' | 'investment') => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  removeProperty: (id: string) => void;

  displayMode: DisplayMode;
  setDisplayMode: (m: DisplayMode) => void;

  reset: () => void;
}

const defaultInputs: ProjectionInputs = {
  currentAge: 30,
  retirementAge: 65,
  endAge: 90,
  annualIncome: 100000,
  salaryGrowth: AU.defaultSalaryGrowth,
  monthlyInvestment: 1000,
  currentInvestments: 20000,
  currentSuper: 50000,
  currentCash: 10000,
  expectedReturn: 0.10,
  inflation: AU.defaultInflation,
  superRate: AU.superGuaranteeRate,
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

      reset: () => set({ inputs: defaultInputs, displayMode: 'real' }),
    }),
    {
      name: 'wealth-projection-app',
      version: 2,
      migrate: (persisted: unknown) => {
        const state = persisted as { inputs?: Partial<ProjectionInputs> } | undefined;
        if (state && state.inputs && !state.inputs.properties) {
          state.inputs.properties = [];
        }
        return state as AppState;
      },
    },
  ),
);
