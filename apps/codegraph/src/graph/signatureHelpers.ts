/** Evenly spaced commit ticks for the cadence card drawing: count = min(commitsPerDay, 12). */
export function cadenceTicks(commitsPerDay: number): { ticks: number[]; publishAt: number } {
  const n = Math.min(Math.max(commitsPerDay, 0), 12);
  const ticks = Array.from({ length: n }, (_, i) => 12 + ((i + 0.5) / Math.max(n, 1)) * 176);
  return { ticks, publishAt: 188 };
}
