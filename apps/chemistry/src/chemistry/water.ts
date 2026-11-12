/**
 * A water molecule drawn for the lesson, not a measured structure.
 * The O–H length is 1 in these units. The angle is the usual school diagram (104.5°),
 * used only to place atoms. It is not shown as a readout.
 * `H_BOND_REACH` is in the same units: an H counts as hydrogen-bonded when it is
 * within that reach of the other molecule's O, and closer to that O than its own O is
 * (so the H is the atom pointing at the other oxygen).
 */
export const WATER_ANGLE_DEG = 104.5;
export const H_BOND_REACH = 1.6;

export interface Point {
  x: number;
  y: number;
}

export interface WaterMolecule {
  O: Point;
  H1: Point;
  H2: Point;
}

function add(origin: Point, angleRad: number): Point {
  return { x: origin.x + Math.cos(angleRad), y: origin.y + Math.sin(angleRad) };
}

export function waterMolecule(cx: number, cy: number, rotationDeg: number): WaterMolecule {
  const rotation = (rotationDeg * Math.PI) / 180;
  const half = ((WATER_ANGLE_DEG / 2) * Math.PI) / 180;
  const origin = { x: cx, y: cy };
  return {
    O: origin,
    H1: add(origin, rotation - half),
    H2: add(origin, rotation + half),
  };
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function hPointsAt(h: Point, ownO: Point, foreignO: Point): boolean {
  const reach = dist(h, foreignO);
  return reach <= H_BOND_REACH && reach < dist(ownO, foreignO);
}

/** True when either molecule has an H pointing at the other's O, inside H_BOND_REACH. */
export function hydrogenBondBetween(a: WaterMolecule, b: WaterMolecule): boolean {
  return (
    hPointsAt(a.H1, a.O, b.O) ||
    hPointsAt(a.H2, a.O, b.O) ||
    hPointsAt(b.H1, b.O, a.O) ||
    hPointsAt(b.H2, b.O, a.O)
  );
}
