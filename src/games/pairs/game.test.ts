import { describe, expect, it } from 'vitest'
import { variantSettings } from '../../sdk/game/settings'
import { PairsConfig } from './config'
import pairs from './index'
import { machine } from './machine'
import { pairsFreePlay } from './views/SettingsView'
import { TurnView } from './views/TurnView'

describe('Pairs game definition', () => {
  it('is a valid game with both French packs, its settings and Free Play, and one view for card and answer', () => {
    expect(pairs.meta.id).toBe('pairs')
    expect(pairs.content.packs.map((pack) => pack.id)).toEqual(['francais-anglais', 'les-themes'])
    expect(pairs.machine).toBe(machine)
    expect(pairs.config.schema).toBe(PairsConfig)
    expect(pairs.config.freePlay).toBe(pairsFreePlay)
    expect([pairs.views.turn, pairs.views.reveal]).toEqual([TurnView, TurnView])
    expect(pairs.rules).toContain('## Odd one out')
  })

  it('has a variant for each way to play, each on the pack that suits it, and each with Free Play', () => {
    const ways = pairs.variants.map((variant) => {
      const { play, twoWay, packs } = variantSettings(PairsConfig, variant)
      return [variant.id, play, twoWay, packs, variant.freePlay]
    })
    expect(ways).toEqual([
      ['french-flash-cards', 'flip', true, ['francais-anglais'], true],
      ['french-match-up', 'match', true, ['francais-anglais'], true],
      ['l-intrus', 'odd', false, ['les-themes'], true],
    ])
  })
})
