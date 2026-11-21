import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { itemKey, itemSchema } from './schema'

/** Where each problem in an item is. */
const problems = (item: unknown) => {
  const result = itemSchema.safeParse(item)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('Pairs item schema', () => {
  it('needs a front and a back of at most 60 characters, filling in no tags, and rejects an unknown field', () => {
    expect(itemSchema.parse({ front: 'le chat', back: 'cat' })).toEqual({ front: 'le chat', back: 'cat', tags: [] })
    expect(problems({ front: ' ', back: 'x'.repeat(61) })).toEqual(['front', 'back'])
    expect(problems({ front: 'le chat', back: 'cat', meaning: 'cat' })).toHaveLength(1)
    expect(itemKey({ front: 'le chat', back: 'cat', tags: [] })).toBe('le chat')
  })
})

describe('Pairs content', () => {
  const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
  const pack = (id: string) => packs.find((candidate) => candidate.id === id)!

  it('ships Français–anglais: two-way, every English meaning one word’s, every noun with its article', () => {
    const words = pack('francais-anglais').items
    expect(words.length).toBeGreaterThanOrEqual(150)
    const backs = words.map((item) => item.back.toLowerCase())
    expect(new Set(backs).size).toBe(backs.length) // match-up needs each partner to be one word's
    for (const item of words) expect(item.front, item.front).toMatch(/^(le |la |l')/)
  })

  it('ships Les thèmes: one-way, every theme with at least 7 words, so odd-one-out always has a full group', () => {
    const groups = new Map<string, number>()
    for (const item of pack('les-themes').items) groups.set(item.back, (groups.get(item.back) ?? 0) + 1)
    expect(groups.size).toBeGreaterThanOrEqual(5)
    for (const [group, size] of groups) expect(size, group).toBeGreaterThanOrEqual(7)
  })
})
