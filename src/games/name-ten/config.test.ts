import { describe, expect, it } from 'vitest'
import { NameTenConfig } from './config'

const least = { teams: ['Lions', 'Eagles'], packs: ['back-to-school'] }

describe('Name Ten settings', () => {
  it('puts 10 answers on the board unless asked, with the format’s defaults for the rest', () => {
    expect(NameTenConfig.parse(least)).toEqual({ ...least, rounds: 3, seconds: 60, tags: [], shown: 10 })
  })

  it('takes 10 to 15 answers on the board, in whole numbers', () => {
    expect(NameTenConfig.parse({ ...least, shown: 15 }).shown).toBe(15)
    for (const shown of [9, 16, 12.5]) expect(NameTenConfig.safeParse({ ...least, shown }).success, String(shown)).toBe(false)
  })
})
