import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findGames } from './games'

// Each test builds a throwaway games folder in the system's temp directory, and deletes it afterwards.
let gamesDir: string

beforeEach(() => {
  gamesDir = mkdtempSync(join(tmpdir(), 'kzw-games-'))
})

afterEach(() => {
  rmSync(gamesDir, { recursive: true, force: true })
})

/** Creates a file (and its folders) inside the throwaway games folder. */
function file(path: string): void {
  const full = join(gamesDir, path)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, '')
}

describe('findGames', () => {
  it('finds each game with its schema file and pack files, sorted', () => {
    file('trivia/schema.ts')
    file('trivia/content/general.json')
    file('charades/schema.ts')
    file('charades/content/movies.json')
    file('charades/content/anime.json')

    expect(findGames(gamesDir)).toEqual([
      {
        id: 'charades',
        schemaFile: join(gamesDir, 'charades', 'schema.ts'),
        packFiles: [join(gamesDir, 'charades', 'content', 'anime.json'), join(gamesDir, 'charades', 'content', 'movies.json')],
      },
      {
        id: 'trivia',
        schemaFile: join(gamesDir, 'trivia', 'schema.ts'),
        packFiles: [join(gamesDir, 'trivia', 'content', 'general.json')],
      },
    ])
  })

  it('reports a missing schema file as null', () => {
    file('charades/content/anime.json')
    expect(findGames(gamesDir)[0].schemaFile).toBeNull()
  })

  it('gives no pack files for a game without a content folder', () => {
    file('charades/schema.ts')
    expect(findGames(gamesDir)[0].packFiles).toEqual([])
  })

  it('only counts .json files directly in the content folder as packs', () => {
    file('charades/content/anime.json')
    file('charades/content/notes.md')
    file('charades/content/drafts/old.json')
    expect(findGames(gamesDir)[0].packFiles).toEqual([join(gamesDir, 'charades', 'content', 'anime.json')])
  })

  it('ignores files that are not game folders', () => {
    file('README.md')
    expect(findGames(gamesDir)).toEqual([])
  })

  it('returns no games when the games folder does not exist yet', () => {
    expect(findGames(join(gamesDir, 'missing'))).toEqual([])
  })
})
