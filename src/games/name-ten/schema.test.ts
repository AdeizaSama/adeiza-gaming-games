import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { itemKey, itemSchema } from './schema'

/** Ten answers, Zero to Nine. */
const ten = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']

/** Every problem in an item, as `path: message`. */
function problems(item: unknown): string[] {
  const result = itemSchema.safeParse(item)
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}

describe('Name Ten item schema', () => {
  it('needs a category and its answers, filling in no tags', () => {
    expect(itemSchema.parse({ category: 'Numbers', answers: ten })).toEqual({ category: 'Numbers', answers: ten, tags: [] })
  })

  it('needs 10 to 20 answers, each 1 to 50 characters, and a category of at most 60', () => {
    expect(problems({ category: 'Numbers', answers: ten.slice(0, 9) })).toEqual(['answers: List at least 10 answers: a turn deals up to 15 onto the board'])
    expect(problems({ category: 'Numbers', answers: [...ten, ...ten.map((answer) => `${answer}!`), 'Twenty'] })).toEqual([
      'answers: List at most 20 answers: the first 10 to 15 people shout should be the ones here',
    ])
    expect(problems({ category: 'Numbers', answers: [...ten.slice(1), ' '] }).map((problem) => problem.split(':')[0])).toEqual(['answers.9'])
    expect(problems({ category: 'Numbers', answers: [...ten.slice(1), 'a'.repeat(51)] }).map((problem) => problem.split(':')[0])).toEqual(['answers.9'])
    expect(problems({ category: 'a'.repeat(61), answers: ten }).map((problem) => problem.split(':')[0])).toEqual(['category'])
  })

  it('reports an answer listed twice, ignoring case and spaces, where the copy is', () => {
    expect(problems({ category: 'Numbers', answers: [...ten.slice(0, 9), ' zero '] })).toEqual(['answers.9: "zero" is already an answer at answers.0'])
  })

  it('checks tags, and rejects an unknown field', () => {
    expect(problems({ category: 'Numbers', answers: ten, tags: ['Maths'] }).map((problem) => problem.split(':')[0])).toEqual(['tags.0'])
    expect(problems({ category: 'Numbers', answers: ten, items: ten })).toHaveLength(1)
  })

  it('names a category by its name', () => {
    expect(itemKey({ category: 'Numbers', answers: ten, tags: [] })).toBe('Numbers')
  })
})

describe('Name Ten content', () => {
  it('ships a valid Back to School pack, every category with 10 to 20 answers', () => {
    const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
    const pack = packs.find((candidate) => candidate.id === 'back-to-school')!
    expect(pack.items.length).toBeGreaterThanOrEqual(30)
    for (const item of pack.items) expect(item.answers.length, item.category).toBeGreaterThanOrEqual(10)
  })
})
