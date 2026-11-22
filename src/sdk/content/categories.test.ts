import { describe, expect, it } from 'vitest'
import { categories, categoryLabel, loadCategories } from './categories'

describe('categories', () => {
  it('loads the shipped list, each id once with a label', () => {
    expect(categories.map(({ id }) => id)).toEqual(['party', 'learning', 'trivia', 'words', 'school', 'french', 'naija'])
    expect(categoryLabel('school')).toBe('Back to School')
  })

  it('refuses a list with a bad id, a blank or long label, or an id used twice', () => {
    expect(() => loadCategories([{ id: 'Party', label: 'Party' }])).toThrow(/0\.id/)
    expect(() => loadCategories([{ id: 'party', label: ' ' }])).toThrow(/0\.label/)
    expect(() => loadCategories([{ id: 'party', label: 'A label far too long for a button' }])).toThrow(/20 characters/)
    expect(() => loadCategories([{ id: 'party', label: 'Party' }, { id: 'party', label: 'Fun' }])).toThrow(/used once/)
    expect(() => loadCategories([])).toThrow(/whole file/)
  })
})
