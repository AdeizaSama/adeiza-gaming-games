import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { itemKey, itemSchema } from './schema'

const question = { question: 'chaise', subtitle: 'chair', options: ['Masculin', 'Féminin'], answer: 'Féminin' }

/** Where each problem in an item is, e.g. `options`. */
function problems(item: unknown): string[] {
  const result = itemSchema.safeParse(item)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('This or That item schema', () => {
  it('needs a question with exactly two options and the answer, filling in no tags', () => {
    expect(itemSchema.parse(question)).toEqual({ ...question, tags: [] })
    expect(problems({ ...question, options: ['Masculin', 'Féminin', 'Neutre'] })).toEqual(['options'])
    expect(problems({ ...question, options: ['Masculin'] })).toContain('options')
  })

  it('uses the SDK’s rules for the rest: the answer is an option, the subtitle is optional', () => {
    expect(problems({ ...question, answer: 'Neutre' })).toEqual(['answer'])
    expect(itemSchema.safeParse({ ...question, subtitle: undefined }).success).toBe(true)
    expect(itemKey({ ...question, tags: [] })).toBe('chaise')
  })
})

describe('This or That content', () => {
  const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
  const pack = packs.find((candidate) => candidate.id === 'masculin-feminin')!

  it('ships Masculin ou féminin ?: French words, each with its meaning, the same two options, and both answers often', () => {
    expect(pack.name).toBe('Masculin ou féminin ?')
    expect(pack.language).toBe('fr')
    expect(pack.items.length).toBeGreaterThanOrEqual(200)
    for (const item of pack.items) {
      expect(item.options, item.question).toEqual(['Masculin', 'Féminin'])
      expect(item.subtitle, item.question).toBeDefined()
      expect(item.tags.filter((tag) => tag === 'noun' || tag === 'adjective'), item.question).toHaveLength(1)
    }
    const feminine = pack.items.filter((item) => item.answer === 'Féminin').length / pack.items.length
    expect(feminine).toBeGreaterThan(0.4)
    expect(feminine).toBeLessThan(0.6)
  })

  it('never shows an article, which would give the answer away', () => {
    for (const item of pack.items) expect(item.question, item.question).not.toMatch(/^((le|la|les|un|une) |l')/i)
  })
})
