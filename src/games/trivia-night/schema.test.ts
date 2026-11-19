import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { itemKey, itemSchema } from './schema'

const question = { question: 'What is the capital of Nigeria?', options: ['Abuja', 'Lagos', 'Kano', 'Ibadan'], answer: 'Abuja' }

/** Where each problem in an item is, e.g. `options.2`. */
function problems(item: unknown): string[] {
  const result = itemSchema.safeParse(item)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('Trivia Night item schema', () => {
  it('needs a question, its options and the answer, filling in no tags', () => {
    expect(itemSchema.parse(question)).toEqual({ ...question, tags: [] })
  })

  it('checks the options with the SDK’s rules, and the answer is one of them', () => {
    expect(problems({ ...question, options: ['Abuja'] })).toEqual(['options'])
    expect(problems({ ...question, options: ['Abuja', 'Lagos', 'abuja'] })).toEqual(['options.2'])
    expect(problems({ ...question, answer: 'Port Harcourt' })).toEqual(['answer'])
  })

  it('keeps the question to 150 characters, checks tags, and rejects an unknown field', () => {
    expect(problems({ ...question, question: 'a'.repeat(151) })).toEqual(['question'])
    expect(problems({ ...question, tags: ['Maths'] })).toEqual(['tags.0'])
    expect(problems({ ...question, difficulty: 'easy' })).toHaveLength(1)
  })

  it('takes an optional subtitle of up to 100 characters', () => {
    expect(itemSchema.parse({ ...question, subtitle: 'Hint: not Lagos' }).subtitle).toBe('Hint: not Lagos')
    expect(problems({ ...question, subtitle: 'a'.repeat(101) })).toEqual(['subtitle'])
    expect(problems({ ...question, subtitle: ' ' })).toEqual(['subtitle'])
  })

  it('names a question by its wording', () => {
    expect(itemKey({ ...question, tags: [] })).toBe('What is the capital of Nigeria?')
  })
})

describe('Trivia Night content', () => {
  it('ships a valid Back to School pack, every question tagged with its subject', () => {
    const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
    const pack = packs.find((candidate) => candidate.id === 'back-to-school')!
    expect(pack.items.length).toBeGreaterThanOrEqual(100)
    const subjects = ['maths', 'science', 'social-studies', 'entertainment', 'general']
    for (const item of pack.items) expect(item.tags.filter((tag) => subjects.includes(tag)), item.question).toHaveLength(1)
  })
})
