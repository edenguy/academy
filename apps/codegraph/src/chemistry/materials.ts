/**
 * School-model answers for the four material types in the comparing lesson.
 * "varies" is a real answer: not every ionic compound dissolves easily, and metals
 * do not share one melting point. The network row is the diamond example
 * (it does not conduct). Graphite is called out in the lesson text, not in this table.
 */
export type MaterialId = 'ionic' | 'molecular' | 'metallic' | 'network';
export type ProbeId = 'conductSolid' | 'conductMelt' | 'dissolve' | 'meltEasy';
export type ProbeAnswer = 'yes' | 'no' | 'varies';

export const MATERIAL_TABLE: Record<MaterialId, Record<ProbeId, ProbeAnswer>> = {
  ionic: { conductSolid: 'no', conductMelt: 'yes', dissolve: 'varies', meltEasy: 'no' },
  molecular: { conductSolid: 'no', conductMelt: 'no', dissolve: 'varies', meltEasy: 'yes' },
  metallic: { conductSolid: 'yes', conductMelt: 'yes', dissolve: 'no', meltEasy: 'varies' },
  network: { conductSolid: 'no', conductMelt: 'no', dissolve: 'no', meltEasy: 'no' },
};

export function probeResult(material: MaterialId, probe: ProbeId): ProbeAnswer {
  return MATERIAL_TABLE[material][probe];
}
