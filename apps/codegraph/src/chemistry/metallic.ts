export interface Point {
  x: number;
  y: number;
}

/**
 * Two rows of three cations. `shear` (0–1) slides the top row by one spacing.
 * The count never changes: the lattice rearranges and stays a lattice.
 */
export function cationPositions(shear: number): Point[] {
  const gap = 1;
  const points: Point[] = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const slide = row === 0 ? shear * gap : 0;
      points.push({ x: col * gap + slide, y: row * gap });
    }
  }
  return points;
}

/** The electron sea is still there after a shear. That is the malleable-metal claim. */
export function latticeHolds(shear: number): boolean {
  return cationPositions(shear).length === 6;
}

/** Drift away from the start means the sea's electrons are moving, which is conduction in the solid. */
export function electronsMoving(drift: number): boolean {
  return drift > 0;
}
