import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { nextFloat, nextInt, nextUint32, seedRng, shuffle } from '../src/index.js'

describe('rng', () => {
  it('normalizes seeds to unsigned 32 bits', () => {
    expect(seedRng(-1).seed).toBe(0xffffffff)
    expect(seedRng(7).seed).toBe(7)
  })

  it('is a pure function of its state', () => {
    const state = seedRng(42)
    expect(nextUint32(state)).toEqual(nextUint32(state))
  })

  it('advances so successive draws differ', () => {
    const [first, next] = nextUint32(seedRng(42))
    const [second] = nextUint32(next)
    expect(first).not.toBe(second)
  })

  it('produces floats in [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const [value] = nextFloat(seedRng(seed))
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }),
    )
  })

  it('produces integers inside the bound', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 1, max: 1000 }), (seed, bound) => {
        const [value] = nextInt(seedRng(seed), bound)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(bound)
      }),
    )
  })

  it('rejects a non-positive bound', () => {
    expect(() => nextInt(seedRng(1), 0)).toThrow(RangeError)
    expect(() => nextInt(seedRng(1), -3)).toThrow(RangeError)
  })

  describe('shuffle', () => {
    it('returns a permutation and leaves the input alone', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.array(fc.integer(), { minLength: 1, maxLength: 20 }),
          (seed, items) => {
            const original = [...items]
            const [out] = shuffle(seedRng(seed), items)
            expect(items).toEqual(original)
            expect([...out].sort((a, b) => a - b)).toEqual([...items].sort((a, b) => a - b))
          },
        ),
      )
    })

    it('is deterministic for a seed', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8]
      expect(shuffle(seedRng(9), items)).toEqual(shuffle(seedRng(9), items))
    })

    it('handles empty and single-element inputs', () => {
      expect(shuffle(seedRng(1), [])[0]).toEqual([])
      expect(shuffle(seedRng(1), ['a'])[0]).toEqual(['a'])
    })

    it('actually reorders something', () => {
      const items = Array.from({ length: 12 }, (_, i) => i)
      const [out] = shuffle(seedRng(5), items)
      expect(out).not.toEqual(items)
    })
  })
})
