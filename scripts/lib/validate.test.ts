import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { GameSchema } from './gameSchema'
import { checkPackFile, expectedSchemaLink } from './validate'

// A stand-in game schema, shaped like Charades': items are `{ text }` and the key is the text.
const schema: GameSchema = {
  itemSchema: z.strictObject({ text: z.string().min(1) }),
  itemKey: (item) => (item as { text: string }).text,
}

const file = 'src/games/test/content/animals.json'

/** A pack file's text: a valid pack with some fields changed. */
function packText(changes: Record<string, unknown> = {}): string {
  return JSON.stringify({
    $schema: expectedSchemaLink('test'),
    id: 'animals',
    name: 'Animals',
    description: 'Creatures great and small.',
    language: 'en',
    maturity: 'everyone',
    contributors: ['AdeizaSama'],
    items: [{ text: 'Elephant' }, { text: 'Penguin' }],
    ...changes,
  })
}

describe('checkPackFile', () => {
  it('reports the number of items in a valid pack', () => {
    expect(checkPackFile('test', file, packText(), schema)).toEqual({ items: 2, problems: [] })
  })

  it('reports a file that is not valid JSON, with where the mistake is', () => {
    const { items, problems } = checkPackFile('test', file, '{ "id": "animals", }', schema)
    expect(items).toBeNull()
    expect(problems).toHaveLength(1)
    expect(problems[0].path).toBe('')
    expect(problems[0].message).toMatch(/^Not valid JSON: .*position/)
  })

  it("checks $schema points at the game's JSON Schema, and allows leaving it out", () => {
    expect(checkPackFile('test', file, packText({ $schema: '../schemas/test.pack.schema.json' }), schema).problems).toEqual([
      { path: '$schema', message: 'Should be "../../../../schemas/test.pack.schema.json"' },
    ])
    expect(checkPackFile('test', file, packText({ $schema: undefined }), schema).problems).toEqual([])
  })

  it("names the item in a problem, using the game's item key", () => {
    const items = [{ text: 'Elephant' }, { text: 'Penguin', legs: 2 }]
    expect(checkPackFile('test', file, packText({ items }), schema).problems.map((problem) => problem.path)).toEqual([
      'items.1 ("Penguin")',
    ])
  })

  it('keeps the plain position when the item has no usable text', () => {
    const items = [{ text: 'Elephant' }, { text: '' }]
    expect(checkPackFile('test', file, packText({ items }), schema).problems.map((problem) => problem.path)).toEqual([
      'items.1.text',
    ])
  })

  it('runs the same checks as the app, such as the id matching the file name', () => {
    expect(checkPackFile('test', file, packText({ id: 'zoo' }), schema).problems.map((problem) => problem.path)).toEqual(['id'])
  })
})
