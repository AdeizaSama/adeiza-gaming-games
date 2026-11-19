import { describe, expect, it } from 'vitest'
import { ThisOrThatConfig } from './config'

const least = { teams: ['Lions', 'Eagles'], packs: ['masculin-feminin'] }

describe('This or That settings', () => {
  it('plays ten questions a 60-second turn for 1 point, options A to Z, unless asked', () => {
    expect(ThisOrThatConfig.parse(least)).toEqual({
      ...least,
      rounds: 3,
      seconds: 60,
      tags: [],
      mode: 'questions',
      questions: 10,
      points: 1,
      order: 'alphabetical',
    })
  })
})
