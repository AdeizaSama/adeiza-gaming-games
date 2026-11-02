import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { TeamTurnsConfig } from '../formats/team-turns/config'
import { defaultSettings, matchesPreset, presetSettings } from './settings'

// The format's settings plus one of the game's own, nested like Charades' points.
const schema = TeamTurnsConfig.extend({ bonus: z.strictObject({ got: z.int().min(1).default(1) }).prefault({}) })
const quick = { config: { rounds: 1, seconds: 30 } }
const animals = { config: { seconds: 90 }, packs: ['animals', 'food'] }

describe('settings and presets', () => {
  it('defaultSettings: the schema’s defaults for these packs, without teams', () => {
    expect(defaultSettings(schema, ['food'])).toEqual({ rounds: 3, seconds: 60, packs: ['food'], tags: [], bonus: { got: 1 } })
  })

  it('presetSettings: the defaults plus the preset’s changes, undoing players’ own changes, keeping packs and tags', () => {
    const current = { ...defaultSettings(schema, ['food']), rounds: 5, tags: ['fruit'], bonus: { got: 3 } }
    expect(presetSettings(schema, quick, current)).toEqual({ rounds: 1, seconds: 30, packs: ['food'], tags: ['fruit'], bonus: { got: 1 } })
  })

  it('presetSettings: uses the preset’s packs when it names some', () => {
    const current = { ...defaultSettings(schema, ['food']), tags: ['fruit'] }
    expect(presetSettings(schema, animals, current)).toMatchObject({ seconds: 90, packs: ['animals', 'food'], tags: ['fruit'] })
  })

  it('matchesPreset: only while every setting is the preset’s, whatever the packs and tags', () => {
    const applied = presetSettings(schema, quick, defaultSettings(schema, ['food']))
    expect(matchesPreset(schema, quick, applied)).toBe(true)
    expect(matchesPreset(schema, quick, { ...applied, packs: ['animals'], tags: ['fruit'] })).toBe(true)
    expect(matchesPreset(schema, quick, { ...applied, rounds: 2 })).toBe(false)
    expect(matchesPreset(schema, quick, { ...applied, bonus: { got: 2 } })).toBe(false)
    expect(matchesPreset(schema, quick, defaultSettings(schema, ['food']))).toBe(false)
  })

  it('matchesPreset: compares packs, in any order, when the preset names some', () => {
    const applied = presetSettings(schema, animals, defaultSettings(schema, ['food']))
    expect(matchesPreset(schema, animals, { ...applied, packs: ['food', 'animals'] })).toBe(true)
    expect(matchesPreset(schema, animals, { ...applied, packs: ['food'] })).toBe(false)
  })
})
