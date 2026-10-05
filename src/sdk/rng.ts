/**
 * A seeded random number generator. The same seed always gives the same sequence,
 * so games are repeatable in tests and a saved game continues with the same draws after a refresh.
 *
 * Games never create one. The runner creates it from the saved state, passes it to actions,
 * and saves `getState()` afterwards.
 */
export interface Rng {
  /** A number from 0 (inclusive) to 1 (exclusive). */
  next(): number
  /** A whole number from `min` to `max`, both inclusive. */
  int(min: number, max: number): number
  /** A shuffled copy of `items`. The original is not changed. */
  shuffle<T>(items: readonly T[]): T[]
  /** The current position in the sequence. Pass it to `createRng` to continue from here. */
  getState(): number
}

/**
 * Creates an Rng from a seed, or from a state saved with `getState()`. They're the same thing:
 * a seed is just the state the sequence starts from.
 *
 * Uses mulberry32: tiny, fast, and its whole state is one 32-bit number, which makes it easy to save.
 * Fine for shuffling cards; not for anything security-related.
 */
export function createRng(seed: number): Rng {
  // `>>> 0` turns any number into a whole number from 0 to 2^32 - 1, the range mulberry32 works in.
  let state = seed >>> 0

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new RangeError(`int(${min}, ${max}): min and max must be whole numbers with min <= max`)
    }
    return min + Math.floor(next() * (max - min + 1))
  }

  // Fisher–Yates: walk backwards, swapping each item with a random one at or before it.
  // Every order is equally likely.
  function shuffle<T>(items: readonly T[]): T[] {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i--) {
      const j = int(0, i)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  return { next, int, shuffle, getState: () => state }
}
