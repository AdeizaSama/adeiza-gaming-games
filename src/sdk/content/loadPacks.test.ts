import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import type { ItemKey } from './duplicates'
import { checkPack, loadPacks } from './loadPacks'
import type { Pack } from './pack'

// A stand-in item schema and key, shaped like Charades'.
const TestItem = z.strictObject({ text: z.string().min(1) })
type TestItem = z.infer<typeof TestItem>
const itemKey: ItemKey<TestItem> = (item) => item.text

/** A valid pack with the given id and item texts. */
function pack(id: string, ...texts: string[]) {
  return {
    id,
    name: id,
    description: `The ${id} pack.`,
    language: 'en',
    maturity: 'everyone',
    contributors: ['AdeizaSama'],
    items: texts.map((text) => ({ text })),
  }
}

describe('checkPack', () => {
  it('returns the pack when everything is right', () => {
    const result = checkPack('./content/anime.json', pack('anime', 'Goku', 'Naruto'), TestItem, itemKey)
    expect(result).toEqual({ ok: true, pack: pack('anime', 'Goku', 'Naruto') })
  })

  it('lists every schema problem, each with where it is', () => {
    const data = { ...pack('anime', 'Goku', ''), maturity: 'kids' }
    const result = checkPack('./content/anime.json', data, TestItem, itemKey)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.problems.map((problem) => problem.path)).toEqual(['maturity', 'items.1.text'])
  })

  it('reports a file that is not a pack at all as a problem with the whole file', () => {
    const result = checkPack('./content/anime.json', 'not a pack', TestItem, itemKey)
    expect(!result.ok && result.problems.map((problem) => problem.path)).toEqual([''])
  })

  it('rejects an id that does not match the file name', () => {
    const result = checkPack('./content/anime.json', pack('manga', 'Goku'), TestItem, itemKey)
    expect(result).toEqual({
      ok: false,
      problems: [{ path: 'id', message: 'The id must match the file name: "anime" (found "manga")' }],
    })
  })

  it('reads the file name from any kind of path', () => {
    for (const file of ['./content/anime.json', '/home/me/repo/content/anime.json', 'C:\\repo\\content\\anime.json', 'anime.json']) {
      expect(checkPack(file, pack('anime', 'Goku'), TestItem, itemKey).ok, file).toBe(true)
    }
  })

  it('rejects an item listed twice, pointing at both copies', () => {
    const result = checkPack('./content/anime.json', pack('anime', 'Goku', 'Naruto', 'goku'), TestItem, itemKey)
    expect(result).toEqual({
      ok: false,
      problems: [{ path: 'items.2', message: '"goku" is already in this pack at items.0' }],
    })
  })

  it('reports the id and duplicates together', () => {
    const result = checkPack('./content/anime.json', pack('manga', 'Goku', 'Goku'), TestItem, itemKey)
    expect(!result.ok && result.problems.map((problem) => problem.path)).toEqual(['id', 'items.1'])
  })

  it('skips the id and duplicate checks while the shape is wrong', () => {
    const data = { ...pack('manga', 'Goku', 'Goku'), maturity: 'kids' }
    const result = checkPack('./content/anime.json', data, TestItem, itemKey)
    expect(!result.ok && result.problems.map((problem) => problem.path)).toEqual(['maturity'])
  })
})

describe('loadPacks', () => {
  it('returns every pack, sorted by id', () => {
    const files = {
      './content/movies.json': pack('movies', 'Titanic'),
      './content/anime.json': pack('anime', 'Goku'),
    }
    expect(loadPacks(files, TestItem, itemKey).map((loaded) => loaded.id)).toEqual(['anime', 'movies'])
  })

  it('returns no packs for no files', () => {
    expect(loadPacks({}, TestItem, itemKey)).toEqual([])
  })

  it('throws one error listing every problem in every file', () => {
    const files = {
      './content/anime.json': pack('anime', 'Goku', 'Goku'),
      './content/movies.json': pack('films', 'Titanic'),
      './content/ok.json': pack('ok', 'Fine'),
    }
    expect(() => loadPacks(files, TestItem, itemKey)).toThrow(
      'Content packs have problems:\n' +
        '  ./content/anime.json, items.1: "Goku" is already in this pack at items.0\n' +
        '  ./content/movies.json, id: The id must match the file name: "movies" (found "films")',
    )
  })

  it('gives packs the item type from the item schema', () => {
    expectTypeOf(loadPacks({}, TestItem, itemKey)).toEqualTypeOf<Pack<TestItem>[]>()
  })
})
