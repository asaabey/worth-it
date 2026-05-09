// AU capital growth defaults by city + curated suburb list.
// Figures are rough long-run (15-20yr) nominal capital growth %s based on
// publicly reported CoreLogic / Domain medians. Treat as starting points only.

export interface SuburbDef {
  name: string;
  growthRate: number;
  medianHouse?: number; // optional indicative median (AUD)
}

export interface CityDef {
  name: string;
  state: string;
  defaultGrowthRate: number;
  suburbs: SuburbDef[];
}

export const AU_CITIES: CityDef[] = [
  {
    name: 'Sydney',
    state: 'NSW',
    defaultGrowthRate: 0.065,
    suburbs: [
      { name: 'Mosman', growthRate: 0.07 },
      { name: 'Bondi', growthRate: 0.075 },
      { name: 'Parramatta', growthRate: 0.06 },
      { name: 'Blacktown', growthRate: 0.055 },
      { name: 'Liverpool', growthRate: 0.055 },
      { name: 'Chatswood', growthRate: 0.07 },
      { name: 'Penrith', growthRate: 0.05 },
    ],
  },
  {
    name: 'Melbourne',
    state: 'VIC',
    defaultGrowthRate: 0.06,
    suburbs: [
      { name: 'Toorak', growthRate: 0.065 },
      { name: 'Brunswick', growthRate: 0.07 },
      { name: 'Box Hill', growthRate: 0.065 },
      { name: 'Footscray', growthRate: 0.065 },
      { name: 'Frankston', growthRate: 0.05 },
      { name: 'Werribee', growthRate: 0.045 },
      { name: 'Geelong', growthRate: 0.055 },
    ],
  },
  {
    name: 'Brisbane',
    state: 'QLD',
    defaultGrowthRate: 0.06,
    suburbs: [
      { name: 'New Farm', growthRate: 0.07 },
      { name: 'Ascot', growthRate: 0.065 },
      { name: 'Logan', growthRate: 0.055 },
      { name: 'Ipswich', growthRate: 0.05 },
      { name: 'Sunshine Coast', growthRate: 0.06 },
      { name: 'Gold Coast', growthRate: 0.06 },
    ],
  },
  {
    name: 'Perth',
    state: 'WA',
    defaultGrowthRate: 0.045,
    suburbs: [
      { name: 'Cottesloe', growthRate: 0.055 },
      { name: 'Subiaco', growthRate: 0.05 },
      { name: 'Mandurah', growthRate: 0.04 },
      { name: 'Joondalup', growthRate: 0.045 },
      { name: 'Fremantle', growthRate: 0.05 },
    ],
  },
  {
    name: 'Adelaide',
    state: 'SA',
    defaultGrowthRate: 0.055,
    suburbs: [
      { name: 'Norwood', growthRate: 0.06 },
      { name: 'Glenelg', growthRate: 0.055 },
      { name: 'Prospect', growthRate: 0.06 },
      { name: 'Mawson Lakes', growthRate: 0.05 },
    ],
  },
  {
    name: 'Canberra',
    state: 'ACT',
    defaultGrowthRate: 0.055,
    suburbs: [
      { name: 'Inner North', growthRate: 0.06 },
      { name: 'Tuggeranong', growthRate: 0.05 },
      { name: 'Belconnen', growthRate: 0.055 },
      { name: 'Gungahlin', growthRate: 0.05 },
    ],
  },
  {
    name: 'Hobart',
    state: 'TAS',
    defaultGrowthRate: 0.055,
    suburbs: [
      { name: 'Sandy Bay', growthRate: 0.06 },
      { name: 'Battery Point', growthRate: 0.06 },
      { name: 'Glenorchy', growthRate: 0.05 },
    ],
  },
  {
    name: 'Darwin',
    state: 'NT',
    defaultGrowthRate: 0.035,
    suburbs: [
      { name: 'Fannie Bay', growthRate: 0.04 },
      { name: 'Palmerston', growthRate: 0.03 },
    ],
  },
  {
    name: 'Regional NSW',
    state: 'NSW',
    defaultGrowthRate: 0.05,
    suburbs: [
      { name: 'Newcastle', growthRate: 0.055 },
      { name: 'Wollongong', growthRate: 0.055 },
      { name: 'Byron Bay', growthRate: 0.07 },
      { name: 'Central Coast', growthRate: 0.055 },
    ],
  },
  {
    name: 'Regional VIC',
    state: 'VIC',
    defaultGrowthRate: 0.045,
    suburbs: [
      { name: 'Ballarat', growthRate: 0.05 },
      { name: 'Bendigo', growthRate: 0.05 },
    ],
  },
  {
    name: 'Regional QLD',
    state: 'QLD',
    defaultGrowthRate: 0.045,
    suburbs: [
      { name: 'Townsville', growthRate: 0.04 },
      { name: 'Cairns', growthRate: 0.045 },
      { name: 'Toowoomba', growthRate: 0.045 },
    ],
  },
];

export type PropertyType = 'PPOR' | 'investment';

export interface Property {
  id: string;
  label: string;
  type: PropertyType;
  city: string;
  suburb: string; // empty string = whole-city default
  value: number;
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsRemaining: number;
  weeklyRent: number; // 0 for PPOR
  growthRate: number; // pre-populated from city/suburb
  expensesRate: number; // % of value/year (rates, maintenance, insurance, PM)
  depreciationRate: number; // for investment properties only
}

export function findCity(cityName: string): CityDef | undefined {
  return AU_CITIES.find((c) => c.name === cityName);
}

export function findSuburb(cityName: string, suburbName: string): SuburbDef | undefined {
  return findCity(cityName)?.suburbs.find((s) => s.name === suburbName);
}

export function defaultGrowthFor(cityName: string, suburbName: string): number {
  const city = findCity(cityName);
  if (!city) return 0.05;
  if (!suburbName) return city.defaultGrowthRate;
  const suburb = city.suburbs.find((s) => s.name === suburbName);
  return suburb?.growthRate ?? city.defaultGrowthRate;
}

export function makeDefaultProperty(type: PropertyType): Property {
  const id = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const isPPOR = type === 'PPOR';
  return {
    id,
    label: isPPOR ? 'Family home' : 'Investment property',
    type,
    city: 'Sydney',
    suburb: '',
    value: isPPOR ? 1200000 : 700000,
    mortgageBalance: isPPOR ? 600000 : 500000,
    mortgageRate: 0.06,
    mortgageYearsRemaining: 25,
    weeklyRent: isPPOR ? 0 : 600,
    growthRate: 0.065,
    expensesRate: 0.015,
    depreciationRate: isPPOR ? 0 : 0.015,
  };
}
