import { describe, expect, it } from 'vitest'
import { choiceFreePlay } from '../../sdk/formats/team-turns/choice/FreePlayView'
import { variantSettings } from '../../sdk/game/settings'
import { TriviaConfig } from './config'
import triviaNight, { TurnView } from './index'
import { machine } from './machine'

describe('Trivia Night game definition', () => {
  it('is a valid game with the Back to School pack, its settings and one view for turn and result', () => {
    expect(triviaNight.meta.id).toBe('trivia-night')
    expect(triviaNight.content.packs.map((pack) => pack.id)).toContain('back-to-school')
    expect(triviaNight.machine).toBe(machine)
    expect(triviaNight.config.schema).toBe(TriviaConfig)
    expect(triviaNight.views.turn).toBe(TurnView)
    expect(triviaNight.views.reveal).toBe(TurnView)
    expect(triviaNight.rules).toContain('## Ways to play')
  })

  it('has Back to School Trivia, Conjugaison française (ten verbs in 90 s, shuffled) and Masculin ou féminin ? (ten words a minute, A to Z), the French ones Set questions only; all offer Free Play', () => {
    expect(triviaNight.variants.map((variant) => variant.id)).toEqual(['back-to-school', 'conjugaison', 'masculin-feminin'])
    const [, verbs, words] = triviaNight.variants
    expect(variantSettings(TriviaConfig, verbs)).toMatchObject({ mode: 'questions', questions: 10, seconds: 90, order: 'shuffle', packs: ['conjugaison'] })
    expect(variantSettings(TriviaConfig, words)).toMatchObject({ mode: 'questions', questions: 10, seconds: 60, order: 'alphabetical', packs: ['masculin-feminin'] })
    for (const french of [verbs, words]) expect(french.open).not.toContain('mode')
    // All can be played alone (ADR 0019).
    expect(triviaNight.config.freePlay).toBe(choiceFreePlay)
    expect(triviaNight.variants.map((variant) => variant.freePlay)).toEqual([true, true, true])
  })
})
