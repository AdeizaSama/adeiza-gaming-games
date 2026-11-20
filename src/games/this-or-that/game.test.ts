import { describe, expect, it } from 'vitest'
import { ThisOrThatConfig } from './config'
import thisOrThat, { TurnView } from './index'
import { machine } from './machine'

describe('This or That game definition', () => {
  it('is a valid game with Masculin ou féminin ? and the choice turn’s views', () => {
    expect(thisOrThat.meta.id).toBe('this-or-that')
    expect(thisOrThat.content.packs.map((pack) => pack.id)).toEqual(['masculin-feminin'])
    expect(thisOrThat.machine).toBe(machine)
    expect(thisOrThat.config.schema).toBe(ThisOrThatConfig)
    expect([thisOrThat.views.turn, thisOrThat.views.reveal]).toEqual([TurnView, TurnView])
    expect(thisOrThat.rules).toContain('## Ways to play')
  })
})
