export type BondOrder = 1 | 2 | 3;
export type Arrangement = 'molecular' | 'network';

/** A single bond shares one pair, a double bond two, a triple bond three. */
export function sharedPairs(order: BondOrder): number {
  return order;
}

export function isNetwork(arrangement: Arrangement): boolean {
  return arrangement === 'network';
}
