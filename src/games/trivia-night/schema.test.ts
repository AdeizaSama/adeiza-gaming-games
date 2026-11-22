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
  const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
  const french = packs.find((candidate) => candidate.id === 'masculin-feminin')!

  it('ships Masculin ou féminin ?: French words, each with its meaning, the same two options, and both answers often', () => {
    expect(french.name).toBe('Masculin ou féminin ?')
    expect(french.language).toBe('fr')
    expect(french.items.length).toBeGreaterThanOrEqual(200)
    for (const item of french.items) {
      expect(item.options, item.question).toEqual(['Masculin', 'Féminin'])
      expect(item.subtitle, item.question).toBeDefined()
      expect(item.tags.filter((tag) => tag === 'noun' || tag === 'adjective'), item.question).toHaveLength(1)
    }
    const feminine = french.items.filter((item) => item.answer === 'Féminin').length / french.items.length
    expect(feminine).toBeGreaterThan(0.4)
    expect(feminine).toBeLessThan(0.6)
  })

  it('never shows an article in Masculin ou féminin ?, which would give the answer away', () => {
    for (const item of french.items) expect(item.question, item.question).not.toMatch(/^((le|la|les|un|une) |l')/i)
  })

  it('ships Conjugaison française: every verb in all six persons, its infinitive in the question, its meaning under it, four options', () => {
    const verbs = packs.find((candidate) => candidate.id === 'conjugaison')!
    expect(verbs.name).toBe('Conjugaison française')
    expect(verbs.language).toBe('fr')
    const persons = ['je', 'tu', 'il-elle-on', 'nous', 'vous', 'ils-elles']
    const groups = ['regular-er', 'regular-ir', 'regular-re', 'irregular']
    const byVerb = new Map<string, string[]>()
    for (const item of verbs.items) {
      // "nous ___ (aller)", or "j'___ (aimer)" before a vowel.
      const infinitive = /^(?:\S+ |j')___ \((\S+)\)$/.exec(item.question)?.[1]
      expect(infinitive, item.question).toBeDefined()
      expect(item.subtitle, item.question).toBeDefined()
      expect(item.options, item.question).toHaveLength(4)
      expect(item.tags.filter((tag) => groups.includes(tag)), item.question).toHaveLength(1)
      const person = item.tags.filter((tag) => persons.includes(tag))
      expect(person, item.question).toHaveLength(1)
      byVerb.set(infinitive!, [...(byVerb.get(infinitive!) ?? []), person[0]])
    }
    expect(byVerb.size).toBeGreaterThanOrEqual(50)
    for (const [infinitive, seen] of byVerb) expect(seen.toSorted(), infinitive).toEqual(persons.toSorted())
  })

  it('ships a valid Back to School pack, every question tagged with its subject', () => {
    const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
    const pack = packs.find((candidate) => candidate.id === 'back-to-school')!
    expect(pack.items.length).toBeGreaterThanOrEqual(100)
    const subjects = ['maths', 'science', 'social-studies', 'entertainment', 'general']
    for (const item of pack.items) expect(item.tags.filter((tag) => subjects.includes(tag)), item.question).toHaveLength(1)
  })
})
