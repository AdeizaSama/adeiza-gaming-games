import { describe, expect, it } from 'vitest'
import { PairsConfig } from './config'

const least = { teams: ['Lions', 'Eagles'], packs: ['francais-anglais'] }

describe('Pairs settings', () => {
  it('plays two-way flip cards, ten a 60-second turn, unless asked, and takes 1 to 50 cards and the three ways to play', () => {
    expect(PairsConfig.parse(least)).toEqual({ ...least, rounds: 3, seconds: 60, tags: [], play: 'flip', twoWay: true, cards: 10 })
    expect(PairsConfig.parse({ ...least, play: 'odd', twoWay: false, cards: 50 })).toMatchObject({ play: 'odd', twoWay: false, cards: 50 })
    for (const change of [{ cards: 0 }, { cards: 51 }, { play: 'snap' }, { twoWay: 'yes' }]) {
      expect(PairsConfig.safeParse({ ...least, ...change }).success, JSON.stringify(change)).toBe(false)
    }
    expect(PairsConfig.safeParse({ ...least, teams: ['You'], solo: true, timer: false }).success).toBe(true) // Free Play
  })
})
