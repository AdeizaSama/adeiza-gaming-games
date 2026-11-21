import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { TeamTurnsConfig } from '../formats/team-turns/config'
import { defaultSettings, isOpen, openableSettings, variantSettings, withOpenChanges } from './settings'

// The format's settings plus one of the game's own, nested like Charades' points.
const schema = TeamTurnsConfig.extend({ bonus: z.strictObject({ got: z.int().min(1).default(1) }).prefault({}) })
const quick = { settings: { rounds: 1, seconds: 30 }, packs: ['food'], tags: ['fruit'] }

describe('settings and variants', () => {
  it('defaultSettings: the schema’s defaults for these packs, without teams', () => {
    expect(defaultSettings(schema, ['food'])).toEqual({ rounds: 3, seconds: 60, packs: ['food'], tags: [], bonus: { got: 1 } })
  })

  it('openableSettings: every setting but teams, packs and tags', () => {
    expect(openableSettings(schema, ['food'])).toEqual(['rounds', 'seconds', 'bonus'])
  })

  it('variantSettings: the defaults plus the variant’s changes, packs and tags, and throws on settings that fail', () => {
    expect(variantSettings(schema, quick)).toEqual({ rounds: 1, seconds: 30, packs: ['food'], tags: ['fruit'], bonus: { got: 1 } })
    expect(() => variantSettings(schema, { ...quick, settings: { seconds: 5 } })).toThrow()
  })

  it('withOpenChanges: takes players’ changes to open settings only, never packs or tags', () => {
    const base = variantSettings(schema, quick)
    const changes = { rounds: 5, seconds: 90, packs: ['animals'], tags: [], bonus: { got: 3 } }
    expect(withOpenChanges(base, changes, ['rounds', 'packs'])).toEqual({ ...base, rounds: 5 })
    expect(withOpenChanges(base, changes, [])).toEqual(base)
  })

  it('isOpen: every setting on a game’s own setup, only the open ones on a variant’s', () => {
    expect(isOpen(undefined, 'mode')).toBe(true)
    expect([isOpen(['rounds'], 'rounds'), isOpen(['rounds'], 'mode')]).toEqual([true, false])
  })
})
