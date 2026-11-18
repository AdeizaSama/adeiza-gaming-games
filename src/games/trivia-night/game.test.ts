import { describe, expect, it } from 'vitest'
import { presetSettings } from '../../sdk/game/settings'
import { TriviaConfig } from './config'
import triviaNight from './index'
import { machine } from './machine'
import { TurnView } from './views/TurnView'

describe('Trivia Night game definition', () => {
  it('is a valid game with the Back to School pack, its settings, a preset per way to play, and one view for turn and result', () => {
    expect(triviaNight.meta.id).toBe('trivia-night')
    expect(triviaNight.content.packs.map((pack) => pack.id)).toContain('back-to-school')
    expect(triviaNight.machine).toBe(machine)
    expect(triviaNight.config.schema).toBe(TriviaConfig)
    expect(triviaNight.views.turn).toBe(TurnView)
    expect(triviaNight.views.reveal).toBe(TurnView)
    expect(triviaNight.rules).toContain('## Ways to play')
    const ways = triviaNight.config.presets!.map((preset) => {
      const { mode, questions, seconds } = presetSettings(TriviaConfig, preset, { packs: ['back-to-school'], tags: [] })
      return [preset.name, mode, questions, seconds]
    })
    expect(ways).toEqual([
      ['One question', 'questions', 1, 30],
      ['Five questions', 'questions', 5, 120],
      ['Against the clock', 'clock', 1, 60],
    ])
  })
})
