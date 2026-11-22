import { describe, expect, it } from 'vitest'
import { checkVariant, loadVariants } from './variant'

const variant = {
  id: 'quick-food',
  name: 'Quick Food',
  tagline: 'Food, fast.',
  categories: ['party'],
  packs: ['food'],
  settings: { seconds: 30 },
  open: ['rounds'],
  contributors: ['AdeizaSama'],
}

/** Where each problem in a variant file is. */
const problems = (file: string, data: unknown) => {
  const result = checkVariant(file, data)
  return result.ok ? [] : result.problems.map((problem) => problem.path)
}

describe('checkVariant', () => {
  it('accepts a variant file, filling in no tags, no settings and no open settings', () => {
    expect(checkVariant('variants/quick-food.json', variant)).toEqual({ ok: true, variant: { ...variant, tags: [], freePlay: false } })
    const least = { id: 'quick-food', name: 'Quick Food', tagline: 'Food, fast.', categories: ['party'], packs: ['food'], contributors: ['AdeizaSama'] }
    expect(checkVariant('quick-food.json', least)).toEqual({ ok: true, variant: { ...least, tags: [], settings: {}, open: [], freePlay: false } })
  })

  it('needs its id to be its file name, at least one pack, a name and contributors, and no unknown fields', () => {
    expect(problems('variants\\food.json', variant)).toEqual(['id'])
    expect(problems('quick-food.json', { ...variant, packs: [] })).toEqual(['packs'])
    expect(problems('quick-food.json', { ...variant, name: ' ', contributors: [] })).toEqual(['name', 'contributors'])
    expect(problems('quick-food.json', { ...variant, presets: [] })).toHaveLength(1)
  })

  it('needs at least one category, each from the list and listed once', () => {
    expect(problems('quick-food.json', { ...variant, categories: undefined })).toEqual(['categories'])
    expect(problems('quick-food.json', { ...variant, categories: [] })).toEqual(['categories'])
    expect(problems('quick-food.json', { ...variant, categories: ['nigerian'] })).toEqual(['categories.0'])
    expect(problems('quick-food.json', { ...variant, categories: ['party', 'party'] })).toEqual(['categories'])
  })
})

describe('loadVariants', () => {
  it('loads every file, sorted by id, and throws one error listing every problem', () => {
    const files = { './variants/quick-food.json': variant, './variants/all-food.json': { ...variant, id: 'all-food' } }
    expect(loadVariants(files).map((loaded) => loaded.id)).toEqual(['all-food', 'quick-food'])
    expect(() => loadVariants({ './variants/a.json': variant, './variants/b.json': { ...variant, id: 'b', packs: [] } })).toThrow(
      /a\.json, id: The id must match the file name: "a"[\s\S]*b\.json, packs:/,
    )
  })
})
