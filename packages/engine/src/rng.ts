import type { RngState } from './types.js'

/**
 * mulberry32. Chosen for being 32 bits of state, so RngState stays plain JSON and a
 * whole game remains reproducible from a single integer seed.
 */
export function seedRng(seed: number): RngState {
  return { seed: seed >>> 0 }
}

export function nextUint32(state: RngState): [number, RngState] {
  const advanced = (state.seed + 0x6d2b79f5) >>> 0
  let t = advanced
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [(t ^ (t >>> 14)) >>> 0, { seed: advanced }]
}

export function nextFloat(state: RngState): [number, RngState] {
  const [value, next] = nextUint32(state)
  return [value / 0x1_0000_0000, next]
}

/** Uniform in [0, boundExclusive). */
export function nextInt(state: RngState, boundExclusive: number): [number, RngState] {
  if (boundExclusive <= 0) throw new RangeError('bound must be positive')
  const [value, next] = nextUint32(state)
  return [value % boundExclusive, next]
}

/** Fisher-Yates. Returns a new array; the input is untouched. */
export function shuffle<T>(state: RngState, items: readonly T[]): [T[], RngState] {
  const out = [...items]
  let rng = state
  for (let i = out.length - 1; i > 0; i--) {
    const [j, next] = nextInt(rng, i + 1)
    rng = next
    const a = out[i] as T
    const b = out[j] as T
    out[i] = b
    out[j] = a
  }
  return [out, rng]
}
