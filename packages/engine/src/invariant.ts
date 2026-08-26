/* c8 ignore start -- assertion helpers: reached only when the engine is already broken */

/** Indexed access that states its assumption instead of widening the type. */
export function at<T>(items: readonly T[], index: number): T {
  const value = items[index]
  if (value === undefined) throw new Error(`index ${String(index)} is out of range`)
  return value
}

/* c8 ignore stop */
