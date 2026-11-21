import { describe, expect, it } from 'vitest'
import { choiceConfig } from './config'

const least = { teams: ['Lions', 'Eagles'], packs: ['test'] }

describe('choiceConfig', () => {
  it('takes a game’s own defaults for any choice setting, keeping the limits, and its own for the rest', () => {
    const Config = choiceConfig({ seconds: 60, questions: 10, order: 'alphabetical' })
    expect(Config.parse(least)).toMatchObject({ seconds: 60, mode: 'questions', questions: 10, points: 1, order: 'alphabetical' })
    expect(choiceConfig().parse(least)).toMatchObject({ seconds: 30, mode: 'questions', questions: 1, points: 1, order: 'shuffle' })
    for (const change of [{ questions: 51 }, { seconds: 5 }, { points: 6 }]) expect(Config.safeParse({ ...least, ...change }).success).toBe(false)
  })
})
