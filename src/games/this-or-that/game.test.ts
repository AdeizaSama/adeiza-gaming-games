import { describe, expect, it } from 'vitest'
import { presetSettings } from '../../sdk/game/settings'
import { ThisOrThatConfig } from './config'
import thisOrThat, { TurnView } from './index'
import { machine } from './machine'

describe('This or That game definition', () => {
  it('is a valid game with Masculin ou féminin ?, the choice turn’s views, and a preset per way to play', () => {
    expect(thisOrThat.meta.id).toBe('this-or-that')
    expect(thisOrThat.content.packs.map((pack) => pack.id)).toEqual(['masculin-feminin'])
    expect(thisOrThat.machine).toBe(machine)
    expect(thisOrThat.config.schema).toBe(ThisOrThatConfig)
    expect([thisOrThat.views.turn, thisOrThat.views.reveal]).toEqual([TurnView, TurnView])
    expect(thisOrThat.rules).toContain('## Ways to play')
    const ways = thisOrThat.config.presets!.map((preset) => {
      const { mode, questions, seconds, order } = presetSettings(ThisOrThatConfig, preset, { packs: ['masculin-feminin'], tags: [] })
      return [preset.name, mode, questions, seconds, order]
    })
    expect(ways).toEqual([
      ['Ten words', 'questions', 10, 60, 'alphabetical'],
      ['Against the clock', 'clock', 10, 60, 'alphabetical'],
    ])
  })
})
