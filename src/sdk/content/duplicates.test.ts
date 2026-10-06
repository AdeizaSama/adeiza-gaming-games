import { describe, expect, it } from 'vitest'
import { findDuplicates, uniqueBy, type ItemKey } from './duplicates'

// Stand-in items shaped like Charades': the key is `text`, and `modes` is ignored when comparing.
interface TestItem {
  text: string
  modes?: string[]
}

const itemKey: ItemKey<TestItem> = (item) => item.text

/** Items from texts, for tests that only care about the key. */
const items = (...texts: string[]): TestItem[] => texts.map((text) => ({ text }))

describe('findDuplicates', () => {
  it('finds nothing in a list without duplicates, or an empty list', () => {
    expect(findDuplicates(items('Goku', 'Naruto', 'Luffy'), itemKey)).toEqual([])
    expect(findDuplicates([], itemKey)).toEqual([])
  })

  it('reports where the extra copy is and where the first copy is', () => {
    expect(findDuplicates(items('Goku', 'Naruto', 'Goku'), itemKey)).toEqual([{ index: 2, firstIndex: 0, key: 'Goku' }])
  })

  it('reports every extra copy, each pointing at the first', () => {
    expect(findDuplicates(items('a', 'b', 'a', 'a'), itemKey)).toEqual([
      { index: 2, firstIndex: 0, key: 'a' },
      { index: 3, firstIndex: 0, key: 'a' },
    ])
  })

  it('ignores case and extra spaces', () => {
    const found = findDuplicates(items('Monkey D. Luffy', ' monkey d. luffy ', 'MONKEY  D.  LUFFY'), itemKey)
    expect(found.map((duplicate) => duplicate.index)).toEqual([1, 2])
  })

  it('treats the two ways of storing an accented letter as the same', () => {
    // 'é' as one character, and as 'e' followed by a combining accent: they look identical.
    expect(findDuplicates(items('Pokémon', 'Pokémon'), itemKey)).toHaveLength(1)
  })

  it('keeps words that differ only by accents apart', () => {
    // Yoruba: ọkọ (husband) and oko (farm) are different words.
    expect(findDuplicates(items('ọkọ', 'oko'), itemKey)).toEqual([])
  })

  it('compares only the key, not the other fields', () => {
    const goku = [
      { text: 'Goku', modes: ['act'] },
      { text: 'Goku', modes: ['describe'] },
    ]
    expect(findDuplicates(goku, itemKey)).toHaveLength(1)
  })
})

describe('uniqueBy', () => {
  it('keeps the first copy of each item, in the original order', () => {
    const picked = [
      { text: 'Goku', modes: ['act'] }, // from the first pack picked
      { text: 'Naruto' },
      { text: 'goku', modes: ['describe'] }, // the same item from a second pack
    ]
    expect(uniqueBy(picked, itemKey)).toEqual([{ text: 'Goku', modes: ['act'] }, { text: 'Naruto' }])
  })

  it('returns every item when there are no duplicates, without changing the original', () => {
    const original = items('Goku', 'Naruto')
    const snapshot = structuredClone(original)
    const result = uniqueBy(original, itemKey)
    expect(result).toEqual(snapshot)
    expect(result).not.toBe(original)
    expect(original).toEqual(snapshot)
  })

  it('handles an empty list', () => {
    expect(uniqueBy([], itemKey)).toEqual([])
  })
})
