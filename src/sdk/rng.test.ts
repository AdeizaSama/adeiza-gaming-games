import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

function draws(seed: number, count: number): number[] {
  const rng = createRng(seed)
  return Array.from({ length: count }, () => rng.next())
}

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    expect(draws(42, 5)).toEqual(draws(42, 5))
  })

  it('gives a different sequence for a different seed', () => {
    expect(draws(42, 5)).not.toEqual(draws(43, 5))
  })

  // Pins the algorithm. If this fails, every saved game and seeded test would replay differently.
  it('produces the known mulberry32 values for seed 42', () => {
    expect(draws(42, 3)).toEqual([0.6011037519201636, 0.44829055899754167, 0.8524657934904099])
  })

  it('continues the same sequence from a saved state', () => {
    const original = createRng(7)
    original.next()
    original.next()
    const resumed = createRng(original.getState())
    expect(resumed.next()).toBe(original.next())
    expect(resumed.next()).toBe(original.next())
  })
})

describe('next', () => {
  it('stays between 0 (inclusive) and 1 (exclusive)', () => {
    for (const value of draws(1, 10_000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('int', () => {
  it('stays within min and max, and reaches both', () => {
    const rng = createRng(1)
    const seen = new Set<number>()
    for (let i = 0; i < 1_000; i++) seen.add(rng.int(1, 6))
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('returns min when min equals max', () => {
    expect(createRng(1).int(3, 3)).toBe(3)
  })

  it('rejects min greater than max', () => {
    expect(() => createRng(1).int(6, 1)).toThrow(RangeError)
  })

  it('rejects numbers that are not whole', () => {
    expect(() => createRng(1).int(0, 2.5)).toThrow(RangeError)
  })
})

describe('shuffle', () => {
  const items = ['a', 'b', 'c', 'd', 'e']

  it('keeps every item exactly once', () => {
    expect(createRng(1).shuffle(items).sort()).toEqual(items)
  })

  it('does not change the original array', () => {
    const original = [...items]
    createRng(1).shuffle(items)
    expect(items).toEqual(original)
  })

  it('gives the same order for the same seed', () => {
    expect(createRng(42).shuffle(items)).toEqual(createRng(42).shuffle(items))
  })

  it('handles empty and single-item arrays', () => {
    expect(createRng(1).shuffle([])).toEqual([])
    expect(createRng(1).shuffle(['a'])).toEqual(['a'])
  })
})
