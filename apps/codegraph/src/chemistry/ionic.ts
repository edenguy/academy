/** Charge table for the two ionic pairs the lesson is allowed to build. Not a general formula engine. */

export type IonPairId = 'na-cl' | 'mg-cl';
export type SampleState = 'solid' | 'melt' | 'solution';

export interface IonPair {
  id: IonPairId;
  metal: string;
  nonmetal: string;
  /** Electrons the metal must lose before the ions in this pair exist. */
  electrons: number;
  metalCharge: number;
  nonmetalCharge: number;
  /** How many nonmetal ions balance one metal ion. */
  nonmetalCount: number;
  formula: string;
}

export const ION_PAIRS: Record<IonPairId, IonPair> = {
  'na-cl': {
    id: 'na-cl',
    metal: 'Na',
    nonmetal: 'Cl',
    electrons: 1,
    metalCharge: 1,
    nonmetalCharge: -1,
    nonmetalCount: 1,
    formula: 'NaCl',
  },
  'mg-cl': {
    id: 'mg-cl',
    metal: 'Mg',
    nonmetal: 'Cl',
    electrons: 2,
    metalCharge: 2,
    nonmetalCharge: -1,
    nonmetalCount: 2,
    formula: 'MgCl2',
  },
};

export function ionPair(id: IonPairId): IonPair {
  return ION_PAIRS[id];
}

/** Ions exist only after every electron this pair needs has moved. */
export function ionsFormed(moved: number, pair: IonPair): boolean {
  return moved + 1e-9 >= pair.electrons;
}

/** A solid ionic lattice does not conduct. Melt and solution do, because the ions can move. */
export function conducts(state: SampleState): boolean {
  return state === 'melt' || state === 'solution';
}
