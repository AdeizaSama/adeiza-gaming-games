import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { itemKey, itemSchema } from './schema'

/** Where the first problem is in an item, or undefined if it's valid. */
function errorFor(item: unknown): string | undefined {
  const result = itemSchema.safeParse(item)
  return result.success ? undefined : result.error.issues[0].path.join('.')
}

describe('Charades item schema', () => {
  it('needs only text, filling in no tags and describe-only', () => {
    expect(itemSchema.parse({ text: 'Puff puff' })).toEqual({ text: 'Puff puff', tags: [], modes: ['describe'] })
  })

  it('keeps tags and modes when they are given', () => {
    const item = { text: 'National Anthem', tags: ['ritual'], modes: ['describe', 'act', 'sing'] }
    expect(itemSchema.parse(item)).toEqual(item)
  })

  it('rejects blank text and text longer than 50 characters', () => {
    expect(errorFor({ text: '  ' })).toBe('text')
    expect(errorFor({ text: 'a'.repeat(50) })).toBeUndefined()
    expect(errorFor({ text: 'a'.repeat(51) })).toBe('text')
  })

  it('checks tags are kebab-case and not repeated', () => {
    expect(errorFor({ text: 'Suwe', tags: ['street-game'] })).toBeUndefined()
    expect(errorFor({ text: 'Suwe', tags: ['Street Game'] })).toBe('tags.0')
    expect(errorFor({ text: 'Suwe', tags: ['game', 'game'] })).toBe('tags')
  })

  it('accepts only describe, act and sing as modes, at least one, not repeated', () => {
    expect(errorFor({ text: 'Suwe', modes: ['act'] })).toBeUndefined()
    expect(errorFor({ text: 'Suwe', modes: ['mime'] })).toBe('modes.0')
    expect(errorFor({ text: 'Suwe', modes: [] })).toBe('modes')
    expect(errorFor({ text: 'Suwe', modes: ['act', 'act'] })).toBe('modes')
  })

  it('rejects an unknown field, such as the old available_types', () => {
    expect(itemSchema.safeParse({ text: 'Suwe', available_types: ['describe'] }).error?.issues[0].code).toBe(
      'unrecognized_keys',
    )
  })

  it('identifies an item by its text', () => {
    expect(itemKey({ text: 'Gala', tags: ['snack'], modes: ['act'] })).toBe('Gala')
  })
})

describe('Charades packs', () => {
  // The same call the game will make, so this checks the real files the way the app loads them.
  const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)

  it('all pass the pack checks', () => {
    expect(packs.map((pack) => pack.id)).toContain('back-to-school')
  })
})
