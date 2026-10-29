import { describe, expect, it } from 'vitest'
import type { Pack } from '../../content/pack'
import { createRng } from '../../rng'
import { choosePoolItems, drawFrom, newPool, type ItemPool } from './pool'

interface TestItem {
  text: string
  tags?: string[]
}

const itemKey = (item: TestItem) => item.text

function pack(id: string, items: TestItem[]): Pack<TestItem> {
  return { id, name: id, description: id, language: 'en', maturity: 'everyone', contributors: ['AdeizaSama'], items }
}

const food = pack('food', [{ text: 'Jollof', tags: ['dish'] }, { text: 'Puff puff', tags: ['snack'] }, { text: 'Zobo' }])
const school = pack('school', [{ text: 'Assembly' }, { text: 'jollof', tags: ['party'] }])
const packs = [food, school]

const texts = (items: readonly TestItem[]) => items.map((item) => item.text)

describe('choosePoolItems', () => {
  it('takes the chosen packs’ items in the order the packs were chosen', () => {
    expect(texts(choosePoolItems(packs, { packs: ['school', 'food'], tags: [] }, itemKey))).toEqual([
      'Assembly',
      'jollof',
      'Puff puff',
      'Zobo',
    ])
  })

  it('leaves out packs that were not chosen', () => {
    expect(texts(choosePoolItems(packs, { packs: ['school'], tags: [] }, itemKey))).toEqual(['Assembly', 'jollof'])
  })

  it('keeps an item in two chosen packs once, from the first pack chosen', () => {
    const items = choosePoolItems(packs, { packs: ['food', 'school'], tags: [] }, itemKey)
    expect(texts(items)).toEqual(['Jollof', 'Puff puff', 'Zobo', 'Assembly'])
    expect(items[0].tags).toEqual(['dish'])
  })

  it('with tags chosen, keeps only items with at least one of them', () => {
    expect(texts(choosePoolItems(packs, { packs: ['food', 'school'], tags: ['snack', 'party'] }, itemKey))).toEqual([
      'Puff puff',
      'jollof',
    ])
  })

  it('returns no items when nothing matches the tags', () => {
    expect(choosePoolItems(packs, { packs: ['food'], tags: ['sport'] }, itemKey)).toEqual([])
  })

  it('throws for a pack that does not exist', () => {
    expect(() => choosePoolItems(packs, { packs: ['anime'], tags: [] }, itemKey)).toThrow('No pack with id "anime"')
  })
})

describe('newPool', () => {
  it('shuffles every item into the pool, the same way for the same seed, without changing the list', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const pool = newPool(items, createRng(7))
    expect([...pool.remaining].sort()).toEqual(items)
    expect(pool.drawn).toEqual([])
    expect(newPool(items, createRng(7))).toEqual(pool)
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})

describe('drawFrom', () => {
  it('draws in pool order, moving each item to drawn, without changing the pool passed in', () => {
    const pool: ItemPool<string> = { remaining: ['a', 'b'], drawn: [] }
    const first = drawFrom(pool, createRng(1))
    expect(first.item).toBe('a')
    expect(first.pool).toEqual({ remaining: ['b'], drawn: ['a'] })
    expect(pool).toEqual({ remaining: ['a', 'b'], drawn: [] })
  })

  it('draws every item once before any repeats', () => {
    const rng = createRng(3)
    let pool = newPool(['a', 'b', 'c', 'd'], rng)
    const seen: string[] = []
    for (let i = 0; i < 4; i++) {
      const result = drawFrom(pool, rng)
      seen.push(result.item)
      pool = result.pool
    }
    expect([...seen].sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('when every item is drawn, shuffles them back in and keeps going', () => {
    const rng = createRng(5)
    let pool = newPool(['a', 'b', 'c'], rng)
    const seen: string[] = []
    for (let i = 0; i < 6; i++) {
      const result = drawFrom(pool, rng)
      seen.push(result.item)
      pool = result.pool
    }
    expect([...seen.slice(0, 3)].sort()).toEqual(['a', 'b', 'c'])
    expect([...seen.slice(3)].sort()).toEqual(['a', 'b', 'c'])
  })

  it('never draws the item just shown first after shuffling back in', () => {
    for (let seed = 0; seed < 50; seed++) {
      const result = drawFrom({ remaining: [], drawn: ['a', 'b', 'c', 'd'] }, createRng(seed))
      expect(result.item, `seed ${seed}`).not.toBe('d')
      expect(result.pool.remaining.at(-1), `seed ${seed}`).toBe('d')
    }
  })

  it('repeats the only item when the pool has one', () => {
    const result = drawFrom({ remaining: [], drawn: ['a'] }, createRng(1))
    expect(result.item).toBe('a')
    expect(result.pool).toEqual({ remaining: [], drawn: ['a'] })
  })

  it('throws for a pool with no items at all', () => {
    expect(() => drawFrom({ remaining: [], drawn: [] }, createRng(1))).toThrow('Cannot draw from an empty pool')
  })
})
