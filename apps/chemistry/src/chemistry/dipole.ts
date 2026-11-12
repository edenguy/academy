/**
 * Two bond dipoles of equal length 1, with `angleDeg` between them.
 * |v1 + v2| = 2 |cos(angle/2)|. At 180° the sum is 0; any bend leaves a net dipole.
 */
export function netDipole(angleDeg: number): number {
  const rad = (angleDeg * Math.PI) / 180;
  return Math.abs(2 * Math.cos(rad / 2));
}

/** Treat a numerical zero as nonpolar. 180° lands on 0; a bend does not. */
export function isPolar(angleDeg: number): boolean {
  return netDipole(angleDeg) > 1e-6;
}
