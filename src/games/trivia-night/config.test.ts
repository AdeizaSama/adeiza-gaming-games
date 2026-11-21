import { describe, expect, it } from 'vitest'
import { TriviaConfig } from './config'

const least = { teams: ['Lions', 'Eagles'], packs: ['back-to-school'] }

describe('Trivia Night settings', () => {
  it('plays one question a 30-second turn for 1 point, options shuffled, unless asked', () => {
    expect(TriviaConfig.parse(least)).toEqual({ ...least, rounds: 3, seconds: 30, tags: [], mode: 'questions', questions: 1, points: 1, order: 'shuffle' })
  })

  it('takes against the clock, 1 to 10 questions, 1 to 5 points and A to Z, and keeps the format’s turn limits', () => {
    const set = TriviaConfig.parse({ ...least, mode: 'clock', questions: 10, points: 5, order: 'alphabetical', seconds: 300 })
    expect([set.mode, set.questions, set.points, set.order, set.seconds]).toEqual(['clock', 10, 5, 'alphabetical', 300])
    for (const change of [{ questions: 0 }, { questions: 51 }, { points: 0 }, { points: 6 }, { points: 1.5 }, { order: 'random' }, { mode: 'steal' }, { seconds: 5 }, { seconds: 301 }]) {
      expect(TriviaConfig.safeParse({ ...least, ...change }).success, JSON.stringify(change)).toBe(false)
    }
  })
})
