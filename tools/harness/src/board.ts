/** Columns for a board of n tiles. A view concern, which is why it is not in the engine. */
export function columnsFor(n: number): number {
  if (n <= 4) return 2
  if (n <= 9) return 3
  if (n <= 12) return 4
  return 5
}
