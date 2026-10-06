import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import { packSchema, type Pack } from './pack'

// A tiny item schema standing in for a real game's.
const TestItem = z.strictObject({ text: z.string().min(1) })
const TestPack = packSchema(TestItem)

const valid = {
  id: 'animals',
  name: 'Animals',
  description: 'Creatures great and small.',
  language: 'en',
  maturity: 'everyone',
  contributors: ['AdeizaSama'],
  items: [{ text: 'Elephant' }, { text: 'Penguin' }],
}

/** Where the first problem is (e.g. `"items.1.text"`) in a pack with some fields changed, or undefined if it's valid. */
function errorFor(changes: Record<string, unknown>): string | undefined {
  const result = TestPack.safeParse({ ...valid, ...changes })
  return result.success ? undefined : result.error.issues[0].path.join('.')
}

describe('packSchema', () => {
  it('accepts a valid pack', () => {
    expect(TestPack.parse(valid)).toEqual(valid)
  })

  it('accepts a $schema path for editors', () => {
    expect(errorFor({ $schema: '../../../../schemas/test.pack.schema.json' })).toBeUndefined()
  })

  it('rejects an unknown field, such as a typo', () => {
    const result = TestPack.safeParse({ ...valid, maturty: 'teen' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].code).toBe('unrecognized_keys')
  })

  it('rejects a missing field', () => {
    expect(errorFor({ description: undefined })).toBe('description')
  })

  it('checks the id is kebab-case', () => {
    expect(errorFor({ id: 'movies-90s' })).toBeUndefined()
    for (const id of ['Movies', 'movies_90s', 'movies--90s', '-movies', 'movies-', '']) {
      expect(errorFor({ id }), id).toBe('id')
    }
  })

  it('rejects a blank name or description', () => {
    expect(errorFor({ name: '   ' })).toBe('name')
    expect(errorFor({ description: '' })).toBe('description')
  })

  it('checks the language code', () => {
    for (const language of ['en', 'en-GB', 'pt-BR', 'yo', 'zh-Hans']) {
      expect(errorFor({ language }), language).toBeUndefined()
    }
    for (const language of ['English', 'EN', 'e', 'en_GB', '']) {
      expect(errorFor({ language }), language).toBe('language')
    }
  })

  it('accepts only the three maturity levels', () => {
    for (const maturity of ['everyone', 'teen', 'adult']) {
      expect(errorFor({ maturity }), maturity).toBeUndefined()
    }
    expect(errorFor({ maturity: 'kids' })).toBe('maturity')
  })

  it('needs at least one contributor, each a GitHub username', () => {
    expect(errorFor({ contributors: ['AdeizaSama', 'some-one'] })).toBeUndefined()
    expect(errorFor({ contributors: [] })).toBe('contributors')
    expect(errorFor({ contributors: ['@AdeizaSama'] })).toBe('contributors.0')
    expect(errorFor({ contributors: ['two words'] })).toBe('contributors.0')
    expect(errorFor({ contributors: ['a'.repeat(40)] })).toBe('contributors.0')
  })

  it("checks each item against the game's item schema", () => {
    expect(errorFor({ items: [{ text: 'Elephant' }, { text: '' }] })).toBe('items.1.text')
    expect(errorFor({ items: [{ text: 'Elephant', extra: true }] })).toBe('items.0')
  })

  it('needs at least one item', () => {
    expect(errorFor({ items: [] })).toBe('items')
  })

  it('gives packs the Pack<Item> type', () => {
    expectTypeOf<z.infer<typeof TestPack>>().toEqualTypeOf<Pack<{ text: string }>>()
  })
})
