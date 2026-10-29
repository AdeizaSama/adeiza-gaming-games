import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import { TeamTurnsConfig, type TeamTurnsSetup } from './config'

// The least a setup screen sends: everything else has a default.
const minimal = { teams: ['Lions', 'Eagles'], packs: ['back-to-school'] }

/** Where the first problem is (e.g. `"teams.1"`) in the minimal setup with some fields changed, or undefined if it's valid. */
function errorFor(changes: Record<string, unknown>): string | undefined {
  const result = TeamTurnsConfig.safeParse({ ...minimal, ...changes })
  return result.success ? undefined : result.error.issues[0].path.join('.')
}

describe('TeamTurnsConfig', () => {
  it('fills in 3 rounds, 60 seconds and no tag filter', () => {
    expect(TeamTurnsConfig.parse(minimal)).toEqual({ ...minimal, rounds: 3, seconds: 60, tags: [] })
  })

  it('keeps every setting that is given', () => {
    const full = { teams: ['A', 'B', 'C'], rounds: 5, seconds: 90, packs: ['anime', 'movies'], tags: ['snack'] }
    expect(TeamTurnsConfig.parse(full)).toEqual(full)
  })

  it('needs 2 to 10 teams', () => {
    expect(errorFor({ teams: ['Solo'] })).toBe('teams')
    expect(errorFor({ teams: Array.from({ length: 10 }, (_, i) => `Team ${i + 1}`) })).toBeUndefined()
    expect(errorFor({ teams: Array.from({ length: 11 }, (_, i) => `Team ${i + 1}`) })).toBe('teams')
  })

  it('trims team names and rejects blank or long ones', () => {
    expect(TeamTurnsConfig.parse({ ...minimal, teams: ['  Lions ', 'Eagles'] }).teams).toEqual(['Lions', 'Eagles'])
    expect(errorFor({ teams: ['Lions', '   '] })).toBe('teams.1')
    expect(errorFor({ teams: ['Lions', 'x'.repeat(20)] })).toBeUndefined()
    expect(errorFor({ teams: ['Lions', 'x'.repeat(21)] })).toBe('teams.1')
  })

  it('rejects two teams with the same name, ignoring case and spaces, pointing at the second', () => {
    expect(errorFor({ teams: ['Lions', 'Eagles', ' lions'] })).toBe('teams.2')
  })

  it('accepts whole numbers of rounds from 1 to 10 and seconds from 10 to 300', () => {
    for (const rounds of [1, 10]) expect(errorFor({ rounds }), `rounds ${rounds}`).toBeUndefined()
    for (const rounds of [0, 11, 2.5]) expect(errorFor({ rounds }), `rounds ${rounds}`).toBe('rounds')
    for (const seconds of [10, 300]) expect(errorFor({ seconds }), `seconds ${seconds}`).toBeUndefined()
    for (const seconds of [9, 301, 60.5]) expect(errorFor({ seconds }), `seconds ${seconds}`).toBe('seconds')
  })

  it('needs at least one pack, with pack ids written as in pack files, not repeated', () => {
    expect(errorFor({ packs: [] })).toBe('packs')
    expect(errorFor({ packs: ['Back To School'] })).toBe('packs.0')
    expect(errorFor({ packs: ['anime', 'anime'] })).toBe('packs')
  })

  it('checks tags are kebab-case and not repeated', () => {
    expect(errorFor({ tags: ['tv-show'] })).toBeUndefined()
    expect(errorFor({ tags: ['TV Show'] })).toBe('tags.0')
    expect(errorFor({ tags: ['snack', 'snack'] })).toBe('tags')
  })

  it('rejects an unknown setting, such as a typo', () => {
    const result = TeamTurnsConfig.safeParse({ ...minimal, second: 90 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].code).toBe('unrecognized_keys')
  })

  it('can be extended with a game’s own settings and stays strict', () => {
    const CharadesLike = TeamTurnsConfig.extend({ punishSkips: z.boolean().default(false) })
    expect(CharadesLike.parse(minimal).punishSkips).toBe(false)
    expect(CharadesLike.safeParse({ ...minimal, punishSkip: true }).success).toBe(false)
  })

  it('types settings with defaults filled in, and the setup input with them optional', () => {
    expectTypeOf<TeamTurnsConfig>().toEqualTypeOf<{
      teams: string[]
      rounds: number
      seconds: number
      packs: string[]
      tags: string[]
    }>()
    expectTypeOf(minimal).toExtend<TeamTurnsSetup>()
  })
})
