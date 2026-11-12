import { describe, expect, it } from 'vitest';
import { conducts, ionPair, ionsFormed } from './ionic';
import { isNetwork, sharedPairs } from './covalent';
import { isPolar, netDipole } from './dipole';
import { cationPositions, electronsMoving, latticeHolds } from './metallic';
import { hydrogenBondBetween, waterMolecule } from './water';
import { probeResult } from './materials';

describe('ionic pairs', () => {
  it('builds NaCl from one electron and MgCl2 from two', () => {
    expect(ionPair('na-cl').formula).toBe('NaCl');
    expect(ionPair('mg-cl').formula).toBe('MgCl2');
    expect(ionsFormed(0, ionPair('na-cl'))).toBe(false);
    expect(ionsFormed(1, ionPair('na-cl'))).toBe(true);
    expect(ionsFormed(1, ionPair('mg-cl'))).toBe(false);
    expect(ionsFormed(2, ionPair('mg-cl'))).toBe(true);
  });

  it('conducts only when the ions can move', () => {
    expect(conducts('solid')).toBe(false);
    expect(conducts('melt')).toBe(true);
    expect(conducts('solution')).toBe(true);
  });
});

describe('covalent pairs', () => {
  it('counts one shared pair per bond order', () => {
    expect(sharedPairs(1)).toBe(1);
    expect(sharedPairs(2)).toBe(2);
    expect(sharedPairs(3)).toBe(3);
    expect(isNetwork('network')).toBe(true);
    expect(isNetwork('molecular')).toBe(false);
  });
});

describe('netDipole', () => {
  it('is 2 when the dipoles point the same way and 0 when they oppose', () => {
    expect(netDipole(0)).toBeCloseTo(2, 10);
    expect(netDipole(180)).toBeCloseTo(0, 8);
    expect(isPolar(180)).toBe(false);
    expect(isPolar(104.5)).toBe(true);
    expect(netDipole(104.5)).toBeGreaterThan(0);
  });
});

describe('metallic lattice', () => {
  it('slides only the top row and keeps all six cations', () => {
    const still = cationPositions(0);
    const sheared = cationPositions(1);
    expect(still.map((p) => p.x)).toEqual([0, 1, 2, 0, 1, 2]);
    expect(sheared.map((p) => p.x)).toEqual([1, 2, 3, 0, 1, 2]);
    expect(latticeHolds(1)).toBe(true);
    expect(electronsMoving(0)).toBe(false);
    expect(electronsMoving(0.4)).toBe(true);
  });
});

describe('water hydrogen bond', () => {
  it('appears only when an H points at the other oxygen, close enough', () => {
    const fixed = waterMolecule(0, 0, 0);
    const close = waterMolecule(1.9, 0, 180);
    const far = waterMolecule(3.2, 0, 180);
    // Bisectors point away from each other, so neither H aims at the other oxygen.
    const leftFacingOut = waterMolecule(0, 0, 180);
    const rightFacingOut = waterMolecule(1.9, 0, 0);
    expect(hydrogenBondBetween(fixed, close)).toBe(true);
    expect(hydrogenBondBetween(fixed, far)).toBe(false);
    expect(hydrogenBondBetween(leftFacingOut, rightFacingOut)).toBe(false);
  });
});

describe('material probes', () => {
  it('follows the school-model table, including the two "varies" cases', () => {
    expect(probeResult('ionic', 'conductSolid')).toBe('no');
    expect(probeResult('ionic', 'conductMelt')).toBe('yes');
    expect(probeResult('ionic', 'dissolve')).toBe('varies');
    expect(probeResult('metallic', 'conductSolid')).toBe('yes');
    expect(probeResult('metallic', 'meltEasy')).toBe('varies');
    expect(probeResult('network', 'conductSolid')).toBe('no');
    expect(probeResult('network', 'dissolve')).toBe('no');
    expect(probeResult('molecular', 'meltEasy')).toBe('yes');
    expect(probeResult('molecular', 'conductMelt')).toBe('no');
  });
});
