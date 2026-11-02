import { describe, expect, it } from 'vitest'
import { CharadesConfig } from './config'

const required = { teams: ['Lions', 'Eagles'], packs: ['back-to-school'] }

/** Where the first problem is in some settings, or undefined if they're valid. */
function errorFor(settings: object): string | undefined {
  const result = CharadesConfig.safeParse({ ...required, ...settings })
  return result.success ? undefined : result.error.issues[0].path.join('.')
}

describe('Charades settings', () => {
  it('defaults to describe, with 2 for a describe, 3 for an act or a sing, and 1 off for a skip', () => {
    const config = CharadesConfig.parse(required)
    expect(config.mode).toBe('describe')
    expect(config.points).toEqual({ describe: 2, act: 3, sing: 3, skip: 1 })
    expect(config.rounds).toBe(3)
  })

  it('fills in the point values that are left out', () => {
    expect(CharadesConfig.parse({ ...required, points: { act: 5 } }).points).toEqual({ describe: 2, act: 5, sing: 3, skip: 1 })
  })

  it('accepts mix and rejects other modes', () => {
    expect(errorFor({ mode: 'mix' })).toBeUndefined()
    expect(errorFor({ mode: 'act' })).toBe('mode')
  })

  it('keeps points whole and between 1 and 5, and lets a skip cost nothing', () => {
    expect(errorFor({ points: { skip: 0 } })).toBeUndefined()
    expect(errorFor({ points: { describe: 0 } })).toBe('points.describe')
    expect(errorFor({ points: { sing: 6 } })).toBe('points.sing')
    expect(errorFor({ points: { act: 2.5 } })).toBe('points.act')
  })

  it('rejects unknown settings, like the format does', () => {
    expect(errorFor({ punishSkips: true })).toBe('')
    expect(errorFor({ points: { bonus: 1 } })).toBe('points')
  })
})
